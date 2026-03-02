
-- Create user_referrals table
CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  network TEXT NOT NULL,
  used_first_time BOOLEAN NOT NULL DEFAULT true,
  friends_invited INTEGER NOT NULL DEFAULT 0,
  likes_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, network)
);

-- Enable RLS
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals
CREATE POLICY "Users can view own referrals"
ON public.user_referrals
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own referrals
CREATE POLICY "Users can insert own referrals"
ON public.user_referrals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own referrals
CREATE POLICY "Users can update own referrals"
ON public.user_referrals
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all referrals
CREATE POLICY "Admins can view all referrals"
ON public.user_referrals
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));
