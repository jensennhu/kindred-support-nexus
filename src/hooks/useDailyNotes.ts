import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyNote {
  id: string;
  user_id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NewDailyNote {
  date: string;
  content: string;
}

export const useDailyNotes = () => {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching daily notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch daily notes');
    } finally {
      setLoading(false);
    }
  }, []);

  const addNote = useCallback(async (noteData: NewDailyNote): Promise<DailyNote> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('daily_notes')
      .insert({
        ...noteData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    setNotes(prev => [data, ...prev]);
    return data;
  }, []);

  const updateNote = useCallback(async (noteId: string, updates: Partial<DailyNote>): Promise<DailyNote> => {
    const { data, error } = await supabase
      .from('daily_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    
    setNotes(prev => prev.map(note => 
      note.id === noteId ? data : note
    ));
    return data;
  }, []);

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    const { error } = await supabase
      .from('daily_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
    
    setNotes(prev => prev.filter(note => note.id !== noteId));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
    refetch: fetchNotes,
    clearError,
  };
};