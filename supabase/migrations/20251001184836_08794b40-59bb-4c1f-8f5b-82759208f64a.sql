-- Add risk_level column to stock_positions table
ALTER TABLE public.stock_positions 
ADD COLUMN risk_level INTEGER DEFAULT 50 CHECK (risk_level >= 1 AND risk_level <= 100);