# Session Implementation Details

## Architecture Overview

The refactored session system is based on a provider pattern that fetches user data once at app initialization and makes it available throughout the app via React Context.

```
┌─────────────────────────────────────────────┐
│        App (app/layout.tsx)                 │
│  ┌─────────────────────────────────────┐   │
│  │ ClerkProvider (Clerk auth)          │   │
│  │ ┌─────────────────────────────────┐ │   │
│  │ │ UserSessionProvider             │ │   │
│  │ │ ┌───────────────────────────────┤ │   │
│  │ │ │ UserSessionContext            │ │   │
│  │ │ │ - user: User | null           │ │   │
│  │ │ │ - isSignedIn: boolean         │ │   │
│  │ │ │ - isLoading: boolean          │ │   │
│  │ │ │ - error: UserSessionError     │ │   │
│  │ │ │ - refetch: () => Promise      │ │   │
│  │ │ └───────────────────────────────┤ │   │
│  │ │ ┌───────────────────────────────┤ │   │
│  │ │ │ All child components          │ │   │
│  │ │ │ can use useSessionUser()      │ │   │
│  │ │ └───────────────────────────────┤ │   │
│  │ └─────────────────────────────────┘ │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Data Flow

### 1. App Initialization
```
User visits app
    ↓
ClerkProvider initializes Clerk auth
    ↓
UserSessionProvider mounts
    ├─ Checks if hydrated (client-side)
    ├─ Tries to load from sessionStorage cache
    └─ If hydrated and user is signed in:
        ├─ Gets JWT token from Clerk via useAuth().getToken()
        └─ Calls apiClient.getCurrentUser(token)
            ├─ Fetches from backend API: GET /users/me
            ├─ Returns: User object with id, name, email, permission, clubs
            └─ Provider caches in sessionStorage
                    ↓
            Context updated → All children re-render with user data
```

### 2. Component Renders
```
Component mounts
    ↓
useSessionUser() → reads from context
    ↓
Returns: { user, isSignedIn, isLoading, error, refetch }
    ↓
Component renders with session data
    ↓
NO API CALL (data from context)
```

### 3. User Signs Out
```
User clicks Sign Out
    ↓
Clerk updates auth state
    ↓
UserSessionProvider detects isSignedIn = false
    ↓
Provider clears session
    ├─ Clears sessionStorage cache
    ├─ Sets user = null
    └─ Sets isSignedIn = false
        ↓
