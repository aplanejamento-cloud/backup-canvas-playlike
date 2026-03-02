-- Add video_loop_url column for the autoplay loop video (distinct from rules and prize videos)
ALTER TABLE public.home_config ADD COLUMN IF NOT EXISTS video_loop_url TEXT DEFAULT NULL;