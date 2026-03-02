
-- Add cultural post columns to posts
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS tipo varchar NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS categoria varchar,
  ADD COLUMN IF NOT EXISTS boost_likes integer NOT NULL DEFAULT 0;
