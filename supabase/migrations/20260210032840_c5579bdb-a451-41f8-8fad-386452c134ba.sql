-- Drop existing FK that points to auth.users
ALTER TABLE public.posts DROP CONSTRAINT posts_user_id_fkey;

-- Recreate FK pointing to profiles.user_id for PostgREST joins
ALTER TABLE public.posts
  ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';