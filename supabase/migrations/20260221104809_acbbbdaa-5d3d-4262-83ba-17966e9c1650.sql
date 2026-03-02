
-- Create remixes table
CREATE TABLE public.remixes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_original_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  remixador_id UUID NOT NULL,
  remix_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.remixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Remixes viewable by everyone" ON public.remixes FOR SELECT USING (true);
CREATE POLICY "Users can create own remixes" ON public.remixes FOR INSERT WITH CHECK (auth.uid() = remixador_id);
CREATE POLICY "Users can delete own remixes" ON public.remixes FOR DELETE USING (auth.uid() = remixador_id);

-- Add remix_count to posts for quick access
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS remix_count INTEGER NOT NULL DEFAULT 0;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.remixes;
