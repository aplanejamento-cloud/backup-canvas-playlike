
-- Table for user media gallery (10 photos + 1 video)
CREATE TABLE public.user_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  media_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_media_profile FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

ALTER TABLE public.user_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media is viewable by everyone" ON public.user_media FOR SELECT USING (true);
CREATE POLICY "Users can insert own media" ON public.user_media FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own media" ON public.user_media FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own media" ON public.user_media FOR DELETE USING (auth.uid() = user_id);

-- Table for duels
CREATE TABLE public.duels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  challenged_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'refused')),
  winner_id UUID,
  challenger_votes INTEGER NOT NULL DEFAULT 0,
  challenged_votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_duel_challenger FOREIGN KEY (challenger_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_duel_challenged FOREIGN KEY (challenged_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Duels are viewable by everyone" ON public.duels FOR SELECT USING (true);
CREATE POLICY "Users can create duels" ON public.duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Participants can update duels" ON public.duels FOR UPDATE USING (auth.uid() IN (challenger_id, challenged_id));

-- Table for duel votes
CREATE TABLE public.duel_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duel_id UUID NOT NULL,
  voter_id UUID NOT NULL,
  voted_for UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('play', 'likes')),
  vote_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_duel_vote_duel FOREIGN KEY (duel_id) REFERENCES public.duels(id) ON DELETE CASCADE,
  CONSTRAINT fk_duel_vote_voter FOREIGN KEY (voter_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_duel_vote_for FOREIGN KEY (voted_for) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  UNIQUE(duel_id, voter_id)
);

ALTER TABLE public.duel_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone" ON public.duel_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.duel_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Enable realtime for duels
ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_votes;

-- Storage bucket for user gallery
INSERT INTO storage.buckets (id, name, public) VALUES ('user-media', 'user-media', true);

CREATE POLICY "User media is publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'user-media');
CREATE POLICY "Users can upload own media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own media" ON storage.objects FOR UPDATE USING (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own media" ON storage.objects FOR DELETE USING (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);
