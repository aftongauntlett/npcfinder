-- Fix audit log view policy to check for actual admins instead of first auth user
-- This prevents potential information exposure to non-admin users

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.invite_code_audit_log;

CREATE POLICY "Admins can view audit logs" 
ON public.invite_code_audit_log 
FOR SELECT 
USING (public.is_admin(auth.uid()));
