// src/hooks/useStockPositions.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StockPosition {
  id: string;
  symbol: string;
  price: string;
  position: 'holding' | 'sold' | 'watching';
  strategy: string;
  category: string;
  date: string;
  timestamp: string;
  risk_level: number;
  position_size: number;
}

export interface NewStockPosition {
  symbol: string;
  price: string;
  position: 'holding' | 'sold' | 'watching';
  strategy: string;
  category: string;
  date: string;
  risk_level: number;
  position_size: number;
}

export interface StockPositionsError {
  message: string;
  type: 'network' | 'validation' | 'database' | 'unknown';
}

export function useStockPositions() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<StockPositionsError | null>(null);

  // Clear error helper
  const clearError = useCallback(() => setError(null), []);

  // Fetch positions with proper error handling
  const fetchPositions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('stock_positions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (supabaseError) {
        throw new Error(`Database error: ${supabaseError.message}`);
      }

      const formattedPositions: StockPosition[] = (data || []).map(row => ({
        id: row.id,
        symbol: row.symbol,
        price: row.price,
        position: row.position as 'holding' | 'sold' | 'watching',
        strategy: row.strategy || 'General',
        category: row.category || 'General',
        date: row.date,
        timestamp: row.timestamp,
        risk_level: row.risk_level || 50,
        position_size: row.position_size || 0,
      }));

      setPositions(formattedPositions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError({
        message: errorMessage,
        type: errorMessage.includes('Database') ? 'database' : 'unknown'
      });
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Validate new position data
  const validatePosition = (position: NewStockPosition): string | null => {
    if (!position.symbol.trim()) {
      return 'Stock symbol is required';
    }
    
    if (!/^[A-Z]{1,5}$/.test(position.symbol.trim())) {
      return 'Stock symbol must be 1-5 uppercase letters';
    }
    
    const price = parseFloat(position.price);
    if (isNaN(price) || price <= 0) {
      return 'Price must be a positive number';
    }
    
    if (price > 999999) {
      return 'Price cannot exceed $999,999';
    }
    
    if (!position.strategy.trim()) {
      return 'Strategy is required';
    }
    
    return null;
  };

  // Add position with validation and error handling
  const addPosition = useCallback(async (newPosition: NewStockPosition): Promise<StockPosition> => {
    if (!user) {
      throw new Error('User must be logged in to add positions');
    }

    // Validate input
    const validationError = validatePosition(newPosition);
    if (validationError) {
      const error: StockPositionsError = {
        message: validationError,
        type: 'validation'
      };
      setError(error);
      throw new Error(validationError);
    }

    // Check for duplicate symbol
    const existingPosition = positions.find(
      p => p.symbol.toLowerCase() === newPosition.symbol.toLowerCase()
    );
    if (existingPosition) {
      const error: StockPositionsError = {
        message: `Position for ${newPosition.symbol} already exists`,
        type: 'validation'
      };
      setError(error);
      throw new Error(error.message);
    }

    try {
      clearError();
      const { data, error: supabaseError } = await supabase
        .from('stock_positions')
        .insert({
          user_id: user.id,
          symbol: newPosition.symbol.toUpperCase().trim(),
          price: parseFloat(newPosition.price).toFixed(2),
          position: newPosition.position,
          strategy: newPosition.strategy.trim(),
          category: newPosition.category.trim(),
          date: newPosition.date,
          risk_level: newPosition.risk_level,
          position_size: newPosition.position_size,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (supabaseError) {
        throw new Error(`Failed to save position: ${supabaseError.message}`);
      }

      if (!data) {
        throw new Error('No data returned from database');
      }

      const formattedPosition: StockPosition = {
        id: data.id,
        symbol: data.symbol,
        price: data.price,
        position: data.position as 'holding' | 'sold' | 'watching',
        strategy: data.strategy || 'General',
        category: data.category || 'General',
        date: data.date,
        timestamp: data.timestamp,
        risk_level: data.risk_level || 50,
        position_size: data.position_size || 0,
      };

      setPositions(prev => [formattedPosition, ...prev]);
      return formattedPosition;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add position';
      const positionError: StockPositionsError = {
        message: errorMessage,
        type: 'database'
      };
      setError(positionError);
      throw error;
    }
  }, [user, positions, clearError]);

  // Delete position with error handling
  const deletePosition = useCallback(async (positionId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to delete positions');
    }

    try {
      clearError();
      const { error: supabaseError } = await supabase
        .from('stock_positions')
        .delete()
        .eq('id', positionId);

      if (supabaseError) {
        throw new Error(`Failed to delete position: ${supabaseError.message}`);
      }

      setPositions(prev => prev.filter(p => p.id !== positionId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete position';
      const positionError: StockPositionsError = {
        message: errorMessage,
        type: 'database'
      };
      setError(positionError);
      throw error;
    }
  }, [user, clearError]);

  // Update position (new functionality)
  const updatePosition = useCallback(async (
    positionId: string, 
    updates: Partial<NewStockPosition>
  ): Promise<StockPosition> => {
    if (!user) {
      throw new Error('User must be logged in to update positions');
    }

    try {
      clearError();
      const { data, error: supabaseError } = await supabase
        .from('stock_positions')
        .update({
          ...(updates.symbol && { symbol: updates.symbol.toUpperCase().trim() }),
          ...(updates.price && { price: parseFloat(updates.price).toFixed(2) }),
          ...(updates.position && { position: updates.position }),
          ...(updates.strategy && { strategy: updates.strategy.trim() }),
          ...(updates.category && { category: updates.category.trim() }),
          ...(updates.date && { date: updates.date }),
          ...(updates.risk_level !== undefined && { risk_level: updates.risk_level }),
          ...(updates.position_size !== undefined && { position_size: updates.position_size }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', positionId)
        .select()
        .single();

      if (supabaseError) {
        throw new Error(`Failed to update position: ${supabaseError.message}`);
      }

      if (!data) {
        throw new Error('Position not found or no data returned');
      }

      const formattedPosition: StockPosition = {
        id: data.id,
        symbol: data.symbol,
        price: data.price,
        position: data.position as 'holding' | 'sold' | 'watching',
        strategy: data.strategy || 'General',
        category: data.category || 'General',
        date: data.date,
        timestamp: data.timestamp,
        risk_level: data.risk_level || 50,
        position_size: data.position_size || 0,
      };

      setPositions(prev => prev.map(p => p.id === positionId ? formattedPosition : p));
      return formattedPosition;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update position';
      const positionError: StockPositionsError = {
        message: errorMessage,
        type: 'database'
      };
      setError(positionError);
      throw error;
    }
  }, [user, clearError]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    positions,
    loading,
    error,
    addPosition,
    updatePosition,
    deletePosition,
    refetch: fetchPositions,
    clearError,
  };
}