All components using useSessionUser() get notified
```

## Key Implementation Details

### UserSessionProvider Logic

```typescript
export function UserSessionProvider({ children }: UserSessionProviderProps) {
  const { isSignedIn, getToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<UserSessionError | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Step 1: Mark as hydrated on first render (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    // Load from cache to prevent flicker
    const cachedUser = getCachedUser();
    if (cachedUser) {
      setUser(cachedUser);
      setIsLoading(false);
    }
  }, []);

  // Step 2: Fetch fresh data when auth state changes
  useEffect(() => {
    if (!isHydrated) return;

    const fetchUserData = async () => {
      try {
        // Handle sign-out
        if (!isSignedIn) {
          setUser(null);
          clearUserCache();
          return;
        }

        // Check cache first
        const cachedUser = getCachedUser();
        if (cachedUser) {
          setUser(cachedUser);
          return;
        }

        // Get token from Clerk
        const token = await getToken();
        if (!token) {
          setError({
            code: 'UNAUTHENTICATED',
            message: 'Unable to get authentication token',
          });
          return;
        }

        // Fetch from backend
        const userData = await apiClient.getCurrentUser(token);
        if (!userData) {
          setError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
          return;
        }

        // Cache and set
        setCachedUser(userData);
        setUser(userData);
        setError(null);
      } catch (err) {
        // Handle various error types
        setError({
          code: 'NETWORK',
          message: 'Failed to fetch user',
          cause: err,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [isSignedIn, getToken, isHydrated]);

  // Provide context
  return (
    <UserSessionContext.Provider value={{
      user,
      isSignedIn,
      isLoading,
      error,
      refetch: fetchUserData,
    }}>
      {children}
    </UserSessionContext.Provider>
  );
}
```

### Session Cache (sessionStorage)

```typescript
// Key used to store cache
const CACHE_KEY = 'lh_user_cache';
const CACHE_VERSION = 1;

// Cache structure
interface CachedUserData {
  version: number;      // For cache invalidation
  user: User;          // The user object
  timestamp: number;   // When cached
}

// Example cache entry (JSON in sessionStorage)
{
  "version": 1,
  "user": {
    "id": 123,
    "token": "eyJhbGc...",
    "name": "John Doe",
    "email": "john@example.com",
    "permission": 1,
    "club_id": 5,
    "clubs": [{ "club_id": 5 }]
  },
  "timestamp": 1699564800000
}
```

**Cache Lifecycle:**
- ✅ Created: When user successfully fetches from API
- ✅ Read: On app reload before API call
- ✅ Cleared: When user signs out
- ✅ Cleared: On session error (401, network error)

### Derived Hooks (useAdminCheck, useClubCheck)

These hooks use `useSessionUser()` internally and compute values with `useMemo`:

```typescript
export function useAdminCheck() {
  const { user, isLoading, error: sessionError } = useSessionUser();

  // Memoize to avoid recalculating on every render
  const { currentUser, isAdmin, isSuperAdmin, error } = useMemo(() => {
    if (!user) {
      return {
        currentUser: null,
        isAdmin: false,
        isSuperAdmin: false,
        error: null,
      };
    }

    const isAdminPerm = user.permission === 1 || user.permission === 3;
    const isSuperAdminPerm = user.permission === 3;

    return {
      currentUser: { id: user.id, permission: user.permission },
      isAdmin: isAdminPerm,
      isSuperAdmin: isSuperAdminPerm,
      error: isAdminPerm ? null : {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource.',
      },
    };
  }, [user]);

  // Return computed values
  return {
    isAdmin,
    isSuperAdmin,
    currentUser,
    loading: isLoading,
    error: error || (sessionError ? { ...sessionError } : null),
  };
}
```

**Key Points:**
- ✅ No API calls in these hooks
- ✅ Uses `useMemo` to compute values efficiently
- ✅ Derives permission checks from cached user data
- ✅ Maintains same API as before refactoring

## Error Handling

### Error Types
```typescript
type UserSessionError = {
  code: 'UNAUTHENTICATED' | 'NETWORK' | 'NOT_FOUND' | 'UNKNOWN';
  message: string;
  cause?: unknown;
}
```

### Error Scenarios

#### UNAUTHENTICATED
**When:** User's session expires or Clerk token unavailable
**Action:** Clear cache, show sign-in prompt
```typescript
if (error?.code === 'UNAUTHENTICATED') {
  return <SignInPrompt />;
}
```

#### NETWORK
**When:** API server unreachable
**Action:** Show error, allow retry
```typescript
if (error?.code === 'NETWORK') {
  return (
    <div>
      <p>Network error. {' '}
      <button onClick={() => refetch()}>Retry</button>
    </div>
  );
}
```

#### NOT_FOUND
**When:** User not in database
**Action:** Trigger auto-registration or show error
```typescript
if (error?.code === 'NOT_FOUND') {
  return <ContactSupport />;
}
```

#### UNKNOWN
**When:** Unexpected error
**Action:** Log and show generic error
```typescript
if (error?.code === 'UNKNOWN') {
  console.error('Unexpected error:', error.cause);
  return <GenericError />;
}
```

## Performance Optimizations

### 1. Cache Strategy
- **On Load:** Try cache first to prevent flicker
- **After Load:** Fetch fresh data in background
- **On Navigation:** Return cached data immediately
- **On Error:** Keep last known state

### 2. Memoization
- `useAdminCheck`: Uses `useMemo` for computed permissions
- `useClubCheck`: Uses `useMemo` for club extraction
- `useUserClubs`: Uses `useMemo` for user club ID
- `useCallback`: Prevents function recreation in useUserClubs

### 3. Hydration Handling
- Prevents SSR/client mismatch
- Cache loads before any components render
- `isHydrated` flag ensures proper timing

### 4. Request Deduplication
- Single user fetch on app load
- All subsequent renders use context
- No duplicate API calls within same session

## Security Considerations

### Token Management
```typescript
// Token never exposed to localStorage
// Only used in-memory during fetch
const token = await getToken();  // Temporary variable
const userData = await apiClient.getCurrentUser(token);
// Token goes out of scope after use
```

### Session Storage Security
```typescript
// sessionStorage cleared on:
// 1. User sign-out
// 2. Tab/browser close
// 3. Authentication errors
// 4. Network errors (conservative approach)

// No sensitive tokens stored
// Only user metadata stored (id, name, email, permissions)
```

### Clerk Integration
```typescript
// getToken() handled by @clerk/nextjs
// - Manages token refresh automatically
// - Handles expiry
// - Validates session
// - Secure by default

// Private metadata server-side only
// - lhUserId stored on Clerk server
// - Not exposed to client
```

## Testing Scenarios

### Test 1: User Sign-In
```
1. User not signed in → useSessionUser returns { user: null, isSignedIn: false }
2. User signs in → Provider detects isSignedIn change
3. Provider fetches user data
4. Components re-render with user data
```

### Test 2: Page Reload
```
1. User on appointments page
2. Press F5 to reload
3. Provider loads from cache (no flicker)
4. Provider fetches fresh data in background
5. Components render immediately with cached data
6. Update with fresh data when available
```

### Test 3: Navigation
```
1. User on page A (has useAdminCheck)
2. Navigate to page B (also has useAdminCheck)
3. No API call made
4. New component immediately gets user data from context
```

### Test 4: Sign Out
```
1. User clicks sign out
2. Clerk signs out user
3. isSignedIn becomes false
4. Provider clears cache and user state
5. Components using useSessionUser get null user
6. App shows sign-in view
```

### Test 5: Network Error
```
1. Provider tries to fetch user
2. Network request fails
3. error is set with code='NETWORK'
4. isLoading becomes false
5. Component can show error UI with refetch button
6. User clicks refetch → Provider tries again
```

## Upgrading Guide

### If You Have Custom Hooks Using useAuth
Transform from:
```typescript
export function useCustomData() {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = await getToken();
    const result = await apiClient.getCustom(token);
    setData(result);
  }, [getToken]);

  return data;
}
```

To:
```typescript
export function useCustomData() {
  const { user } = useSessionUser();  // Get cached user
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user?.token) return;
    const result = await apiClient.getCustom(user.token);
    setData(result);
  }, [user?.token]);

  return data;
}
```

**Key Change:** User object already has the token, no need to call `getToken()` again!

## Future Enhancements

### 1. Stale Cache Handling
```typescript
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

