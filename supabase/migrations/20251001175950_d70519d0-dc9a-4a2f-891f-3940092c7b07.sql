-- Add category column to stock_positions table
ALTER TABLE public.stock_positions 
ADD COLUMN category TEXT DEFAULT 'General';