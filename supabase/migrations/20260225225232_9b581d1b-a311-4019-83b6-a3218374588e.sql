
-- Add address fields to doacoes_premios
ALTER TABLE public.doacoes_premios 
  ADD COLUMN IF NOT EXISTS quantidade integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text;

-- Add address fields to premios (copied from doacao on approve)
ALTER TABLE public.premios
  ADD COLUMN IF NOT EXISTS quantidade integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text;

-- Add ticket code to resgates
ALTER TABLE public.resgates
  ADD COLUMN IF NOT EXISTS codigo_ticket text,
  ADD COLUMN IF NOT EXISTS endereco_completo text;
