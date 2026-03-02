-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Create post_interactions table for tracking likes/lacrou/bomba
CREATE TYPE public.interaction_type AS ENUM ('curtir', 'lacrou', 'bomba');

CREATE TABLE public.post_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type public.interaction_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id) -- One interaction per user per post
);

-- Create follows table for Fan Club feature
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on all tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
ON public.posts FOR SELECT
USING (expires_at > now());

CREATE POLICY "Users can create their own posts"
ON public.posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.posts FOR DELETE
USING (auth.uid() = user_id);

-- Post interactions policies
CREATE POLICY "Interactions are viewable by everyone"
ON public.post_interactions FOR SELECT
USING (true);

CREATE POLICY "Users can create their own interactions"
ON public.post_interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
ON public.post_interactions FOR DELETE
USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone"
ON public.follows FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON public.follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
USING (auth.uid() = follower_id);

-- Function to handle post interaction and update likes
CREATE OR REPLACE FUNCTION public.handle_post_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  like_value INTEGER;
  post_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Determine like value based on interaction type
  CASE NEW.interaction_type
    WHEN 'curtir' THEN like_value := 1;
    WHEN 'lacrou' THEN like_value := 10;
    WHEN 'bomba' THEN like_value := -10;
  END CASE;
  
  -- Update post likes_count
  UPDATE public.posts 
  SET likes_count = likes_count + like_value 
  WHERE id = NEW.post_id;
  
  -- Update post owner's total_likes
  UPDATE public.profiles 
  SET total_likes = total_likes + like_value 
  WHERE user_id = post_owner_id;
  
  RETURN NEW;
END;
$$;

-- Function to handle interaction removal
CREATE OR REPLACE FUNCTION public.handle_interaction_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  like_value INTEGER;
  post_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = OLD.post_id;
  
  -- Determine like value to remove
  CASE OLD.interaction_type
    WHEN 'curtir' THEN like_value := 1;
    WHEN 'lacrou' THEN like_value := 10;
    WHEN 'bomba' THEN like_value := -10;
  END CASE;
  
  -- Revert post likes_count
  UPDATE public.posts 
  SET likes_count = likes_count - like_value 
  WHERE id = OLD.post_id;
  
  -- Revert post owner's total_likes
  UPDATE public.profiles 
  SET total_likes = total_likes - like_value 
  WHERE user_id = post_owner_id;
  
  RETURN OLD;
END;
$$;

-- Create triggers for interactions
CREATE TRIGGER on_post_interaction_insert
  AFTER INSERT ON public.post_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_interaction();

CREATE TRIGGER on_post_interaction_delete
  AFTER DELETE ON public.post_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_interaction_removal();

-- Enable realtime for posts and interactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_interactions;