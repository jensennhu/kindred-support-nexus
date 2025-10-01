// src/components/AnalysisBoard.tsx
import React from 'react';
import { Plus, Zap, AlertTriangle, Brain, DollarSign, Users, TrendingUpDown, Gavel, Wrench, Globe } from 'lucide-react';
import { AnalysisNote } from '@/hooks/useAnalysisNotes';
import { LoadingSpinner } from './LoadingSpinner';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableNote } from './SortableNote';
import { EditNoteModal } from './EditNoteModal';

import { createPortal } from 'react-dom';

const PARENT_CATEGORIES = [
  { id: 'financial', name: 'Financial', icon: DollarSign, color: 'text-emerald-600' },
  { id: 'management', name: 'Management', icon: Users, color: 'text-blue-600' },
  { id: 'market', name: 'Market', icon: TrendingUpDown, color: 'text-purple-600' },
  { id: 'regulatory', name: 'Regulatory', icon: Gavel, color: 'text-orange-600' },
  { id: 'operational', name: 'Operational', icon: Wrench, color: 'text-gray-600' },
  { id: 'competitive', name: 'Competitive', icon: Globe, color: 'text-red-600' },
];

interface DroppableContainerProps {
  id: string;
  children: React.ReactNode;
}

function DroppableContainer({ id, children }: DroppableContainerProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] p-3 rounded-lg border-2 border-dashed transition-all ${
        isOver 
          ? "bg-blue-50 border-blue-400 shadow-md" 
          : "bg-gray-50 border-gray-200 hover:border-gray-300"
      }`}
    >
      {children}
    </div>
  );
}

interface AnalysisBoardProps {
  selectedStock: string;
  notes: AnalysisNote[];
  onAddNote: () => void;
  onUpdateNote: (noteId: string, updates: Partial<AnalysisNote>) => Promise<AnalysisNote>;
  onDeleteNote: (noteId: string) => Promise<void>;
  loading?: boolean;
  onShowSuccess: (message: string, title?: string) => void;
  onShowError: (message: string, title?: string) => void;
}

export const AnalysisBoard: React.FC<AnalysisBoardProps> = ({
  selectedStock,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  loading = false,
  onShowSuccess,
  onShowError
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [draggedNote, setDraggedNote] = React.useState<AnalysisNote | null>(null);
  const [editingNote, setEditingNote] = React.useState<AnalysisNote | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const note = notes.find(n => n.id === active.id);
    setDraggedNote(note || null);
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setDraggedNote(null);
    
    if (!over) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    if (activeId === overId) return;
  
    const activeNote = notes.find(n => n.id === activeId);
    if (!activeNote) return;

    // Parse the drop zone ID
    if (overId.includes("-")) {
      const [newCategory, newParentCategory] = overId.split("-");

      try {
        let updates: Partial<AnalysisNote> = {};
        
        if (newCategory === "research") {
          updates = {
            category: "research" as const,
            parentCategory: "general",
            sentiment: undefined,
          };
        } else if (newCategory === "catalyst") {
          updates = {
            category: "catalyst" as const,
            parentCategory: newParentCategory,
            sentiment: "bullish" as const,
          };
        } else if (newCategory === "block") {
          updates = {
            category: "block" as const,
            parentCategory: newParentCategory,
            sentiment: "bearish" as const,
          };
        }

        await onUpdateNote(activeId, updates);
        onShowSuccess(`Moved "${activeNote.title}" to ${newCategory} category`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to move note';
        onShowError(message, 'Move Failed');
      }
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  // Handle note editing
  const handleNoteEdit = (note: AnalysisNote) => {
    setEditingNote(note);
    setIsEditModalOpen(true);
  };

  const handleNoteView = (note: AnalysisNote) => {
    // For now, just log the note view
    console.log('Viewing note:', note);
    // In the future, this could open a view-only modal or navigate to a detail page
  };

  const handleEditSubmit = async (noteId: string, updates: Partial<AnalysisNote>) => {
    try {
      await onUpdateNote(noteId, updates);
      onShowSuccess('Note updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update note';
      onShowError(message, 'Update Failed');
      throw error;
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingNote(null);
  };

  if (loading) {
    return <LoadingSpinner text="Loading analysis..." />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedStock} Analysis Board</h2>
            <p className="text-gray-600">Drag notes between categories to reorganize your analysis</p>
          </div>
          <button
            onClick={onAddNote}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
        </div>

        {/* Analysis Columns - Full width */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Catalysts Column */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Catalysts</h3>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                  {notes.filter(n => n.category === "catalyst").length}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {PARENT_CATEGORIES.map(parentCat => {
                const Icon = parentCat.icon;
                const categoryNotes = notes
                  .filter(n => n.category === "catalyst" && n.parentCategory === parentCat.id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return (
                  <div key={`catalyst-${parentCat.id}`}>
                    <SortableContext
                      items={categoryNotes.map(n => n.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <DroppableContainer id={`catalyst-${parentCat.id}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className={`w-4 h-4 ${parentCat.color}`} />
                          <h4 className="font-medium text-sm text-gray-900">{parentCat.name}</h4>
                          <span className="text-xs text-gray-500">({categoryNotes.length})</span>
                        </div>

                        <div className="space-y-3">
                          {categoryNotes.map(note => (
                            <SortableNote
                              key={note.id}
                              note={note}
                              onNoteClick={handleNoteView}
                              onNoteEdit={handleNoteEdit}
                              onNoteDelete={onDeleteNote}
                            />
                          ))}

                          {categoryNotes.length === 0 && (
                            <div className="text-center py-2">
                              <p className="text-xs text-gray-400">Drop catalyst notes here</p>
                            </div>
                          )}
                        </div>
                      </DroppableContainer>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blockers Column */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-orange-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Blockers</h3>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                  {notes.filter(n => n.category === "block").length}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {PARENT_CATEGORIES.map(parentCat => {
                const Icon = parentCat.icon;
                const categoryNotes = notes
                  .filter(n => n.category === "block" && n.parentCategory === parentCat.id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return (
                  <div key={`block-${parentCat.id}`}>
                    <SortableContext
                      items={categoryNotes.map(n => n.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <DroppableContainer id={`block-${parentCat.id}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className={`w-4 h-4 ${parentCat.color}`} />
                          <h4 className="font-medium text-sm text-gray-900">{parentCat.name}</h4>
                          <span className="text-xs text-gray-500">({categoryNotes.length})</span>
                        </div>

                        <div className="space-y-3">
                          {categoryNotes.map(note => (
                            <SortableNote
                              key={note.id}
                              note={note}
                              onNoteClick={handleNoteView}
                              onNoteEdit={handleNoteEdit}
                              onNoteDelete={onDeleteNote}
                            />
                          ))}

                          {categoryNotes.length === 0 && (
                            <div className="text-center py-2">
                              <p className="text-xs text-gray-400">Drop blocker notes here</p>
                            </div>
                          )}
                        </div>
                      </DroppableContainer>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Research Column */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Research</h3>
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
                  {notes.filter(n => n.category === "research").length}
                </span>
              </div>
            </div>

            <div className="p-4">
              <SortableContext
                items={notes.filter(n => n.category === "research").map(n => n.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableContainer id="research-general">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-gray-600" />
                    <h4 className="font-medium text-sm text-gray-900">General Research</h4>
                    <span className="text-xs text-gray-500">
                      ({notes.filter(n => n.category === "research").length})
                    </span>
                  </div>

                  <div className="space-y-3">
                    {notes
                      .filter(n => n.category === "research")
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(note => (
                        <SortableNote
                          key={note.id}
                          note={note}
                          onNoteClick={handleNoteView}
                          onNoteEdit={handleNoteEdit}
                          onNoteDelete={onDeleteNote}
                        />
                      ))}

                    {notes.filter(n => n.category === "research").length === 0 && (
                      <div className="text-center py-2">
                        <p className="text-xs text-gray-400">Drop research notes here</p>
                      </div>
                    )}
                  </div>
                </DroppableContainer>
              </SortableContext>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {notes.length === 0 && (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No analysis notes for {selectedStock} yet.</p>
            <button
              onClick={onAddNote}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Note
            </button>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeId && draggedNote ? (
            <div className="transform rotate-12 opacity-90">
              <SortableNote
                note={draggedNote}
                onNoteClick={() => {}}
                onNoteEdit={() => {}}
                onNoteDelete={async () => {}}
              />
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}

      {/* Edit Note Modal */}
      <EditNoteModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        note={editingNote}
        stockSymbol={selectedStock}
        loading={loading}
      />
    </DndContext>
  );
};