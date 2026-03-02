
-- Rules content managed by admin
CREATE TABLE public.regras_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image', -- 'image' or 'video'
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.regras_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regras viewable by everyone"
ON public.regras_content FOR SELECT
USING (true);

CREATE POLICY "Admins can manage regras"
ON public.regras_content FOR ALL
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- Help tickets
CREATE TABLE public.ajuda_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  texto text NOT NULL,
  foto_url text,
  status text NOT NULL DEFAULT 'pendente',
  resposta text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ajuda_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
ON public.ajuda_tickets FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Users can create own tickets"
ON public.ajuda_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update tickets"
ON public.ajuda_tickets FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete tickets"
ON public.ajuda_tickets FOR DELETE
USING (has_role(auth.uid(), 'admin'::text));

-- Create trigger for ajuda updated_at
CREATE TRIGGER update_ajuda_tickets_updated_at
BEFORE UPDATE ON public.ajuda_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
