
-- Add turbo/premium expiration tracking to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS multiplicador_end timestamptz,
  ADD COLUMN IF NOT EXISTS premium_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_end timestamptz;

-- Add purchase type to compras_pix (likes, turbo, premium)
ALTER TABLE public.compras_pix
  ADD COLUMN IF NOT EXISTS tipo varchar NOT NULL DEFAULT 'likes';

-- Update trigger to use multiplicador_ativo for turbo likes
CREATE OR REPLACE FUNCTION public.update_profile_total_likes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_post_owner_id uuid;
  v_owner_is_bot boolean;
  v_mult numeric;
  v_mult_end timestamptz;
  v_effective_mult integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO v_post_owner_id FROM public.posts WHERE id = NEW.post_id;
    IF v_post_owner_id IS NOT NULL THEN
      SELECT is_bot INTO v_owner_is_bot FROM public.profiles WHERE user_id = v_post_owner_id;
      
      IF v_owner_is_bot = true THEN
        -- Bot post: reward the INTERACTING real user (always +1)
        IF NEW.interaction_type = 'like' OR NEW.interaction_type = 'love' THEN
          UPDATE public.profiles SET total_likes = total_likes + 1 
          WHERE user_id = NEW.user_id AND is_bot = false;
        END IF;
      ELSE
        -- Normal: reward post owner with turbo multiplier
        IF NEW.interaction_type = 'like' OR NEW.interaction_type = 'love' THEN
          SELECT COALESCE(multiplicador_ativo, 1), multiplicador_end
          INTO v_mult, v_mult_end
          FROM public.profiles WHERE user_id = v_post_owner_id;
          
          -- Check if turbo is active and not expired
          IF v_mult_end IS NOT NULL AND v_mult_end > now() AND v_mult > 1 THEN
            v_effective_mult := v_mult::integer;
          ELSE
            v_effective_mult := 1;
          END IF;
          
          UPDATE public.profiles SET total_likes = total_likes + v_effective_mult WHERE user_id = v_post_owner_id;
        ELSIF NEW.interaction_type = 'bomb' THEN
          UPDATE public.profiles SET total_likes = total_likes - 10 WHERE user_id = v_post_owner_id;
        END IF;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT user_id INTO v_post_owner_id FROM public.posts WHERE id = OLD.post_id;
    IF v_post_owner_id IS NOT NULL THEN
      SELECT is_bot INTO v_owner_is_bot FROM public.profiles WHERE user_id = v_post_owner_id;
      
      IF v_owner_is_bot = true THEN
        IF OLD.interaction_type = 'like' OR OLD.interaction_type = 'love' THEN
          UPDATE public.profiles SET total_likes = total_likes - 1 
          WHERE user_id = OLD.user_id AND is_bot = false;
        END IF;
      ELSE
        IF OLD.interaction_type = 'like' OR OLD.interaction_type = 'love' THEN
          UPDATE public.profiles SET total_likes = total_likes - 1 WHERE user_id = v_post_owner_id;
        ELSIF OLD.interaction_type = 'bomb' THEN
          UPDATE public.profiles SET total_likes = total_likes + 10 WHERE user_id = v_post_owner_id;
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create function to expire turbo/premium (called by cron)
CREATE OR REPLACE FUNCTION public.expire_turbo_premium()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Expire turbo
  UPDATE public.profiles 
  SET multiplicador_ativo = 1, multiplicador_end = NULL
  WHERE multiplicador_end IS NOT NULL AND multiplicador_end < now() AND multiplicador_ativo > 1;
  
  -- Expire premium
  UPDATE public.profiles 
  SET premium_active = false, premium_end = NULL
  WHERE premium_end IS NOT NULL AND premium_end < now() AND premium_active = true;
END;
$function$;
