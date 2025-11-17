# Security Checklist

**Purpose**: Ongoing security maintenance tasks  
**Audience**: Maintainers and administrators  
**Last Updated**: November 16, 2025

---

## Monthly Tasks

### 1. Review Supabase Dashboard

**Authentication**:

- [ ] Check for unusual login patterns
- [ ] Review failed authentication attempts
- [ ] Verify active sessions count is reasonable

**Database**:

- [ ] Review database performance metrics
- [ ] Check for slow queries (> 1 second)
- [ ] Verify RLS policies are enabled on all tables

**Storage & Usage**:

- [ ] Check storage usage trends
- [ ] Review API request patterns
- [ ] Monitor bandwidth usage

**Action**: Navigate to https://supabase.com/dashboard → Select Project → Monitor metrics

---

### 2. Dependency Updates

**Check for Updates**:

```bash
npm outdated
```

**Security Audit**:

```bash
npm audit
```

**Review Critical Updates**:

- [ ] Check for security vulnerabilities
- [ ] Update dependencies with critical patches
- [ ] Test application after updates

**Action**:

```bash
# Update all dependencies (review changes first)
npm update

# Or update specific package
npm update @supabase/supabase-js

# Run tests after updates
npm run typecheck && npm run lint && npm run test
```

---

### 3. Review Invite Codes

**Admin Panel**:

- [ ] Check for unused invite codes older than 30 days
- [ ] Review invite code creation patterns
- [ ] Verify no suspicious invite code usage

**Action**: Visit Admin Panel → Invite Codes → Sort by Status/Date

---

### 4. Monitor User Activity

**Look For**:

- [ ] Unusually high number of recommendations from single user
- [ ] Rapid-fire review posting
- [ ] Excessive connection requests
- [ ] Users with no activity (potential abandoned accounts)

**Action**: Admin Panel → User Search → Review user profiles

---

## Pre-Deployment Checklist

Before deploying new features or major changes:

### 1. Code Review

- [ ] All new database queries use RLS-protected tables
- [ ] No secrets or API keys hardcoded in client code
- [ ] User input is validated (Zod schemas where applicable)
- [ ] No `dangerouslySetInnerHTML` usage introduced
- [ ] Admin actions have authorization checks
- [ ] TypeScript strict mode passes (`npm run typecheck`)
- [ ] Linter passes (`npm run lint`)

---

### 2. Testing

- [ ] All tests pass (`npm run test`)
- [ ] Manual testing completed for new features
- [ ] Admin panel functionality verified (if admin features changed)
- [ ] Mobile responsive testing (if UI changed)
- [ ] Accessibility testing (keyboard navigation, screen reader)

---

### 3. Database Changes

- [ ] New migrations created (never edit existing migrations)
- [ ] Migrations tested locally:
  ```bash
  supabase db reset --local
  ```
- [ ] RLS policies enabled on new tables
- [ ] RLS policies tested with different user roles
- [ ] Indexes added for frequently queried columns
- [ ] Foreign key constraints properly configured

**Action**: See `docs/DATABASE-MIGRATIONS.md` for migration guidelines

---

### 4. Environment Variables

- [ ] `.env.example` updated with new variables
- [ ] Production environment variables configured in Vercel
- [ ] No secrets exposed in client code (all use `VITE_` prefix or server-only)
- [ ] Environment validation updated if new required variables added

**Action**: Check `src/lib/validateEnv.ts` and `.env.example` are in sync

---

### 5. Documentation

- [ ] README updated if public-facing features changed
- [ ] API documentation updated (`docs/API-SETUP.md`)
- [ ] CHANGELOG updated with user-facing changes
- [ ] Code comments added for complex logic

---

## Post-Feature-Addition Tasks

After deploying a new feature that interacts with user data:

### 1. Security Review

- [ ] Review database queries for proper RLS enforcement
- [ ] Test feature with non-admin user account
- [ ] Verify user data isolation (users can't see others' data)
- [ ] Check for potential XSS vectors if feature displays user input
- [ ] Confirm no sensitive data logged to console

---

### 2. Performance Review

- [ ] Check Supabase dashboard for query performance
- [ ] Review client-side bundle size if new dependencies added
- [ ] Test feature with slow network (throttle in DevTools)
- [ ] Verify loading states display correctly

---

### 3. Data Integrity

- [ ] Confirm foreign key relationships work correctly
- [ ] Test edge cases (empty states, maximum values, null handling)
- [ ] Verify data cleanup on user deletion (if applicable)

---

## Quarterly Tasks

### 1. Comprehensive Security Review

- [ ] Re-run security checklist from `SECURITY-REVIEW-2025.md`
- [ ] Review all RLS policies for correctness
- [ ] Audit admin access logs (`invite_code_audit_log` table)
- [ ] Check for deprecated Supabase features
- [ ] Review Supabase security advisories

**Action**: Schedule 2-hour review session every 3 months

---

### 2. Backup Verification

- [ ] Verify Supabase automatic backups are enabled
- [ ] Download latest database backup and verify integrity:
  ```bash
  # From Supabase Dashboard → Database → Backups
  # Download backup
  # Restore to local instance
  supabase db reset --local --from-backup backup.sql
  ```

---

### 3. User Data Cleanup

