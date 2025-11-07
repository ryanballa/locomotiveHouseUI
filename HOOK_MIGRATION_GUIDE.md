# Hook Migration Guide

## Quick Reference: Old Pattern vs New Pattern

### Getting User Data

#### OLD (❌ Avoid)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';
import type { User } from '@/lib/api';

export function MyComponent() {
  const { getToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await getToken();
      const userData = await apiClient.getCurrentUser(token);
      setUser(userData);
      setLoading(false);
    };
    fetchUser();
  }, [getToken]);

  if (loading) return <div>Loading...</div>;
  return <div>Welcome {user?.name}</div>;
}
```

#### NEW (✅ Recommended)
```typescript
'use client';

import { useSessionUser } from '@/hooks/useSessionUser';

export function MyComponent() {
  const { user, isLoading } = useSessionUser();

  if (isLoading) return <div>Loading...</div>;
  return <div>Welcome {user?.name}</div>;
}
```

---

### Checking Admin Status

#### OLD (❌ Avoid)
```typescript
import { useAdminCheck } from '@/hooks/useAdminCheck';

export function AdminPanel() {
  const { isAdmin, isSuperAdmin, loading, error } = useAdminCheck();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error.message} />;
  if (!isAdmin) return <AccessDenied />;

  return (
    <div>
      {isSuperAdmin ? (
        <SuperAdminControls />
      ) : (
        <AdminControls />
      )}
    </div>
  );
}
```

**Note:** The new `useAdminCheck` already uses session data internally, so this usage is still correct! The hook has been refactored to eliminate duplicate API calls behind the scenes.

#### NEW (✅ Same API, Optimized Internally)
```typescript
import { useAdminCheck } from '@/hooks/useAdminCheck';

export function AdminPanel() {
  const { isAdmin, isSuperAdmin, loading, error } = useAdminCheck();
  // ^ This now uses useSessionUser() internally!

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error.message} />;
  if (!isAdmin) return <AccessDenied />;

  return (
    <div>
      {isSuperAdmin ? (
        <SuperAdminControls />
      ) : (
        <AdminControls />
      )}
    </div>
  );
}
```

---

### Checking Club Access

#### OLD (❌ Avoid - Manual API Calls)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';

export function ClubFeature() {
  const { getToken } = useAuth();
  const [clubId, setClubId] = useState<number | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = await getToken();
      const user = await apiClient.getCurrentUser(token);
      setClubId(user?.club_id || null);
      setIsSuperAdmin(user?.permission === 3);
      setLoading(false);
    };
    fetchData();
  }, [getToken]);

  if (loading) return <LoadingSpinner />;
  return <div>Club: {clubId}</div>;
}
```

#### NEW (✅ Recommended)
```typescript
'use client';

import { useClubCheck } from '@/hooks/useClubCheck';

export function ClubFeature() {
  const { clubId, isSuperAdmin, loading } = useClubCheck();
  // ^ Automatically uses cached session data!

  if (loading) return <LoadingSpinner />;
  return <div>Club: {clubId}</div>;
}
```

---

### Getting User's Clubs List

#### OLD (❌ Avoid)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';
import type { Club } from '@/lib/api';

export function ClubSelector() {
  const { getToken } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentClubId, setCurrentClubId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      const token = await getToken();
      const allClubs = await apiClient.getClubs(token);
      const user = await apiClient.getCurrentUser(token); // DUPLICATE CALL!

      setClubs(allClubs);
      setCurrentClubId(user?.club_id || null);
      setLoading(false);
    };
    fetchClubs();
  }, [getToken]);

  if (loading) return <LoadingSpinner />;
  return (
    <select>
      {clubs.map(club => (
        <option key={club.id}>{club.name}</option>
      ))}
    </select>
  );
}
```

#### NEW (✅ Recommended)
```typescript
'use client';

import { useUserClubs } from '@/hooks/useUserClubs';

