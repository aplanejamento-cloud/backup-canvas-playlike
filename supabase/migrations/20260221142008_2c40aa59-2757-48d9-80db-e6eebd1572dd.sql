
-- Add bot columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS visual_likes integer NOT NULL DEFAULT 0;

-- Update trigger to NOT give likes to bots, but give likes to real users interacting with bot posts
CREATE OR REPLACE FUNCTION public.update_profile_total_likes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_post_owner_id uuid;
  v_owner_is_bot boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO v_post_owner_id FROM public.posts WHERE id = NEW.post_id;
    IF v_post_owner_id IS NOT NULL THEN
      SELECT is_bot INTO v_owner_is_bot FROM public.profiles WHERE user_id = v_post_owner_id;
      
      IF v_owner_is_bot = true THEN
        -- Bot post: reward the INTERACTING real user
        IF NEW.interaction_type = 'like' OR NEW.interaction_type = 'love' THEN
          UPDATE public.profiles SET total_likes = total_likes + 1 
          WHERE user_id = NEW.user_id AND is_bot = false;
        END IF;
      ELSE
        -- Normal: reward post owner
        IF NEW.interaction_type = 'like' OR NEW.interaction_type = 'love' THEN
          UPDATE public.profiles SET total_likes = total_likes + 1 WHERE user_id = v_post_owner_id;
        ELSIF NEW.interaction_type = 'bomb' THEN
          UPDATE public.profiles SET total_likes = total_likes - 10 WHERE user_id = v_post_owner_id;
        END IF;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT user_id INTO v_post_owner_id FROM public.posts WHERE id = OLD.post_id;
    IF v_post_owner_id IS NOT NULL THEN
      SELECT is_bot INTO v_owner_is_bot FROM public.profiles WHERE user_id = v_post_owner_id;
      
      IF v_owner_is_bot = true THEN
        IF OLD.interaction_type = 'like' OR OLD.interaction_type = 'love' THEN
          UPDATE public.profiles SET total_likes = total_likes - 1 
          WHERE user_id = OLD.user_id AND is_bot = false;
        END IF;
      ELSE
        IF OLD.interaction_type = 'like' OR OLD.interaction_type = 'love' THEN
          UPDATE public.profiles SET total_likes = total_likes - 1 WHERE user_id = v_post_owner_id;
        ELSIF OLD.interaction_type = 'bomb' THEN
          UPDATE public.profiles SET total_likes = total_likes + 10 WHERE user_id = v_post_owner_id;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Also update post likes_count trigger to skip bot-owned posts from counting
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.interaction_type = 'like' OR NEW.interaction_type = 'love' THEN
      UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.interaction_type = 'bomb' THEN
      UPDATE public.posts SET likes_count = likes_count - 10 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.interaction_type = 'like' OR OLD.interaction_type = 'love' THEN
      UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    ELSIF OLD.interaction_type = 'bomb' THEN
      UPDATE public.posts SET likes_count = likes_count + 10 WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