if (Date.now() - cache.timestamp > CACHE_TTL) {
  // Refetch fresh data
  return null;
}
```

### 2. Logout Detection
```typescript
// Auto-clear cache when isSignedIn changes
useEffect(() => {
  if (!isSignedIn) {
    clearUserCache();
  }
}, [isSignedIn]);
```

### 3. User Update Notifications
```typescript
export function useSessionUser() {
  const context = useContext(UserSessionContext);

  // Add ability to trigger refetch globally
  useEffect(() => {
    const handleUserUpdate = () => {
      context.refetch();
    };

    window.addEventListener('user-profile-updated', handleUserUpdate);
    return () => window.removeEventListener('user-profile-updated', handleUserUpdate);
  }, [context]);

  return context;
}
```

### 4. Suspense Support
```typescript
// Wrap provider in Suspense for concurrent rendering
<Suspense fallback={<LoadingScreen />}>
  <UserSessionProvider>
    {children}
  </UserSessionProvider>
</Suspense>
```

## Debugging

### Enable Logging
Add this to UserSessionProvider for development:

```typescript
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[UserSession]', {
      isSignedIn,
      isLoading,
      user: user?.id,
      error: error?.code,
    });
  }
}, [isSignedIn, isLoading, user?.id, error?.code]);
```

### Check Cache Contents
In browser console:
```javascript
// View cached user
console.log(JSON.parse(sessionStorage.getItem('lh_user_cache')));

// Clear cache manually
sessionStorage.removeItem('lh_user_cache');
```

### Inspect Context
Using React DevTools:
- Look for `UserSessionContext` provider
- Expand to see current value
- Check user object structure
- Verify loading/error states
