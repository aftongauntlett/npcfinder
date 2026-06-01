# Privacy and Compliance Notes

Last updated: 2026-06-01

This document tracks privacy/compliance implementation details in the app and highlights current coverage vs. upcoming work.

## What Is Implemented

1. Public privacy policy page is available at `/privacy`.
2. Public terms of service page is available at `/terms`.
3. Signup flow includes consent text linking to privacy policy and terms of service.
4. Privacy consent ledger exists in `public.privacy_consent` with:
   - `user_id`
   - `accepted_at`
   - `policy_version`
5. Terms consent ledger exists in `public.terms_consent` with:
   - `user_id`
   - `accepted_at`
   - `terms_version`
6. Consent is recorded automatically on account creation via triggers on `auth.users` inserts.
7. Existing users are backfilled for policy version `1.0`.
8. Account deletion runs server-side through the `delete-user` edge function.
9. Consent ledger records are intentionally retained for legal audit after account deletion.

## Related Files

- `src/components/pages/PrivacyPolicyPage.tsx`
- `src/components/pages/TermsOfServicePage.tsx`
- `src/components/pages/AuthPage.tsx`
- `supabase/migrations/20260601000003_privacy_consent_ledger.sql`
- `supabase/migrations/20260601000004_terms_consent_ledger.sql`
- `supabase/functions/delete-user/index.ts`

## Backend Security Validation

- Automated runbook parity suite: `npm run test:backend-security`
- Seeded user flow: `npm run test:backend-security:seeded`
- Runbook doc: `docs/BACKEND-SECURITY-TESTING-RUNBOOK.md`

## Follow-Ups (Recommended)

1. Add explicit DSAR workflow documentation (access, correction, deletion, objection).
2. Define retention windows per data category beyond consent log retention.
3. Add release checklist entry for legal-policy version bump + migration update when policy changes.
