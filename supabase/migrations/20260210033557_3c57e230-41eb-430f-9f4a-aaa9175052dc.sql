
-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);

-- RLS: Anyone can view files
CREATE POLICY "Post media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

-- RLS: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own post media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Users can delete their own media
CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add video_url and music_url columns to posts
ALTER TABLE public.posts ADD COLUMN video_url text DEFAULT NULL;
ALTER TABLE public.posts ADD COLUMN music_url text DEFAULT NULL;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
