-- Create stock_positions table
CREATE TABLE public.stock_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  price TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('holding', 'sold', 'watching')),
  date DATE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis_notes table
CREATE TABLE public.analysis_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_position_id UUID NOT NULL REFERENCES public.stock_positions(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('bullish', 'bearish')),
  category TEXT NOT NULL CHECK (category IN ('catalyst', 'block', 'research')),
  parent_category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stock_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stock_positions
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
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock positions" 
ON public.stock_positions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for analysis_notes
CREATE POLICY "Users can view their own analysis notes" 
ON public.analysis_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis notes" 
ON public.analysis_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis notes" 
ON public.analysis_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

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

-- Create indexes for better performance
CREATE INDEX idx_stock_positions_user_id ON public.stock_positions(user_id);
CREATE INDEX idx_stock_positions_symbol ON public.stock_positions(symbol);
CREATE INDEX idx_analysis_notes_user_id ON public.analysis_notes(user_id);
CREATE INDEX idx_analysis_notes_stock_position_id ON public.analysis_notes(stock_position_id);
CREATE INDEX idx_analysis_notes_symbol ON public.analysis_notes(symbol);
CREATE INDEX idx_analysis_notes_category ON public.analysis_notes(category);