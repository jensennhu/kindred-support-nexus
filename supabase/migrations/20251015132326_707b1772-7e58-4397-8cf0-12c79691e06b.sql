-- Add position_size column to stock_positions table
ALTER TABLE public.stock_positions 
ADD COLUMN position_size numeric DEFAULT 0;