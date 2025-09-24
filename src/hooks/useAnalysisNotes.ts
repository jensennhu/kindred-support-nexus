// src/hooks/useAnalysisNotes.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AnalysisNote {
  id: string;
  stockId: string;
  symbol: string;
  sentiment?: 'bullish' | 'bearish';
  category: 'catalyst' | 'block' | 'research';
  parentCategory: string;
  title: string;
  description: string;
  date: string;
  timestamp: string;
  tags: string[];
}

export interface NewAnalysisNote {
  sentiment?: 'bullish' | 'bearish';
  category: 'catalyst' | 'block' | 'research';
  parentCategory: string;
  title: string;
  description: string;
  date: string;
  tags: string;
}

export interface AnalysisNotesError {
  message: string;
  type: 'network' | 'validation' | 'database' | 'unknown';
}

export function useAnalysisNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<AnalysisNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AnalysisNotesError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Fetch notes with proper error handling
  const fetchNotes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('analysis_notes')
        .select('*')
        .order('timestamp', { ascending: false });

      if (supabaseError) {
        throw new Error(`Database error: ${supabaseError.message}`);
      }

      const formattedNotes: AnalysisNote[] = (data || []).map(row => ({
        id: row.id,
        stockId: row.stock_position_id,
        symbol: row.symbol,
        sentiment: row.sentiment as 'bullish' | 'bearish' | undefined,
        category: row.category as 'catalyst' | 'block' | 'research',
        parentCategory: row.parent_category,
        title: row.title,
        description: row.description,
        date: row.date,
        timestamp: row.timestamp,
        tags: Array.isArray(row.tags) ? row.tags : [],
      }));

      setNotes(formattedNotes);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError({
        message: errorMessage,
        type: errorMessage.includes('Database') ? 'database' : 'unknown'
      });
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Validate note data
  const validateNote = (note: NewAnalysisNote, stockId?: string, symbol?: string): string | null => {
    if (!stockId) {
      return 'Stock ID is required';
    }
    
    if (!symbol?.trim()) {
      return 'Stock symbol is required';
    }
    
    if (!note.title.trim()) {
      return 'Title is required';
    }
    
    if (note.title.length > 100) {
      return 'Title cannot exceed 100 characters';
    }
    
    if (!note.description.trim()) {
      return 'Description is required';
    }
    
    if (note.description.length > 2000) {
      return 'Description cannot exceed 2000 characters';
    }
    
    if (!['catalyst', 'block', 'research'].includes(note.category)) {
      return 'Invalid category';
    }
    
    if (note.category !== 'research' && !note.sentiment) {
      return 'Sentiment is required for catalyst and block notes';
    }
    
    if (note.category === 'research' && note.sentiment) {
      return 'Research notes should not have sentiment';
    }
    
    return null;
  };

  // Add note with validation
  const addNote = useCallback(async (
    stockId: string, 
    symbol: string, 
    newNote: NewAnalysisNote
  ): Promise<AnalysisNote> => {
    if (!user) {
      throw new Error('User must be logged in to add notes');
    }

    // Validate input
    const validationError = validateNote(newNote, stockId, symbol);
    if (validationError) {
      const error: AnalysisNotesError = {
        message: validationError,
        type: 'validation'
      };
      setError(error);
      throw new Error(validationError);
    }

    try {
      clearError();
      
      // Parse and validate tags
      const parsedTags = newNote.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag && tag.length > 0)
        .slice(0, 10); // Limit to 10 tags

      const { data, error: supabaseError } = await supabase
        .from('analysis_notes')
        .insert({
          user_id: user.id,
          stock_position_id: stockId,
          symbol: symbol.toUpperCase(),
          sentiment: newNote.sentiment,
          category: newNote.category,
          parent_category: newNote.parentCategory,
          title: newNote.title.trim(),
          description: newNote.description.trim(),
          date: newNote.date,
          timestamp: new Date().toISOString(),
          tags: parsedTags,
        })
        .select()
        .single();

      if (supabaseError) {
        throw new Error(`Failed to save note: ${supabaseError.message}`);
      }

      if (!data) {
        throw new Error('No data returned from database');
      }

      const formattedNote: AnalysisNote = {
        id: data.id,
        stockId: data.stock_position_id,
        symbol: data.symbol,
        sentiment: data.sentiment as 'bullish' | 'bearish' | undefined,
        category: data.category as 'catalyst' | 'block' | 'research',
        parentCategory: data.parent_category,
        title: data.title,
        description: data.description,
        date: data.date,
        timestamp: data.timestamp,
        tags: Array.isArray(data.tags) ? data.tags : [],
      };

      setNotes(prev => [formattedNote, ...prev]);
      return formattedNote;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add note';
      const noteError: AnalysisNotesError = {
        message: errorMessage,
        type: 'database'
      };
      setError(noteError);
      throw error;
    }
  }, [user, clearError]);

  // Update note with validation
  const updateNote = useCallback(async (
    noteId: string, 
    updates: Partial<AnalysisNote>
  ): Promise<AnalysisNote> => {
    if (!user) {
      throw new Error('User must be logged in to update notes');
    }

    try {
      clearError();
      
      const updateData: Record<string, any> = {};
      
      if (updates.sentiment !== undefined) updateData.sentiment = updates.sentiment;
      if (updates.category) updateData.category = updates.category;
      if (updates.parentCategory) updateData.parent_category = updates.parentCategory;
      if (updates.title) updateData.title = updates.title.trim();
      if (updates.description) updateData.description = updates.description.trim();
      if (updates.date) updateData.date = updates.date;
      if (updates.tags) updateData.tags = updates.tags;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error: supabaseError } = await supabase
        .from('analysis_notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (supabaseError) {
        throw new Error(`Failed to update note: ${supabaseError.message}`);
      }

      if (!data) {
        throw new Error('Note not found or no data returned');
      }

      const formattedNote: AnalysisNote = {
        id: data.id,
        stockId: data.stock_position_id,
        symbol: data.symbol,
        sentiment: data.sentiment as 'bullish' | 'bearish' | undefined,
        category: data.category as 'catalyst' | 'block' | 'research',
        parentCategory: data.parent_category,
        title: data.title,
        description: data.description,
        date: data.date,
        timestamp: data.timestamp,
        tags: Array.isArray(data.tags) ? data.tags : [],
      };

      setNotes(prev => prev.map(note => note.id === noteId ? formattedNote : note));
      return formattedNote;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update note';
      const noteError: AnalysisNotesError = {
        message: errorMessage,
        type: 'database'
      };
      setError(noteError);
      throw error;
    }
  }, [user, clearError]);

  // Delete note with error handling
  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to delete notes');
    }

    try {
      clearError();
      const { error: supabaseError } = await supabase
        .from('analysis_notes')
        .delete()
        .eq('id', noteId);

      if (supabaseError) {
        throw new Error(`Failed to delete note: ${supabaseError.message}`);
      }

      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete note';
      const noteError: AnalysisNotesError = {
        message: errorMessage,
        type: 'database'
      };
      setError(noteError);
      throw error;
    }
  }, [user, clearError]);

  // Delete notes by stock position
  const deleteNotesByStock = useCallback(async (stockId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to delete notes');
    }

    try {
      clearError();
      const { error: supabaseError } = await supabase
        .from('analysis_notes')
        .delete()
        .eq('stock_position_id', stockId);

      if (supabaseError) {
        throw new Error(`Failed to delete notes: ${supabaseError.message}`);
      }

      setNotes(prev => prev.filter(n => n.stockId !== stockId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notes';
      const noteError: AnalysisNotesError = {
        message: errorMessage,
        type: 'database'
      };
      setError(noteError);
      throw error;
    }
  }, [user, clearError]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    deleteNotesByStock,
    refetch: fetchNotes,
    clearError,
  };
}