// src/components/EditNoteModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, DollarSign, Users, TrendingUpDown, Gavel, Wrench, Globe } from 'lucide-react';
import { AnalysisNote } from '@/hooks/useAnalysisNotes';

export interface EditNoteData {
  sentiment?: 'bullish' | 'bearish';
  category: 'catalyst' | 'block' | 'research';
  parentCategory: string;
  title: string;
  description: string;
  date: string;
  tags: string;
}

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (noteId: string, updates: Partial<AnalysisNote>) => Promise<void>;
  note: AnalysisNote | null;
  stockSymbol?: string;
  loading?: boolean;
  error?: string;
}

const PARENT_CATEGORIES = [
  { id: 'financial', name: 'Financial', icon: DollarSign, color: 'text-emerald-600' },
  { id: 'management', name: 'Management', icon: Users, color: 'text-blue-600' },
  { id: 'market', name: 'Market', icon: TrendingUpDown, color: 'text-purple-600' },
  { id: 'regulatory', name: 'Regulatory', icon: Gavel, color: 'text-orange-600' },
  { id: 'operational', name: 'Operational', icon: Wrench, color: 'text-gray-600' },
  { id: 'competitive', name: 'Competitive', icon: Globe, color: 'text-red-600' },
];

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  note,
  stockSymbol,
  loading = false,
  error
}) => {
  const [editData, setEditData] = useState<EditNoteData>({
    category: 'research',
    parentCategory: 'general',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    tags: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens or note changes
  useEffect(() => {
    if (isOpen && note) {
      setEditData({
        sentiment: note.sentiment,
        category: note.category,
        parentCategory: note.parentCategory,
        title: note.title,
        description: note.description,
        date: note.date,
        tags: note.tags.join(', ')
      });
      setValidationErrors({});
    }
  }, [isOpen, note]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editData.title.trim()) {
      errors.title = 'Title is required';
    } else if (editData.title.length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
    }

    if (!editData.description.trim()) {
      errors.description = 'Description is required';
    } else if (editData.description.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }

    if (editData.category !== 'research' && !editData.sentiment) {
      errors.sentiment = 'Sentiment is required for catalyst and block notes';
    }

    if (!editData.date) {
      errors.date = 'Date is required';
    }

    // Validate tags format
    if (editData.tags.trim()) {
      const tags = editData.tags.split(',').map(t => t.trim()).filter(t => t);
      if (tags.length > 10) {
        errors.tags = 'Maximum 10 tags allowed';
      }
      for (const tag of tags) {
        if (tag.length > 20) {
          errors.tags = 'Each tag must be 20 characters or less';
          break;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !note) return;

    try {
      const updates: Partial<AnalysisNote> = {
        sentiment: editData.sentiment,
        category: editData.category,
        parentCategory: editData.parentCategory,
        title: editData.title.trim(),
        description: editData.description.trim(),
        date: editData.date,
        tags: editData.tags.trim() ? editData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      };

      await onSubmit(note.id, updates);
      onClose();
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleInputChange = (field: keyof EditNoteData, value: string | undefined) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCategoryChange = (category: 'catalyst' | 'block' | 'research') => {
    const updates: Partial<EditNoteData> = {
      category,
      sentiment: category === 'research' ? undefined : (editData.sentiment || 'bullish'),
      parentCategory: category === 'research' ? 'general' : editData.parentCategory,
    };
    
    setEditData(prev => ({ ...prev, ...updates }));
    
    // Clear validation errors for changed fields
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.category;
      if (category === 'research') delete newErrors.sentiment;
      return newErrors;
    });
  };

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Edit Note {stockSymbol && `for ${stockSymbol}`}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Date</label>
              <input
                type="date"
                value={editData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                  validationErrors.date ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {validationErrors.date && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Category*</label>
              <select
                value={editData.category}
                onChange={(e) => handleCategoryChange(e.target.value as 'catalyst' | 'block' | 'research')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                disabled={loading}
              >
                <option value="catalyst">Catalyst (Driver)</option>
                <option value="block">Block (Obstacle)</option>
                <option value="research">Research Note</option>
              </select>
            </div>

            {editData.category !== 'research' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Sentiment*</label>
                <select
                  value={editData.sentiment || 'bullish'}
                  onChange={(e) => handleInputChange('sentiment', e.target.value as 'bullish' | 'bearish')}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                    validationErrors.sentiment ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <option value="bullish">Bullish</option>
                  <option value="bearish">Bearish</option>
                </select>
                {validationErrors.sentiment && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.sentiment}</p>
                )}
              </div>
            )}
          </div>

          {editData.category !== 'research' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Parent Category*</label>
              <select
                value={editData.parentCategory}
                onChange={(e) => handleInputChange('parentCategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                disabled={loading}
              >
                {PARENT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Title* ({editData.title.length}/100)
            </label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                validationErrors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Brief title for this analysis point"
              maxLength={100}
              disabled={loading}
            />
            {validationErrors.title && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Analysis* ({editData.description.length}/2000)
            </label>
            <textarea
              value={editData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                validationErrors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Detailed analysis of this catalyst, block, or research point..."
              maxLength={2000}
              disabled={loading}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Tags (comma-separated, max 10)
            </label>
            <input
              type="text"
              value={editData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                validationErrors.tags ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="earnings, tech, regulation"
              disabled={loading}
            />
            {validationErrors.tags && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.tags}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};