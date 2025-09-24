-- Add strategy column to stock_positions table
ALTER TABLE public.stock_positions 
ADD COLUMN strategy TEXT DEFAULT 'General';