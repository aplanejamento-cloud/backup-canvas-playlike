
-- ============================================================
-- SISTEMA JUÍZES: comments + juiz_posts_diarios
-- ============================================================

-- 1. Tabela de controle de posts diários por juiz
CREATE TABLE IF NOT EXISTS public.juiz_posts_diarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  juiz_id     UUID NOT NULL,
  data        DATE NOT NULL DEFAULT CURRENT_DATE,
  post_count  INT NOT NULL DEFAULT 0,
  UNIQUE(juiz_id, data)
);

ALTER TABLE public.juiz_posts_diarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "juiz_posts_diarios_select_own"
  ON public.juiz_posts_diarios FOR SELECT
  USING (auth.uid() = juiz_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "juiz_posts_diarios_insert_own"
  ON public.juiz_posts_diarios FOR INSERT
  WITH CHECK (auth.uid() = juiz_id);

CREATE POLICY "juiz_posts_diarios_update_own"
  ON public.juiz_posts_diarios FOR UPDATE
  USING (auth.uid() = juiz_id);

-- 2. Tabela de comentários (apenas juízes postam, todos veem)
CREATE TABLE IF NOT EXISTS public.comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  juiz_id      UUID NOT NULL,
  texto        TEXT,
  midia_url    TEXT,
  midia_type   TEXT DEFAULT 'image', -- 'image' | 'video' | 'music'
  likes        INT NOT NULL DEFAULT 0,
  bombas       INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_viewable_by_everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "juizes_can_insert_comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = juiz_id);

CREATE POLICY "juizes_can_delete_own_comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = juiz_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "juizes_can_update_own_comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = juiz_id);

-- 3. Reações em comentários (likes / bombas por usuário, 1 por comment)
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id      UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  reaction_type   TEXT NOT NULL CHECK (reaction_type IN ('like', 'bomba')),
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_reactions_viewable_by_everyone"
  ON public.comment_reactions FOR SELECT
  USING (true);

CREATE POLICY "users_can_react_to_comments"
  ON public.comment_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_remove_own_reaction"
  ON public.comment_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Função: incrementa / decrementa counter na tabela comments
CREATE OR REPLACE FUNCTION public.update_comment_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE public.comments SET likes = likes + 1 WHERE id = NEW.comment_id;
    ELSIF NEW.reaction_type = 'bomba' THEN
      UPDATE public.comments SET bombas = bombas + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE public.comments SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.comment_id;
    ELSIF OLD.reaction_type = 'bomba' THEN
      UPDATE public.comments SET bombas = GREATEST(bombas - 1, 0) WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_comment_reactions_count
AFTER INSERT OR DELETE ON public.comment_reactions
FOR EACH ROW EXECUTE FUNCTION public.update_comment_reaction_counts();

-- 5. Função: upsert contador posts diários do juiz
CREATE OR REPLACE FUNCTION public.increment_juiz_post_count(p_juiz_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO public.juiz_posts_diarios (juiz_id, data, post_count)
  VALUES (p_juiz_id, CURRENT_DATE, 1)
  ON CONFLICT (juiz_id, data) DO UPDATE
    SET post_count = juiz_posts_diarios.post_count + 1;

  SELECT post_count INTO v_count
  FROM public.juiz_posts_diarios
  WHERE juiz_id = p_juiz_id AND data = CURRENT_DATE;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_juiz_id ON public.comments(juiz_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON public.comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_juiz_posts_diarios_juiz_date ON public.juiz_posts_diarios(juiz_id, data);
