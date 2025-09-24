// src/components/DeleteConfirmModal.tsx
import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  positionSymbol?: string;
  notesCount?: number;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  positionSymbol,
  notesCount = 0,
  loading = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is done in parent component
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full border border-gray-200 shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Confirm Deletion</h2>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-gray-900 font-medium">Delete this stock position?</p>
              <p className="text-sm text-gray-600 mt-1">
                This will permanently delete the position and all related analysis notes. This action cannot be undone.
              </p>
            </div>
          </div>
          
          {positionSymbol && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">{positionSymbol}</span>
                <span className="text-sm text-gray-600">
                  {notesCount} {notesCount === 1 ? 'note' : 'notes'} will be deleted
                </span>
              </div>
            </div>
          )}

          {notesCount > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Deleting this position will also remove {notesCount} analysis {notesCount === 1 ? 'note' : 'notes'}.
              </p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete Position
          </button>
        </div>
      </div>
    </div>
  );
};