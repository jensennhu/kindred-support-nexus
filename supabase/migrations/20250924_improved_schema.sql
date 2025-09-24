-- supabase/migrations/20250924_improved_schema.sql
-- IMPROVED SCHEMA: Fix price as numeric, add constraints, improve indexes

-- First, backup existing data if needed and drop old tables
-- (In production, you'd migrate data properly)

-- Drop existing tables to recreate with better schema
DROP TABLE IF EXISTS public.analysis_notes CASCADE;
DROP TABLE IF EXISTS public.stock_positions CASCADE;

-- Create improved stock_positions table
CREATE TABLE public.stock_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL CHECK (LENGTH(symbol) >= 1 AND LENGTH(symbol) <= 5),
  price DECIMAL(10,2) NOT NULL CHECK (price > 0 AND price <= 999999.99),
  position TEXT NOT NULL CHECK (position IN ('holding', 'sold', 'watching')),
  strategy TEXT NOT NULL DEFAULT 'General' CHECK (LENGTH(strategy) >= 1 AND LENGTH(strategy) <= 50),
  date DATE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint for user + symbol combination
  CONSTRAINT unique_user_symbol UNIQUE (user_id, symbol)
);

-- Create improved analysis_notes table
CREATE TABLE public.analysis_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_position_id UUID NOT NULL REFERENCES public.stock_positions(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL CHECK (LENGTH(symbol) >= 1 AND LENGTH(symbol) <= 5),
  sentiment TEXT CHECK (sentiment IN ('bullish', 'bearish')),
  category TEXT NOT NULL CHECK (category IN ('catalyst', 'block', 'research')),
  parent_category TEXT NOT NULL CHECK (LENGTH(parent_category) >= 1 AND LENGTH(parent_category) <= 50),
  title TEXT NOT NULL CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 100),
  description TEXT NOT NULL CHECK (LENGTH(description) >= 1 AND LENGTH(description) <= 2000),
  date DATE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Business logic constraints
  CONSTRAINT sentiment_required_for_catalyst_block 
    CHECK (
      (category = 'research' AND sentiment IS NULL) OR 
      (category IN ('catalyst', 'block') AND sentiment IS NOT NULL)
    ),
  
  -- Limit tags array size
  CONSTRAINT tags_limit CHECK (array_length(tags, 1) <= 10)
);

-- Enable Row Level Security
ALTER TABLE public.stock_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_notes ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for stock_positions
CREATE POLICY "Users can view their own stock positions" 
ON public.stock_positions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock positions" 
ON public.stock_positions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock positions" 
ON public.stock_positions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock positions" 
ON public.stock_positions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create comprehensive RLS policies for analysis_notes
CREATE POLICY "Users can view their own analysis notes" 
ON public.analysis_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis notes" 
ON public.analysis_notes 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.stock_positions sp 
    WHERE sp.id = stock_position_id AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own analysis notes" 
ON public.analysis_notes 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis notes" 
ON public.analysis_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_stock_positions_updated_at
BEFORE UPDATE ON public.stock_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_notes_updated_at
BEFORE UPDATE ON public.analysis_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create optimized indexes for better performance
CREATE INDEX idx_stock_positions_user_id ON public.stock_positions(user_id);
CREATE INDEX idx_stock_positions_symbol ON public.stock_positions(symbol);
CREATE INDEX idx_stock_positions_position ON public.stock_positions(position);
CREATE INDEX idx_stock_positions_strategy ON public.stock_positions(strategy);
CREATE INDEX idx_stock_positions_timestamp ON public.stock_positions(timestamp DESC);

CREATE INDEX idx_analysis_notes_user_id ON public.analysis_notes(user_id);
CREATE INDEX idx_analysis_notes_stock_position_id ON public.analysis_notes(stock_position_id);
CREATE INDEX idx_analysis_notes_symbol ON public.analysis_notes(symbol);
CREATE INDEX idx_analysis_notes_category ON public.analysis_notes(category);
CREATE INDEX idx_analysis_notes_timestamp ON public.analysis_notes(timestamp DESC);
CREATE INDEX idx_analysis_notes_date ON public.analysis_notes(date DESC);

-- Create a GIN index for tags array for efficient searching
CREATE INDEX idx_analysis_notes_tags ON public.analysis_notes USING GIN(tags);

-- Add helpful comments for documentation
COMMENT ON TABLE public.stock_positions IS 'User stock positions with improved constraints';
COMMENT ON TABLE public.analysis_notes IS 'Analysis notes for stock positions with business logic constraints';
COMMENT ON CONSTRAINT unique_user_symbol ON public.stock_positions IS 'Prevents duplicate symbols per user';
COMMENT ON CONSTRAINT sentiment_required_for_catalyst_block ON public.analysis_notes IS 'Ensures business logic: research notes have no sentiment, others require sentiment';