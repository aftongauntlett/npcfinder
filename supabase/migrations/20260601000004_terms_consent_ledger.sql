-- Terms compliance baseline: terms acceptance ledger.
-- Intentionally stores a legal record that survives account deletion.

CREATE TABLE IF NOT EXISTS public.terms_consent (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  terms_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT terms_consent_version_not_blank CHECK (
    btrim(terms_version) <> ''
  ),
  CONSTRAINT terms_consent_user_version_unique UNIQUE (user_id, terms_version)
);

COMMENT ON TABLE public.terms_consent IS
  'Legal consent ledger for terms of service acceptance. Intentionally not foreign-keyed to auth.users so records survive account deletion.';

COMMENT ON COLUMN public.terms_consent.user_id IS
  'Auth user UUID at time of terms acceptance. Retained for legal audit after account deletion.';

COMMENT ON COLUMN public.terms_consent.terms_version IS
  'Version of terms of service accepted by the user.';

CREATE INDEX IF NOT EXISTS idx_terms_consent_user_id
  ON public.terms_consent (user_id);

CREATE INDEX IF NOT EXISTS idx_terms_consent_accepted_at
  ON public.terms_consent (accepted_at DESC);

ALTER TABLE public.terms_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "terms_consent_select_own_or_admin" ON public.terms_consent;
CREATE POLICY "terms_consent_select_own_or_admin"
ON public.terms_consent
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
);

GRANT SELECT ON public.terms_consent TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.terms_consent TO service_role;

CREATE OR REPLACE FUNCTION public.capture_terms_consent_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.terms_consent (user_id, accepted_at, terms_version)
  VALUES (NEW.id, COALESCE(NEW.created_at, now()), '1.0')
  ON CONFLICT (user_id, terms_version) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_terms_consent_on_signup_trigger ON auth.users;
CREATE TRIGGER capture_terms_consent_on_signup_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.capture_terms_consent_on_signup();

-- Backfill current users so the ledger is complete at rollout time.
INSERT INTO public.terms_consent (user_id, accepted_at, terms_version)
SELECT
  u.id,
  COALESCE(u.created_at, now()),
  '1.0'
FROM auth.users u
ON CONFLICT (user_id, terms_version) DO NOTHING;
