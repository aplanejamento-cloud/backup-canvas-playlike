
-- Temas multiplicadores
CREATE TABLE public.temas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  midia_url text,
  titulo varchar(100) NOT NULL,
  fator decimal(3,2) NOT NULL DEFAULT 2.0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.temas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "temas_viewable_by_everyone" ON public.temas FOR SELECT USING (true);
CREATE POLICY "admins_manage_temas" ON public.temas FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Compras PIX
CREATE TABLE public.compras_pix (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL,
  valor decimal(10,2) NOT NULL,
  likes_adquiridos int NOT NULL,
  pix_copia text,
  comprovante_url text,
  status varchar(20) NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compras_pix ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_can_insert_own_compras" ON public.compras_pix FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "users_can_view_own_compras" ON public.compras_pix FOR SELECT USING (auth.uid() = usuario_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "admins_can_update_compras" ON public.compras_pix FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admins_can_delete_compras" ON public.compras_pix FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Assets marketing
CREATE TABLE public.assets_marketing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo varchar(20) NOT NULL,
  titulo varchar(100),
  arquivo_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assets_marketing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets_viewable_by_authenticated" ON public.assets_marketing FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admins_manage_assets" ON public.assets_marketing FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Blacklist palavras
CREATE TABLE public.blacklist_palavras (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  palavra varchar(50) NOT NULL UNIQUE,
  categoria varchar(30)
);
ALTER TABLE public.blacklist_palavras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blacklist_viewable_by_authenticated" ON public.blacklist_palavras FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admins_manage_blacklist" ON public.blacklist_palavras FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed blacklist
INSERT INTO public.blacklist_palavras (palavra, categoria) VALUES
  ('puta', 'sexo'), ('caralho', 'sexo'), ('maconha', 'drogas'),
  ('piranha', 'sexo'), ('vagabunda', 'sexo'), ('crack', 'drogas');

-- Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tema_id uuid REFERENCES public.temas(id),
  ADD COLUMN IF NOT EXISTS multiplicador_ativo decimal(3,2) DEFAULT 1.0;

-- Add columns to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tema_id uuid REFERENCES public.temas(id),
  ADD COLUMN IF NOT EXISTS dislikes_tema int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS denuncias_improprio int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tema_validado boolean DEFAULT true;

-- Realtime for compras_pix and moderation
ALTER PUBLICATION supabase_realtime ADD TABLE public.compras_pix;

-- Storage bucket for assets
INSERT INTO storage.buckets (id, name, public) VALUES ('assets-marketing', 'assets-marketing', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view assets" ON storage.objects FOR SELECT USING (bucket_id = 'assets-marketing');
CREATE POLICY "Admins can upload assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assets-marketing' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete assets" ON storage.objects FOR DELETE USING (bucket_id = 'assets-marketing' AND has_role(auth.uid(), 'admin'));

-- Storage bucket for comprovantes PIX
INSERT INTO storage.buckets (id, name, public) VALUES ('comprovantes-pix', 'comprovantes-pix', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own comprovantes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'comprovantes-pix' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users and admins can view comprovantes" ON storage.objects FOR SELECT USING (bucket_id = 'comprovantes-pix' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin')));
