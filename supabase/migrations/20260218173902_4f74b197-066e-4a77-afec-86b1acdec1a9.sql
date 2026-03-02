
-- ============================================
-- TRIGGER 1: posts.likes_count ↔ post_interactions
-- Incrementa/decrementa likes_count conforme tipos de interação
-- ============================================
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.post_interactions;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.post_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- ============================================
-- TRIGGER 2: profiles.total_likes ↔ post_interactions recebidas
-- Atualiza o total_likes do DONO do post quando recebe interação
-- ============================================
CREATE OR REPLACE FUNCTION public.update_profile_total_likes()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO v_post_owner_id FROM public.posts WHERE id = NEW.post_id;
    IF v_post_owner_id IS NOT NULL THEN
      IF NEW.interaction_type = 'like' OR NEW.interaction_type = 'love' THEN
        UPDATE public.profiles SET total_likes = total_likes + 1 WHERE user_id = v_post_owner_id;
      ELSIF NEW.interaction_type = 'bomb' THEN
        UPDATE public.profiles SET total_likes = total_likes - 10 WHERE user_id = v_post_owner_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT user_id INTO v_post_owner_id FROM public.posts WHERE id = OLD.post_id;
    IF v_post_owner_id IS NOT NULL THEN
      IF OLD.interaction_type = 'like' OR OLD.interaction_type = 'love' THEN
        UPDATE public.profiles SET total_likes = total_likes - 1 WHERE user_id = v_post_owner_id;
      ELSIF OLD.interaction_type = 'bomb' THEN
        UPDATE public.profiles SET total_likes = total_likes + 10 WHERE user_id = v_post_owner_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_profile_total_likes ON public.post_interactions;
CREATE TRIGGER trigger_update_profile_total_likes
  AFTER INSERT OR DELETE ON public.post_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_total_likes();

-- ============================================
-- TRIGGER 3: post_images cascade delete quando post é deletado
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_post_images_on_post_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.post_images WHERE post_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_delete_post_images ON public.posts;
CREATE TRIGGER trigger_delete_post_images
  BEFORE DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.delete_post_images_on_post_delete();

-- ============================================
-- UNIQUE constraint em profiles.name (case-insensitive)
-- ============================================
-- Adicionar coluna show_whatsapp para persistir visibilidade do WhatsApp
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_whatsapp boolean NOT NULL DEFAULT true;

-- Criar índice UNIQUE case-insensitive em profiles.name
DROP INDEX IF EXISTS idx_profiles_name_unique;
CREATE UNIQUE INDEX idx_profiles_name_unique ON public.profiles (lower(name));
