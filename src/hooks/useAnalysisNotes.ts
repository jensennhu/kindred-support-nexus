import { useState, useEffect } from 'react';
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

export function useAnalysisNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<AnalysisNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notes
  const fetchNotes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('analysis_notes')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const formattedNotes: AnalysisNote[] = data.map(row => ({
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
        tags: row.tags || [],
      }));

      setNotes(formattedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add note
  const addNote = async (stockId: string, symbol: string, newNote: NewAnalysisNote) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analysis_notes')
        .insert({
          user_id: user.id,
          stock_position_id: stockId,
          symbol: symbol,
          sentiment: newNote.sentiment,
          category: newNote.category,
          parent_category: newNote.parentCategory,
          title: newNote.title,
          description: newNote.description,
          date: newNote.date,
          timestamp: new Date().toISOString(),
          tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        })
        .select()
        .single();

      if (error) throw error;

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
        tags: data.tags || [],
      };

      setNotes(prev => [formattedNote, ...prev]);
      return formattedNote;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  };

  // Update note
  const updateNote = async (noteId: string, updates: Partial<AnalysisNote>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analysis_notes')
        .update({
          sentiment: updates.sentiment,
          category: updates.category,
          parent_category: updates.parentCategory,
          title: updates.title,
          description: updates.description,
          date: updates.date,
          tags: updates.tags,
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

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
        tags: data.tags || [],
      };

      setNotes(prev => prev.map(note => note.id === noteId ? formattedNote : note));
      return formattedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('analysis_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  // Delete notes by stock position
  const deleteNotesByStock = async (stockId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('analysis_notes')
        .delete()
        .eq('stock_position_id', stockId);

      if (error) throw error;

      setNotes(prev => prev.filter(n => n.stockId !== stockId));
    } catch (error) {
      console.error('Error deleting notes by stock:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    deleteNotesByStock,
    refetch: fetchNotes,
  };
}