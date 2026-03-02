
CREATE OR REPLACE FUNCTION public.notify_all_game_state(p_game_on boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, tipo, mensagem)
  SELECT user_id, 'sistema',
    CASE WHEN p_game_on
      THEN '🚀 A Rede Playlike está no ar, comece a jogar!'
      ELSE '⏸️ A Rede Playlike está acumulando Prêmios, avisaremos!'
    END
  FROM public.profiles
  WHERE is_bot = false;
END;
$$;
