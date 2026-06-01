-- Privacy compliance baseline: consent ledger for policy acceptance.
-- Intentionally stores a legal record that survives account deletion.

CREATE TABLE IF NOT EXISTS public.privacy_consent (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  policy_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT privacy_consent_policy_version_not_blank CHECK (
    btrim(policy_version) <> ''
  ),
  CONSTRAINT privacy_consent_user_policy_unique UNIQUE (user_id, policy_version)
);

COMMENT ON TABLE public.privacy_consent IS
  'Legal consent ledger for privacy policy acceptance. Intentionally not foreign-keyed to auth.users so records survive account deletion.';

COMMENT ON COLUMN public.privacy_consent.user_id IS
  'Auth user UUID at time of consent. Retained for legal audit after account deletion.';

COMMENT ON COLUMN public.privacy_consent.policy_version IS
  'Version of privacy policy accepted by the user.';

CREATE INDEX IF NOT EXISTS idx_privacy_consent_user_id
  ON public.privacy_consent (user_id);

CREATE INDEX IF NOT EXISTS idx_privacy_consent_accepted_at
  ON public.privacy_consent (accepted_at DESC);

ALTER TABLE public.privacy_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "privacy_consent_select_own_or_admin" ON public.privacy_consent;
CREATE POLICY "privacy_consent_select_own_or_admin"
ON public.privacy_consent
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
);

GRANT SELECT ON public.privacy_consent TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.privacy_consent TO service_role;

CREATE OR REPLACE FUNCTION public.capture_privacy_consent_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.privacy_consent (user_id, accepted_at, policy_version)
  VALUES (NEW.id, COALESCE(NEW.created_at, now()), '1.0')
  ON CONFLICT (user_id, policy_version) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_privacy_consent_on_signup_trigger ON auth.users;
CREATE TRIGGER capture_privacy_consent_on_signup_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.capture_privacy_consent_on_signup();

-- Backfill current users so the ledger is complete at rollout time.
INSERT INTO public.privacy_consent (user_id, accepted_at, policy_version)
SELECT
  u.id,
  COALESCE(u.created_at, now()),
  '1.0'
FROM auth.users u
ON CONFLICT (user_id, policy_version) DO NOTHING;
