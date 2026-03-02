
-- ==================================================
-- NOTIFICATIONS TABLE
-- ==================================================
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tipo varchar(50) NOT NULL,
  post_id uuid NULL,
  chat_id uuid NULL,
  from_user_id uuid NULL,
  mensagem text NULL,
  lido boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ==================================================
-- CHATS TABLE (30-day expiry, opened by mimo)
-- ==================================================
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  juiz_id uuid NOT NULL,
  jogador_id uuid NOT NULL,
  likes_enviados integer NOT NULL DEFAULT 0,
  data_inicio timestamp with time zone NOT NULL DEFAULT now(),
  data_fim timestamp with time zone NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view their chats"
  ON public.chats FOR SELECT
  USING (auth.uid() = juiz_id OR auth.uid() = jogador_id);

CREATE POLICY "Authenticated juizes can create chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = juiz_id);

CREATE POLICY "Chat participants can update chats"
  ON public.chats FOR UPDATE
  USING (auth.uid() = juiz_id OR auth.uid() = jogador_id);

-- ==================================================
-- CHAT MESSAGES TABLE
-- ==================================================
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NULL,
  media_url text NULL,
  media_type text NULL DEFAULT 'image',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = chat_messages.chat_id
        AND (chats.juiz_id = auth.uid() OR chats.jogador_id = auth.uid())
    )
  );

CREATE POLICY "Chat participants can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = chat_messages.chat_id
        AND (chats.juiz_id = auth.uid() OR chats.jogador_id = auth.uid())
        AND chats.ativa = true
        AND chats.data_fim > now()
    )
  );

-- ==================================================
-- ENABLE REALTIME FOR NOTIFICATIONS AND CHAT MESSAGES
-- ==================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;

-- ==================================================
-- FUNCTION: send_mimo (transfer likes + open chat)
-- ==================================================
CREATE OR REPLACE FUNCTION public.send_mimo(
  p_juiz_id uuid,
  p_jogador_id uuid,
  p_likes integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_juiz_likes integer;
  v_chat_id uuid;
  v_existing_chat_id uuid;
BEGIN
  -- Check juiz has enough likes
  SELECT total_likes INTO v_juiz_likes
  FROM public.profiles
  WHERE user_id = p_juiz_id;

  IF v_juiz_likes IS NULL OR v_juiz_likes < p_likes THEN
    RAISE EXCEPTION 'Likes insuficientes para enviar mimo';
  END IF;

  IF p_likes < 100 THEN
    RAISE EXCEPTION 'Mimo mínimo é de 100 likes';
  END IF;

  -- Deduct from juiz
  UPDATE public.profiles
  SET total_likes = total_likes - p_likes
  WHERE user_id = p_juiz_id;

  -- Add to jogador
  UPDATE public.profiles
  SET total_likes = total_likes + p_likes
  WHERE user_id = p_jogador_id;

  -- Check if active chat already exists between them
  SELECT id INTO v_existing_chat_id
  FROM public.chats
  WHERE juiz_id = p_juiz_id
    AND jogador_id = p_jogador_id
    AND ativa = true
    AND data_fim > now()
  LIMIT 1;

  IF v_existing_chat_id IS NOT NULL THEN
    -- Extend existing chat by 30 more days from now
    UPDATE public.chats
    SET 
      data_fim = now() + INTERVAL '30 days',
      likes_enviados = likes_enviados + p_likes
    WHERE id = v_existing_chat_id;
    v_chat_id := v_existing_chat_id;
  ELSE
    -- Create new chat
    INSERT INTO public.chats (juiz_id, jogador_id, likes_enviados, data_inicio, data_fim, ativa)
    VALUES (p_juiz_id, p_jogador_id, p_likes, now(), now() + INTERVAL '30 days', true)
    RETURNING id INTO v_chat_id;
  END IF;

  -- Create notification for jogador
  INSERT INTO public.notifications (user_id, tipo, chat_id, from_user_id, mensagem)
  VALUES (
    p_jogador_id, 
    'mimo', 
    v_chat_id, 
    p_juiz_id,
    'Você recebeu um mimo de ' || p_likes || ' likes! 🎁'
  );

  RETURN v_chat_id;
END;
$$;
