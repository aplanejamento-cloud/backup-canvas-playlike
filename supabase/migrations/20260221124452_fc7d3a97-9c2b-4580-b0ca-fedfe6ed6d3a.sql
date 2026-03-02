
-- Daily stats table for streak tracking and retention
CREATE TABLE public.daily_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  likes_dia integer NOT NULL DEFAULT 0,
  ranking_dia integer NOT NULL DEFAULT 0,
  streak_dias integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, data)
);

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats" ON public.daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert stats" ON public.daily_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update stats" ON public.daily_stats FOR UPDATE USING (true);

-- Admins can view all stats
CREATE POLICY "Admins can view all stats" ON public.daily_stats FOR SELECT USING (has_role(auth.uid(), 'admin'::text));

-- Enable realtime for daily_stats
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_stats;
