import React, { useState } from 'react';
import { Plus, Calendar, Edit3, Trash2, Save, X } from 'lucide-react';
import { DailyNote, useDailyNotes } from '@/hooks/useDailyNotes';
import { LoadingSpinner } from './LoadingSpinner';

interface DailyNotesProps {
  onShowSuccess: (message: string) => void;
  onShowError: (message: string) => void;
}

export const DailyNotes: React.FC<DailyNotesProps> = ({ onShowSuccess, onShowError }) => {
  const { notes, loading, addNote, updateNote, deleteNote } = useDailyNotes();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ date: new Date().toISOString().split('T')[0], content: '' });
  const [editContent, setEditContent] = useState('');

  const handleAddNote = async () => {
    if (!newNote.content.trim()) return;

    try {
      await addNote(newNote);
      setNewNote({ date: new Date().toISOString().split('T')[0], content: '' });
      setIsAdding(false);
      onShowSuccess('Daily note added');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add note';
      onShowError(message);
    }
  };

  const handleEditNote = (note: DailyNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateNote(noteId, { content: editContent });
      setEditingId(null);
      setEditContent('');
      onShowSuccess('Note updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update note';
      onShowError(message);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNote(noteId);
      onShowSuccess('Note deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete note';
      onShowError(message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewNote({ date: new Date().toISOString().split('T')[0], content: '' });
  };

  if (loading) {
    return <LoadingSpinner text="Loading daily notes..." />;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Daily Notes</h3>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="Add daily note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {/* Add note form */}
        {isAdding && (
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <input
              type="date"
              value={newNote.date}
              onChange={(e) => setNewNote(prev => ({ ...prev, date: e.target.value }))}
              className="w-full mb-2 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter your daily note..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={cancelAdd}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                <X className="w-3 h-3" />
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.content.trim()}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Notes list */}
        {notes.map((note) => (
          <div key={note.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{note.date}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEditNote(note)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit note"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {editingId === note.id ? (
              <>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={cancelEdit}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleSaveEdit(note.id)}
                    disabled={!editContent.trim()}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-3 h-3" />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            )}
          </div>
        ))}

        {notes.length === 0 && !isAdding && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No daily notes yet</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-2 text-blue-600 text-sm hover:text-blue-800"
            >
              Add your first note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};