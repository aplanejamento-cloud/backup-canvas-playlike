
-- Add second promo text and sponsors array to home_config
ALTER TABLE public.home_config 
ADD COLUMN IF NOT EXISTS promo_text_2 text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS sponsors jsonb NOT NULL DEFAULT '[]'::jsonb;
