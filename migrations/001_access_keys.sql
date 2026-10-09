CREATE TABLE public.access_key_records (
  id text PRIMARY KEY,
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 1 AND 120),
  email text NOT NULL CHECK (char_length(btrim(email)) BETWEEN 3 AND 254),
  name_prefix text NOT NULL CHECK (char_length(name_prefix) BETWEEN 1 AND 32),
  key_digest char(64) NOT NULL UNIQUE CHECK (key_digest ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'revoked')),
  consent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX access_key_records_created_at_idx ON public.access_key_records (created_at DESC);
CREATE INDEX access_key_records_email_idx ON public.access_key_records (lower(email));
CREATE TABLE public.request_rate_limits (
  scope text NOT NULL CHECK (scope IN ('key_generation_ip', 'key_generation_email', 'admin_login_ip')),
  fingerprint char(64) NOT NULL CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count >= 1),
  PRIMARY KEY (scope, fingerprint)
);
GRANT USAGE ON SCHEMA public TO murshid_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.access_key_records TO murshid_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.request_rate_limits TO murshid_app;