export function ClubSelector() {
  const { clubs, currentClubId, selectClub, loading } = useUserClubs();
  // ^ User data comes from cached session, only clubs list fetched!

  if (loading) return <LoadingSpinner />;
  return (
    <select value={currentClubId || ''} onChange={(e) => selectClub(Number(e.target.value))}>
      {clubs.map(club => (
        <option key={club.id} value={club.id}>{club.name}</option>
      ))}
    </select>
  );
}
```

---

## Hook API Reference

### `useSessionUser()`

Get the centralized user session data.

```typescript
const {
  user,        // User | null - Full user object from API
  isSignedIn,  // boolean - Whether user is authenticated
  isLoading,   // boolean - Data is being fetched
  error,       // UserSessionError | null - Error if fetch failed
  refetch,     // () => Promise<void> - Manually refetch user data
} = useSessionUser();
```

**User Object Structure:**
```typescript
{
  id: number;              // Database user ID
  token: string;           // Clerk JWT token
  name?: string;
  email?: string;
  permission: number | null; // 1=Admin, 2=Regular, 3=SuperAdmin, 4=Limited
  club_id?: number | null;   // Primary club assignment
  clubs?: Array<{            // All club assignments
    club_id: number;
  }>;
}
```

**Error Object:**
```typescript
{
  code: 'UNAUTHENTICATED' | 'NETWORK' | 'NOT_FOUND' | 'UNKNOWN';
  message: string;
  cause?: unknown;
}
```

---

### `useAdminCheck()`

Check if user has admin or super admin permissions.

```typescript
const {
  isAdmin,      // boolean - User has permission 1 or 3
  isSuperAdmin, // boolean - User has permission 3
  currentUser,  // { id, permission } | null
  loading,      // boolean
  error,        // Error object or null
} = useAdminCheck();
```

**Now internally optimized:** Uses `useSessionUser()` instead of making duplicate API calls!

---

### `useClubCheck()`

Check user's club assignment and access permissions.

```typescript
const {
  clubId,         // number | null - Primary club ID
  clubIds,        // number[] - All accessible club IDs
  hasClub,        // boolean - Has club OR is super admin
  isSuperAdmin,   // boolean - Can access all clubs
  loading,        // boolean
  hasAccessToClub, // (clubId: number) => boolean - Check specific club access
} = useClubCheck();
```

**Now internally optimized:** Uses `useSessionUser()` instead of making duplicate API calls!

---

### `useUserClubs()`

Get user's accessible clubs and club selection management.

```typescript
const {
  clubs,        // Club[] - All clubs user can access
  currentClubId, // number | null - Currently selected club
  loading,      // boolean
  error,        // string | null
  selectClub,   // (clubId: number) => void - Select a club (saves to cookie)
} = useUserClubs();
```

**Optimized:** Uses `useSessionUser()` for user data, only fetches club list from API.

---

## Performance Comparison

### Before Refactoring (Multiple Components)
```
Page Load
├─ Component A mounts
│  └─ useAdminCheck → getToken() + getCurrentUser() [API call]
├─ Component B mounts
│  └─ useClubCheck → getToken() + getCurrentUser() [API call] ← DUPLICATE!
├─ Component C mounts
│  └─ useUserClubs → getToken() + getCurrentUser() + getClubs() [API calls] ← DUPLICATE!
└─ Navigation
   └─ Each new page: repeat all above calls

Total API calls for typical 5-page session: 15+ calls
```

### After Refactoring
```
Page Load
├─ UserSessionProvider initializes
│  └─ getToken() + getCurrentUser() [API call] ← ONCE!
├─ Component A mounts
│  └─ useAdminCheck → reads from session [0 calls]
├─ Component B mounts
│  └─ useClubCheck → reads from session [0 calls]
├─ Component C mounts
│  └─ useUserClubs → reads from session + getClubs() [1 API call]
└─ Navigation
   └─ Each new page: all hooks read from session [0 calls]

Total API calls for typical 5-page session: 2 calls
```

**Result: ~85% reduction in API calls!**

---

## Checklist for Updating Components

- [ ] Replace direct `useAuth()` + `getCurrentUser()` calls with `useSessionUser()`
- [ ] Remove local state management for user data (id, name, email, permission, club_id)
- [ ] Remove useEffect that fetches user data
- [ ] Remove useState for user, loading, token
- [ ] Use `isLoading` from hook instead of local loading state
- [ ] Use `error` from hook instead of local error state
- [ ] Update hook dependency arrays (usually becomes empty `[]`)
- [ ] Test component still works after refactoring
- [ ] Check TypeScript passes without errors

---

## Common Patterns

### Pattern 1: Show content only for admins
```typescript
const { isAdmin, loading } = useAdminCheck();

if (loading) return <Spinner />;
if (!isAdmin) return <AccessDenied />;
return <AdminContent />;
```

### Pattern 2: Show different UI based on club access
```typescript
const { hasClub, isSuperAdmin } = useClubCheck();

if (isSuperAdmin) return <SuperAdminView />;
if (hasClub) return <ClubView />;
return <NoClubView />;
```

### Pattern 3: Club selector dropdown
```typescript
const { clubs, currentClubId, selectClub } = useUserClubs();

return (
  <select value={currentClubId || ''} onChange={(e) => selectClub(Number(e.target.value))}>
    {clubs.map(club => (
      <option key={club.id} value={club.id}>{club.name}</option>
    ))}
  </select>
);
```

### Pattern 4: Access full user data
```typescript
const { user, isLoading, error } = useSessionUser();

if (error) return <Error message={error.message} />;
if (isLoading) return <Spinner />;
if (!user) return <SignInRequired />;

return <div>
  <h1>{user.name}</h1>
  <p>{user.email}</p>
  <p>Permission: {user.permission}</p>
</div>;
```

---

## Troubleshooting

### "useSessionUser must be used within a UserSessionProvider"
**Problem:** Component using `useSessionUser()` is outside `UserSessionProvider`
**Solution:** Check that `UserSessionProvider` is in `app/layout.tsx` wrapping all content

### User data is undefined
**Problem:** Component rendered before `isLoading` finished
**Solution:** Always check `if (isLoading) return <Spinner />` before accessing `user`

### Token not available
**Problem:** `getToken()` returns null
**Solution:** User is not signed in. Check `isSignedIn` flag from `useSessionUser()`

### Changes to user not reflected
**Problem:** Session cache has stale data
**Solution:** Call `refetch()` from `useSessionUser()` after mutations

### Session data missing after page reload
**Problem:** SessionStorage was cleared
**Solution:** This is expected - data will be refetched from API automatically

---

## Questions?

Refer to:
- `REFACTORING_SUMMARY.md` - Full overview of changes
- `context/UserSessionContext.ts` - Context type definitions
- `components/UserSessionProvider.tsx` - Provider implementation
- `hooks/useSessionUser.ts` - Session hook implementation
