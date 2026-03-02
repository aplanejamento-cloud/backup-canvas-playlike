
-- =====================================================
-- GAME STATE + PREMIOS + DOACOES MIGRATION
-- Não quebra likes/profiles existentes
-- =====================================================

-- 1. GAME STATE (singleton row id=1)
CREATE TABLE IF NOT EXISTS public.game_state (
  id INT PRIMARY KEY DEFAULT 1,
  game_on BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Garante que a linha singleton existe
INSERT INTO public.game_state (id, game_on) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- RLS game_state
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_state viewable by everyone"
  ON public.game_state FOR SELECT USING (true);

CREATE POLICY "only admins can update game_state"
  ON public.game_state FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. PREMIOS (prateleiras 1,2,3)
CREATE TABLE IF NOT EXISTS public.premios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_prateleira INT NOT NULL CHECK (tipo_prateleira IN (1, 2, 3)),
  midia_url TEXT,
  titulo TEXT,
  descricao TEXT,
  likes_custo INT NOT NULL DEFAULT 0,
  estoque INT NOT NULL DEFAULT 1,
  aprovado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.premios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "premios viewable by everyone"
  ON public.premios FOR SELECT USING (true);

CREATE POLICY "admins can manage premios"
  ON public.premios FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. DOACOES PREMIOS
CREATE TABLE IF NOT EXISTS public.doacoes_premios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  midia_url TEXT NOT NULL,
  titulo TEXT,
  descricao TEXT,
  likes_recebidos INT NOT NULL DEFAULT 0,
  aprovado BOOLEAN NOT NULL DEFAULT false,
  tipo_prateleira INT NOT NULL DEFAULT 1 CHECK (tipo_prateleira IN (1, 2, 3)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doacoes_premios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own doacoes"
  ON public.doacoes_premios FOR SELECT
  USING (auth.uid() = usuario_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users can insert own doacoes"
  ON public.doacoes_premios FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "admins can update doacoes"
  ON public.doacoes_premios FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can delete doacoes"
  ON public.doacoes_premios FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. RESGATES (log de trocas de prêmios)
CREATE TABLE IF NOT EXISTS public.resgates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  premio_id UUID NOT NULL REFERENCES public.premios(id) ON DELETE CASCADE,
  likes_gastos INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','recusado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resgates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own resgates"
  ON public.resgates FOR SELECT
  USING (auth.uid() = usuario_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users can insert own resgates"
  ON public.resgates FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "admins can update resgates"
  ON public.resgates FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Adicionar coluna game_on nos posts (sem quebrar existentes)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS game_on BOOLEAN NOT NULL DEFAULT true;

-- 6. Função para verificar se jogo está ativo
CREATE OR REPLACE FUNCTION public.is_game_on()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT game_on FROM public.game_state WHERE id = 1), false);
$$;
