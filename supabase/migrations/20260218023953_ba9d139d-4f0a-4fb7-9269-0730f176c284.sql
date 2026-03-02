
-- Fix overly permissive policy on post_images
DROP POLICY "Users can insert post images" ON public.post_images;
CREATE POLICY "Authenticated users can insert post images" ON public.post_images FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
