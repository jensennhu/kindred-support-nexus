// src/components/SortableNote.tsx
import React, { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Edit3, Trash2, GripVertical } from 'lucide-react';
import { AnalysisNote } from '@/hooks/useAnalysisNotes';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableNoteProps {
  note: AnalysisNote;
  onNoteClick: (note: AnalysisNote) => void;
  onNoteEdit: (note: AnalysisNote) => void;
  onNoteDelete: (noteId: string) => Promise<void>;
}

export const SortableNote: React.FC<SortableNoteProps> = ({
  note,
  onNoteClick,
  onNoteEdit,
  onNoteDelete
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: note.id,
    data: {
      type: 'Note',
      note,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Different styling for research notes
  const getNoteStyling = () => {
    if (note.category === 'research') {
      return 'bg-gray-50 border-l-gray-500 border border-gray-200 hover:bg-gray-100';
    }
    return note.sentiment === 'bullish' 
      ? 'bg-green-50 border-l-green-500 border border-green-200 hover:bg-green-100' 
      : 'bg-red-50 border-l-red-500 border border-red-200 hover:bg-red-100';
  };

  const getSentimentIcon = () => {
    if (note.category === 'research') {
      return <Brain className="w-4 h-4 text-gray-600" />;
    }
    return note.sentiment === 'bullish' ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTagStyling = () => {
    if (note.category === 'research') {
      return 'bg-gray-100 text-gray-800';
    }
    return note.sentiment === 'bullish' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      setIsDeleting(true);
      try {
        await onNoteDelete(note.id);
      } catch (error) {
        console.error('Failed to delete note:', error);
      } finally {
        setIsDeleting(false);
      }
    }
    setShowActions(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNoteEdit(note);
    setShowActions(false);
  };

  const handleNoteClick = (e: React.MouseEvent) => {
    // Don't trigger note click if clicking on drag handle or actions
    if ((e.target as HTMLElement).closest('.drag-handle') || 
        (e.target as HTMLElement).closest('.note-actions')) {
      return;
    }
    onNoteClick(note);
  };

  const handleNoteEdit = (e: React.MouseEvent) => {
    // Don't trigger note edit if clicking on drag handle or actions
    if ((e.target as HTMLElement).closest('.drag-handle') || 
        (e.target as HTMLElement).closest('.note-actions')) {
      return;
    }
    onNoteEdit(note);
  };

  // Show ghost placeholder while dragging
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-gray-200 border-2 border-dashed border-gray-400 p-4 rounded-lg"
      >
        <div className="h-20 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative p-4 rounded-lg border-l-4 cursor-pointer transition-all group ${getNoteStyling()} hover:shadow-md`}
      onClick={handleNoteClick}
      onDoubleClick={handleNoteEdit}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Drag handle */}
      <div 
        {...listeners}
        {...attributes}
        className="drag-handle absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-white/50 rounded"
        title="Drag to move note"
      >
        <GripVertical className="w-3 h-3 text-gray-400" />
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="note-actions absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-md p-1 shadow-sm">
          <button
            onClick={handleEdit}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="Edit note"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
            title="Delete note"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Note content */}
      <div className="pl-6">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900 pr-8 leading-tight text-sm">
            {note.title}
          </h4>
          <div className="flex items-center gap-1 flex-shrink-0">
            {getSentimentIcon()}
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
          {note.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{new Date(note.date).toLocaleDateString()}</span>
          {note.category !== 'research' && note.parentCategory && (
            <span className="capitalize text-xs bg-gray-100 px-1.5 py-0.5 rounded">
              {note.parentCategory}
            </span>
          )}
        </div>

        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getTagStyling()}`}>
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-gray-500 px-1.5 py-0.5">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};