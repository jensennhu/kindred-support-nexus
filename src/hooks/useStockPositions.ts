import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StockPosition {
  id: string;
  symbol: string;
  price: string;
  position: 'holding' | 'sold' | 'watching';
  date: string;
  timestamp: string;
}

export interface NewStockPosition {
  symbol: string;
  price: string;
  position: 'holding' | 'sold' | 'watching';
  date: string;
}

export function useStockPositions() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch positions
  const fetchPositions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('stock_positions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const formattedPositions: StockPosition[] = data.map(row => ({
        id: row.id,
        symbol: row.symbol,
        price: row.price,
        position: row.position as 'holding' | 'sold' | 'watching',
        date: row.date,
        timestamp: row.timestamp,
      }));

      setPositions(formattedPositions);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add position
  const addPosition = async (newPosition: NewStockPosition) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stock_positions')
        .insert({
          user_id: user.id,
          symbol: newPosition.symbol.toUpperCase(),
          price: newPosition.price,
          position: newPosition.position,
          date: newPosition.date,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const formattedPosition: StockPosition = {
        id: data.id,
        symbol: data.symbol,
        price: data.price,
        position: data.position as 'holding' | 'sold' | 'watching',
        date: data.date,
        timestamp: data.timestamp,
      };

      setPositions(prev => [formattedPosition, ...prev]);
      return formattedPosition;
    } catch (error) {
      console.error('Error adding position:', error);
      throw error;
    }
  };

  // Delete position
  const deletePosition = async (positionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('stock_positions')
        .delete()
        .eq('id', positionId);

      if (error) throw error;

      setPositions(prev => prev.filter(p => p.id !== positionId));
    } catch (error) {
      console.error('Error deleting position:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [user]);

  return {
    positions,
    loading,
    addPosition,
    deletePosition,
    refetch: fetchPositions,
  };
}