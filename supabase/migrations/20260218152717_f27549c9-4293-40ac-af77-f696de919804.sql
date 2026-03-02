
-- Add unique constraint on profiles.user_id (needed for FK reference)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add FK from posts.user_id to profiles.user_id
ALTER TABLE public.posts 
  ADD CONSTRAINT posts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
