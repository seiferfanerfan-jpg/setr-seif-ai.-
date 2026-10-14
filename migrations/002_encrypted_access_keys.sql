ALTER TABLE public.access_key_records
  ADD COLUMN IF NOT EXISTS encrypted_key text;
