
-- Create home_config table
CREATE TABLE public.home_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_value text NOT NULL DEFAULT 'R$50.000',
  prize_enabled boolean NOT NULL DEFAULT true,
  promo_text text NOT NULL DEFAULT '<p>Cadastre-se grátis e comece a ganhar likes!</p>',
  video_rules_url text,
  video_prize_url text,
  secondary_prizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.home_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Home config is viewable by everyone"
ON public.home_config FOR SELECT USING (true);

CREATE POLICY "Admins can update home config"
ON public.home_config FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert home config"
ON public.home_config FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default config
INSERT INTO public.home_config (prize_value, prize_enabled, promo_text)
VALUES ('R$50.000', true, '<p>Cadastre-se grátis e comece a ganhar likes!</p>');

-- Set first user as admin
UPDATE public.user_roles SET role = 'admin' WHERE user_id = '4d55ffd2-81e8-4068-889f-85d726635a83';

-- Create storage bucket for home media
INSERT INTO storage.buckets (id, name, public) VALUES ('home-media', 'home-media', true);

CREATE POLICY "Home media is publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'home-media');

CREATE POLICY "Admins can upload home media"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'home-media' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update home media"
ON storage.objects FOR UPDATE USING (
  bucket_id = 'home-media' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete home media"
ON storage.objects FOR DELETE USING (
  bucket_id = 'home-media' AND public.has_role(auth.uid(), 'admin')
);
