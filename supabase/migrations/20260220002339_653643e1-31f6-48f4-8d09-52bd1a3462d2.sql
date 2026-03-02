
-- Create desafios table for judge challenges
CREATE TABLE public.desafios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  juiz_id UUID NOT NULL,
  video_url TEXT,
  texto TEXT,
  aprovado BOOLEAN NOT NULL DEFAULT false,
  rejeitado BOOLEAN NOT NULL DEFAULT false,
  likes_pago INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.desafios ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Desafios aprovados viewable by everyone"
ON public.desafios FOR SELECT
USING (aprovado = true OR auth.uid() = juiz_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Juizes can create desafios"
ON public.desafios FOR INSERT
WITH CHECK (auth.uid() = juiz_id);

CREATE POLICY "Admins can update desafios"
ON public.desafios FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete desafios"
ON public.desafios FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for desafios
ALTER PUBLICATION supabase_realtime ADD TABLE public.desafios;
