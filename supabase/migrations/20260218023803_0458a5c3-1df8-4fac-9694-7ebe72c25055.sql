
-- Create interaction_type enum
CREATE TYPE public.interaction_type AS ENUM ('like', 'dislike', 'love', 'haha', 'wow', 'sad', 'angry', 'bomb');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sex TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  bio TEXT,
  video_url TEXT,
  music_url TEXT,
  profile_text TEXT,
  total_likes INTEGER NOT NULL DEFAULT 1000,
  user_type TEXT NOT NULL DEFAULT 'jogador',
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_until TIMESTAMPTZ,
  birth_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, sex, whatsapp, user_type, birth_date, total_likes)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.raw_user_meta_data->>'sex',
    NEW.raw_user_meta_data->>'whatsapp',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'jogador'),
    NEW.raw_user_meta_data->>'birth_date',
    1000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  music_url TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);

-- Post images table
CREATE TABLE public.post_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Post images viewable by everyone" ON public.post_images FOR SELECT USING (true);
CREATE POLICY "Users can insert post images" ON public.post_images FOR INSERT WITH CHECK (true);

-- Post interactions table
CREATE TABLE public.post_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  interaction_type interaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interactions viewable by everyone" ON public.post_interactions FOR SELECT USING (true);
CREATE POLICY "Users can create own interactions" ON public.post_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions" ON public.post_interactions FOR DELETE USING (auth.uid() = user_id);

-- Follows table
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can create own follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Duels table
CREATE TABLE public.duels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  challenged_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  winner_id UUID,
  challenger_votes INTEGER NOT NULL DEFAULT 0,
  challenged_votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Duels viewable by everyone" ON public.duels FOR SELECT USING (true);
CREATE POLICY "Users can create duels" ON public.duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Authenticated users can update duels" ON public.duels FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Duel votes table
CREATE TABLE public.duel_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duel_id UUID NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  voted_for UUID NOT NULL,
  vote_type TEXT NOT NULL DEFAULT 'play',
  vote_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(duel_id, voter_id)
);

ALTER TABLE public.duel_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Duel votes viewable by everyone" ON public.duel_votes FOR SELECT USING (true);
CREATE POLICY "Users can create own duel votes" ON public.duel_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Home config table
CREATE TABLE public.home_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prize_value TEXT NOT NULL DEFAULT '0',
  prize_enabled BOOLEAN NOT NULL DEFAULT false,
  promo_text TEXT NOT NULL DEFAULT '',
  promo_text_2 TEXT NOT NULL DEFAULT '',
  video_loop_url TEXT,
  video_rules_url TEXT,
  video_prize_url TEXT,
  secondary_prizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  sponsors JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Home config viewable by everyone" ON public.home_config FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update home config" ON public.home_config FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Insert default home config
INSERT INTO public.home_config (prize_value, prize_enabled, promo_text, promo_text_2) VALUES ('0', false, '', '');

-- User media table
CREATE TABLE public.user_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'photo',
  media_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User media viewable by everyone" ON public.user_media FOR SELECT USING (true);
CREATE POLICY "Users can manage own media" ON public.user_media FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own media" ON public.user_media FOR DELETE USING (auth.uid() = user_id);

-- User referrals table
CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  network TEXT NOT NULL,
  used_first_time BOOLEAN NOT NULL DEFAULT false,
  friends_invited INTEGER NOT NULL DEFAULT 0,
  likes_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON public.user_referrals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own referrals" ON public.user_referrals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own referrals" ON public.user_referrals FOR UPDATE USING (auth.uid() = user_id);

-- User roles table for admin
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roles viewable by everyone" ON public.user_roles FOR SELECT USING (true);

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('user-media', 'user-media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('home-media', 'home-media', true);

-- Storage policies
CREATE POLICY "Public read post-media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Auth upload post-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.uid() IS NOT NULL);
CREATE POLICY "Public read user-media" ON storage.objects FOR SELECT USING (bucket_id = 'user-media');
CREATE POLICY "Auth upload user-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth delete user-media" ON storage.objects FOR DELETE USING (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public read home-media" ON storage.objects FOR SELECT USING (bucket_id = 'home-media');
CREATE POLICY "Auth upload home-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'home-media' AND auth.uid() IS NOT NULL);
