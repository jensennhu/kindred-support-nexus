// src/components/NoteColumn.tsx
import React from 'react';
import { LucideIcon, DollarSign, Users, TrendingUpDown, Gavel, Wrench, Globe } from 'lucide-react';
import { AnalysisNote } from '@/hooks/useAnalysisNotes';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableNote } from './SortableNote';

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
      className={`min-h-[100px] p-2 rounded-lg border transition-colors ${
        isOver ? "bg-blue-50 border-blue-400" : "bg-gray-50 border-gray-200"
      }`}
    >
      {children}
    </div>
  );
}

interface NoteColumnProps {
  type: 'catalyst' | 'block' | 'research';
  title: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  countColor: string;
  notes: AnalysisNote[];
  onNoteClick: (note: AnalysisNote) => void;
  onNoteEdit: (note: AnalysisNote) => void;
  onNoteDelete: (noteId: string) => Promise<void>;
}

export const NoteColumn: React.FC<NoteColumnProps> = ({
  type,
  title,
  icon: Icon,
  iconColor,
  bgColor,
  countColor,
  notes,
  onNoteClick,
  onNoteEdit,
  onNoteDelete
}) => {
  // For research notes, show all in one section
  if (type === 'research') {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className={`p-4 border-b border-gray-200 ${bgColor}`}>
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className={`px-2 py-1 rounded-full text-sm font-medium ${countColor}`}>
              {notes.length}
            </span>
          </div>
        </div>

        <div className="p-4">
          <SortableContext
            items={notes.map(n => n.id)}
            strategy={verticalListSortingStrategy}
          >
            <DroppableContainer id="research-general">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${iconColor}`} />
                <h4 className="font-medium text-sm text-gray-900">General Research</h4>
                <span className="text-xs text-gray-500">({notes.length})</span>
              </div>

              <div className="space-y-3">
                {notes
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(note => (
                    <SortableNote
                      key={note.id}
                      note={note}
                      onNoteClick={onNoteClick}
                      onNoteEdit={onNoteEdit}
                      onNoteDelete={onNoteDelete}
                    />
                  ))}

                {notes.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-500">Drop research notes here</p>
                  </div>
                )}
              </div>
            </DroppableContainer>
          </SortableContext>
        </div>
      </div>
    );
  }

  // For catalysts and blocks, group by parent category
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className={`p-4 border-b border-gray-200 ${bgColor}`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${countColor}`}>
            {notes.length}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {PARENT_CATEGORIES.map(parentCat => {
          const Icon = parentCat.icon;
          const categoryNotes = notes
            .filter(n => n.parentCategory === parentCat.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return (
            <SortableContext
              key={`${type}-${parentCat.id}`}
              items={categoryNotes.map(n => n.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableContainer id={`${type}-${parentCat.id}`}>
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
                      onNoteClick={onNoteClick}
                      onNoteEdit={onNoteEdit}
                      onNoteDelete={onNoteDelete}
                    />
                  ))}

                  {categoryNotes.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-500">Drop notes here</p>
                    </div>
                  )}
                </div>
              </DroppableContainer>
            </SortableContext>
          );
        })}
      </div>
    </div>
  );
};