- [ ] Review and remove abandoned accounts (no activity in 6+ months)
- [ ] Clean up old invite codes (expired and revoked)
- [ ] Archive or delete old rate limit records (if rate limiting implemented)

**Action**: Run cleanup scripts or manually review in Admin Panel

---

### 4. Dependency Deep Dive

- [ ] Review all dependencies for unmaintained packages
- [ ] Check for alternative packages with better security
- [ ] Update major versions (test thoroughly)
- [ ] Remove unused dependencies

**Action**:

```bash
# Check for unused dependencies
npx depcheck

# Review dependency tree
npm list --depth=0
```

---

## Incident Response

If a security issue is discovered:

### 1. Immediate Actions

**If Active Exploit**:

- [ ] Disable affected feature via Vercel deployment (rollback if needed)
- [ ] Revoke compromised API keys/tokens
- [ ] Force logout all users (Supabase Dashboard → Authentication → Users → Logout All)
- [ ] Enable Vercel password protection temporarily if needed

**If Data Breach Suspected**:

- [ ] Export audit logs from Supabase
- [ ] Review `invite_code_audit_log` for suspicious admin actions
- [ ] Check Supabase logs for unauthorized access patterns
- [ ] Document timeline of events

---

### 2. Investigation

- [ ] Identify affected users/data
- [ ] Review code changes leading to vulnerability
- [ ] Check git history for when vulnerability was introduced
- [ ] Assess scope of impact

---

### 3. Remediation

- [ ] Develop and test fix locally
- [ ] Create hotfix branch
- [ ] Deploy fix to production
- [ ] Verify fix resolves issue
- [ ] Update tests to prevent regression

---

### 4. Communication

**If User Data Affected**:

- [ ] Notify affected users via email
- [ ] Provide clear explanation of what happened
- [ ] Explain steps taken to remediate
- [ ] Offer guidance on protective actions (e.g., password change)

**Internal**:

- [ ] Document incident in `CHANGELOG.md`
- [ ] Update security documentation with lessons learned
- [ ] Add test coverage to prevent recurrence

---

### 5. Post-Incident Review

- [ ] Conduct root cause analysis
- [ ] Identify preventive measures
- [ ] Update this checklist with new tasks
- [ ] Schedule follow-up security review

---

## Configuration Verification

Run these checks periodically to ensure security configurations are intact:

### 1. Vercel Security Headers

**Check**: View response headers in browser DevTools

Expected headers:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [full CSP policy]
```

**Action**: If headers missing, verify `vercel.json` configuration and redeploy

---

### 2. Environment Variables

**Check**: Verify all required variables are set

```bash
# Local development
cat .env.local | grep -E '^VITE_'

# Production (Vercel Dashboard)
# Settings → Environment Variables
```

Required:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Action**: If missing, add to `.env.local` and Vercel dashboard

---

### 3. RLS Policies

**Check**: Run test suite to verify RLS enforcement

```bash
npm run test
```

**Manual Check** (Supabase SQL Editor):

```sql
-- Verify RLS enabled on all user tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'user_watchlist',
    'reading_list',
    'music_library',
    'game_library',
    'media_reviews'
  );
-- All should show rowsecurity = true
```

---

### 4. Admin Protection

**Check**: Verify admin triggers are active

```sql
-- List all triggers on user_profiles
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles';
```

Expected triggers:

- `prevent_admin_self_grant_trigger`
- `prevent_admin_escalation_trigger`
- `prevent_super_admin_revoke_trigger`

---

## Emergency Contacts

**Supabase Support**:

- Dashboard: https://supabase.com/dashboard/support
- Email: support@supabase.com (Pro plan only)
- Discord: https://discord.supabase.com

**Vercel Support**:

- Dashboard: https://vercel.com/support
- Documentation: https://vercel.com/docs

**External API Support**:

- TMDB: https://www.themoviedb.org/talk
- RAWG: support@rawg.io
- Google Books: https://issuetracker.google.com/issues?q=componentid:192689

---

## Tools & Resources

**Security Testing**:

- [ ] [Observatory by Mozilla](https://observatory.mozilla.org/) - HTTP security headers scan
- [ ] [Security Headers](https://securityheaders.com/) - Header analysis
- [ ] [Snyk](https://snyk.io/) - Dependency vulnerability scanning
- [ ] [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Built-in security audit

**Database Tools**:

- [ ] Supabase Studio - Local database GUI
- [ ] pgAdmin - PostgreSQL management
- [ ] SQL Editor in Supabase Dashboard

**Monitoring**:

- [ ] Vercel Analytics - Performance monitoring
- [ ] Supabase Dashboard - Database metrics
- [ ] Browser DevTools - Network/console monitoring

---

## Checklist Maintenance

**Review This Checklist**:

- [ ] After each security incident
- [ ] When new features with security implications are added
- [ ] Every 6 months as part of quarterly review
- [ ] When team members change

**Update This Document**:

- [ ] Add new tasks based on lessons learned
- [ ] Remove tasks that no longer apply
- [ ] Update tool links and contact information
- [ ] Keep sync with `SECURITY-REVIEW-2025.md` recommendations

---

**Last Updated**: November 16, 2025  
**Next Review**: May 16, 2026  
**Maintained By**: Project maintainers
