-- Add missing admin policies for invite_code_audit_log table
--
-- REVIEW FINDING:
-- Policy "Admins can update any profile" combined with triggers is correct but 
-- lacks explicit policy for admin SELECT on audit tables except flawed one.
-- 
-- CURRENT STATE:
-- invite_code_audit_log has:
-- ✅ SELECT policy: "Admins can view audit logs" (uses is_admin check)
-- ✅ INSERT policy: "System can insert audit logs" (WITH CHECK true)
-- ❌ Missing UPDATE policy for admins
-- ❌ Missing DELETE policy for admins
--
-- SOLUTION:
-- Add UPDATE and DELETE policies mirroring the pattern used for other admin operations.
-- Audit logs should typically be immutable, but admins may need to clean up or fix data.

-- ============================================
-- STEP 1: Add UPDATE policy for admins
-- ============================================

-- Admins can update audit log entries (for corrections/cleanup)
DROP POLICY IF EXISTS "Admins can update audit logs" ON public.invite_code_audit_log;

CREATE POLICY "Admins can update audit logs"
  ON public.invite_code_audit_log
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMENT ON POLICY "Admins can update audit logs" ON public.invite_code_audit_log IS 
  'Allows admin users to update audit log entries for corrections or cleanup.
   Uses is_admin() helper function to check admin status.';

-- ============================================
-- STEP 2: Add DELETE policy for admins
-- ============================================

-- Admins can delete audit log entries (for cleanup/GDPR/testing)
DROP POLICY IF EXISTS "Admins can delete audit logs" ON public.invite_code_audit_log;

CREATE POLICY "Admins can delete audit logs"
  ON public.invite_code_audit_log
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

COMMENT ON POLICY "Admins can delete audit logs" ON public.invite_code_audit_log IS 
  'Allows admin users to delete audit log entries for cleanup, GDPR compliance, or testing.
   Uses is_admin() helper function to check admin status.';

-- ============================================
-- STEP 3: Verify all policies exist
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
  policy_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Audit Log RLS Policy Verification';
  RAISE NOTICE '========================================';
  
  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'invite_code_audit_log';
  
  RAISE NOTICE 'Total policies on invite_code_audit_log: %', policy_count;
  RAISE NOTICE '';
  
  -- List all policies
  FOR policy_record IN
    SELECT 
      policyname,
      cmd as command,
      CASE 
        WHEN roles = '{authenticated}' THEN 'authenticated'
        WHEN roles = '{postgres}' THEN 'postgres'
        ELSE array_to_string(roles, ', ')
      END as role
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'invite_code_audit_log'
    ORDER BY 
      CASE cmd
        WHEN 'SELECT' THEN 1
        WHEN 'INSERT' THEN 2
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
        ELSE 5
      END
  LOOP
    RAISE NOTICE 'Policy: %', policy_record.policyname;
    RAISE NOTICE '  Command: %', policy_record.command;
    RAISE NOTICE '  Role: %', policy_record.role;
    RAISE NOTICE '';
  END LOOP;
  
  -- Verify expected policies exist
  IF policy_count = 4 THEN
    RAISE NOTICE '✅ All 4 expected policies present (SELECT, INSERT, UPDATE, DELETE)';
  ELSE
    RAISE WARNING '⚠️  Expected 4 policies, found %', policy_count;
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- STEP 4: Verify table-level grants
-- ============================================

DO $$
DECLARE
  has_select BOOLEAN;
  has_insert BOOLEAN;
  has_update BOOLEAN;
  has_delete BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Table-Level Grant Verification:';
  RAISE NOTICE '========================================';
  
  -- Check grants for authenticated role
  SELECT 
    has_table_privilege('authenticated', 'public.invite_code_audit_log', 'SELECT') INTO has_select;
  SELECT 
    has_table_privilege('authenticated', 'public.invite_code_audit_log', 'INSERT') INTO has_insert;
  SELECT 
    has_table_privilege('authenticated', 'public.invite_code_audit_log', 'UPDATE') INTO has_update;
  SELECT 
    has_table_privilege('authenticated', 'public.invite_code_audit_log', 'DELETE') INTO has_delete;
  
  RAISE NOTICE 'Grants for authenticated role:';
  RAISE NOTICE '  SELECT: %', CASE WHEN has_select THEN '✓' ELSE '✗ (may need GRANT)' END;
  RAISE NOTICE '  INSERT: %', CASE WHEN has_insert THEN '✓' ELSE '✗ (may need GRANT)' END;
  RAISE NOTICE '  UPDATE: %', CASE WHEN has_update THEN '✓' ELSE '✗ (may need GRANT)' END;
  RAISE NOTICE '  DELETE: %', CASE WHEN has_delete THEN '✓' ELSE '✗ (may need GRANT)' END;
  
  -- Add grants if missing
  IF NOT has_update OR NOT has_delete THEN
    RAISE NOTICE '';
    RAISE NOTICE 'Adding missing table-level grants...';
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.invite_code_audit_log TO authenticated;
    RAISE NOTICE '✓ Grants added';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- STEP 5: Document the audit log security model
-- ============================================

COMMENT ON TABLE public.invite_code_audit_log IS 
  'Audit log tracking all invite code usage.
   
   RLS Policies:
   - SELECT: Admin-only (via is_admin check)
   - INSERT: System-wide (WITH CHECK true) for trigger functions
   - UPDATE: Admin-only (for corrections/cleanup)
   - DELETE: Admin-only (for cleanup/GDPR/testing)
   
   Security Model:
   - Regular users cannot view audit logs
   - Only SECURITY DEFINER functions can insert (via triggers)
   - Admins have full access for management
   - Designed for immutability (updates/deletes should be rare)';

-- ============================================
-- Final Summary
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added policies:';
  RAISE NOTICE '  - Admins can update audit logs';
  RAISE NOTICE '  - Admins can delete audit logs';
  RAISE NOTICE '';
  RAISE NOTICE 'Audit log table now has complete admin coverage:';
  RAISE NOTICE '  ✓ SELECT (view)';
  RAISE NOTICE '  ✓ INSERT (system)';
  RAISE NOTICE '  ✓ UPDATE (admin)';
  RAISE NOTICE '  ✓ DELETE (admin)';
  RAISE NOTICE '========================================';
END $$;
