# Role and Permission System

## Overview

NPC Finder uses a three-tier role-based permission system to control access to features and data. Roles are stored in the database and enforced at multiple layers for security.

## Role Definitions

### User (Default)

- **Database Value**: `role = 'user'`
- **Access**: Can only view and modify their own data
- **Granted**: Automatically assigned to all new users
- **Can Be Changed**: Yes, by admins

### Admin

- **Database Value**: `role = 'admin'`
- **Access**: Can view and modify all user data, manage users, create invite codes
- **Granted**: By other admins or super admin
- **Can Be Changed**: Yes, by super admin only

### Super Admin

- **Database Value**: `role = 'super_admin'`
- **Access**: Full admin access, cannot be demoted
- **Granted**: Set once during initial deployment via app_config
- **Can Be Changed**: No, protected by database trigger

## Architecture

### Database Layer

**Schema:**

```sql
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

ALTER TABLE user_profiles
  ADD COLUMN role user_role NOT NULL DEFAULT 'user';
```

**Helper Functions:**

- `get_user_role(user_id)` - Returns the role enum for a user
- `is_admin(user_id)` - Returns true if user is admin or super_admin
- `is_super_admin(user_id)` - Returns true if user is super_admin

**Protection:**

- `prevent_super_admin_revoke()` trigger prevents changing super_admin role
- `prevent_admin_escalation_update()` trigger prevents non-admins from changing roles

### RLS Policies

All tables follow a consistent pattern:

```sql
-- SELECT: Users see own data OR admins see all
CREATE POLICY "users_select_own_or_admin_all" ON {table}
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- UPDATE: Users update own data OR admins update all
CREATE POLICY "users_update_own_or_admin_all" ON {table}
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- DELETE: Users delete own data OR admins delete all
CREATE POLICY "users_delete_own_or_admin_all" ON {table}
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );
```

### Frontend Layer

**AdminContext:**

```typescript
const { role, isAdmin, isSuperAdmin } = useAdmin();
```

Provides:

- `role: UserRole` - Current user's role ('user' | 'admin' | 'super_admin')
- `isAdmin: boolean` - True if admin or super_admin
- `isSuperAdmin: boolean` - True if super_admin
- `refreshAdminStatus()` - Refetch role from database

**Route Protection:**

```typescript
<ProtectedAdminRoute
  user={user}
  requiredRole="admin" // or 'super_admin'
>
  <AdminPage />
</ProtectedAdminRoute>
```

**Navigation Filtering:**

```typescript
// NavItem interface
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  requiredRole?: "admin" | "super_admin";
}

// Items with requiredRole are hidden from non-matching users
```

## Common Tasks

### Check User Role in Frontend

```typescript
import { useAdmin } from "@/contexts/AdminContext";

function MyComponent() {
  const { role, isAdmin, isSuperAdmin } = useAdmin();

  if (isSuperAdmin) {
    return <SuperAdminFeature />;
  }

  if (isAdmin) {
    return <AdminFeature />;
  }

  return <UserFeature />;
}
```

### Check User Role in Backend

```typescript
import { getUserRole, isAdmin } from "@/lib/admin";

async function myFunction() {
  const role = await getUserRole(userId);

  if (role === "super_admin") {
    // Super admin only logic
  }

  const hasAdminAccess = await isAdmin(userId);
  if (hasAdminAccess) {
    // Admin or super admin logic
  }
}
```

### Grant Admin Privileges

```typescript
import { updateUserRole } from "@/lib/admin";

const result = await updateUserRole(userId, "admin");
if (!result.success) {
  console.error(result.error);
}
```

### Revoke Admin Privileges

```typescript
import { updateUserRole } from "@/lib/admin";

const result = await updateUserRole(userId, "user");
if (!result.success) {
  console.error(result.error);
}
```

## Adding New Features

### Add Admin-Only Feature

1. **Create the feature** with permission checks:

```typescript
function AdminOnlyFeature() {
  const { isAdmin } = useAdmin();

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return <Feature />;
}
```

2. **Add to navigation** with requiredRole:

```typescript
{
  id: 'my-feature',
  label: 'My Feature',
  icon: MyIcon,
  path: '/app/my-feature',
  requiredRole: 'admin',
}
```

3. **Protect the route**:

```typescript
<ProtectedAdminRoute user={user} requiredRole="admin">
  <MyFeaturePage />
</ProtectedAdminRoute>
```

### Add Super Admin Only Feature

Same as above, but use `requiredRole: 'super_admin'` and check `isSuperAdmin`.

### Add RLS Policies to New Table

```sql
-- SELECT policy with admin override
CREATE POLICY "users_select_own_or_admin_all" ON my_table
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- INSERT policy (users only)
CREATE POLICY "users_insert_own" ON my_table
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy with admin override
CREATE POLICY "users_update_own_or_admin_all" ON my_table
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- DELETE policy with admin override
CREATE POLICY "users_delete_own_or_admin_all" ON my_table
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );
```

## Security Considerations

### Defense in Depth

The role system enforces permissions at three layers:

1. **Frontend** - Hides UI elements and gates routes (UX only)
2. **RLS Policies** - Enforces access at database level (primary security)
3. **Service Functions** - Additional verification in admin operations (redundant but safe)

### Fail Closed

All permission checks default to denying access:

- If database query fails → treated as non-admin
- If role is unknown → treated as 'user'
- If RLS policy is missing → access denied

### Audit Trail

All admin actions are logged to `admin_audit_log` table via `log_admin_action()` RPC function.

### Super Admin Protection

- Super admin role can only be set once during deployment
- Database trigger prevents changing super_admin to any other role
- Only super admin can demote other admins
- Super admin cannot be demoted by anyone

## Migration Guide

### From is_admin to role

The migration maintains backward compatibility:

1. **Existing `is_admin` column** becomes a generated column:

   ```sql
   is_admin GENERATED ALWAYS AS (role IN ('admin', 'super_admin')) STORED
   ```

2. **Existing queries** using `is_admin` continue to work

3. **New code** should use `role` field and new helper functions

4. **Migration process**:
   - All `is_admin = true` → `role = 'admin'`
   - All `is_admin = false` → `role = 'user'`
   - Super admin from app_config → `role = 'super_admin'`

## Troubleshooting

### User can't access admin panel

1. Check user role: `SELECT role FROM user_profiles WHERE user_id = '{id}'`
2. Verify AdminContext is querying correctly
3. Check browser console for errors
4. Verify RLS policies are applied

### Admin can't see other users' data

1. Check RLS policies on the table
2. Verify admin override clause exists: `OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')`
3. Test with: `SELECT * FROM {table}` as admin user
4. Run RLS verification script: `node scripts/verify-rls-comprehensive.js`

### Can't demote admin

1. Check if user is super admin (cannot be demoted)
2. Verify you're logged in as super admin (only they can demote admins)
3. Check for trigger errors in database logs

## Related Files

- **Migrations**: `supabase/migrations/20251207_add_role_system.sql`
- **RLS Updates**: `supabase/migrations/20251207_update_rls_for_roles.sql`
- **Frontend Context**: `src/contexts/AdminContext.tsx`
- **Backend Library**: `src/lib/admin.ts`
- **Route Protection**: `src/components/layouts/ProtectedAdminRoute.tsx`
- **Navigation**: `src/components/shared/layout/NavList.tsx`
- **Tests**: `tests/roleSystem.test.ts`
- **Verification**: `scripts/verify-rls-comprehensive.js`
