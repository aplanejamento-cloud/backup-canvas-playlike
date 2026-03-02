
-- Add ultima_doacao to profiles for juiz donation tracking
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS ultima_doacao timestamptz;
