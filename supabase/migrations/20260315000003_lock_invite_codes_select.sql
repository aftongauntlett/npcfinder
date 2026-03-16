-- Security hardening: restrict invite_codes row visibility to admins only

DROP POLICY IF EXISTS "public_validate_or_admins_view_all" ON invite_codes;

CREATE POLICY "admins_view_all_codes" ON invite_codes
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );
