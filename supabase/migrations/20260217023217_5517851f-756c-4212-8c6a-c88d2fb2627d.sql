-- Change default post expiration from 30 days to 90 days
ALTER TABLE public.posts ALTER COLUMN expires_at SET DEFAULT (now() + interval '90 days');

-- Update RLS policy to use expires_at for visibility (already exists, no change needed)
