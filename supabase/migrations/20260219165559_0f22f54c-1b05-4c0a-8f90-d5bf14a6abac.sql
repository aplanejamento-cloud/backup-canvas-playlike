
-- Add soft delete column to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS deletado BOOLEAN NOT NULL DEFAULT false;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_posts_deletado ON public.posts (deletado);

-- Allow admins to delete (soft) any post
CREATE POLICY "Admins can update any post"
ON public.posts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));
