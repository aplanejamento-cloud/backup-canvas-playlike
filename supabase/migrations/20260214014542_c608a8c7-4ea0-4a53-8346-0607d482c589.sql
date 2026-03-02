
-- Create table for multi-photo posts (1-10 images per post)
CREATE TABLE public.post_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Post images are viewable by everyone"
ON public.post_images FOR SELECT USING (true);

CREATE POLICY "Users can insert images on their own posts"
ON public.post_images FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id AND posts.user_id = auth.uid())
);

CREATE POLICY "Users can delete images on their own posts"
ON public.post_images FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_id AND posts.user_id = auth.uid())
);

-- Index for fast lookups
CREATE INDEX idx_post_images_post_id ON public.post_images(post_id, position);
