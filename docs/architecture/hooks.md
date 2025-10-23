# Custom Hooks Reference

Complete reference for custom hooks used throughout the application.

## useClubCheck()

Checks if the user has a club assignment and gets their club ID.

### Usage

```typescript
import { useClubCheck } from '@/hooks/useClubCheck';

function MyComponent() {
  const { clubId, loading, hasClub } = useClubCheck();

  if (loading) return <div>Loading...</div>;
  if (!hasClub) return <div>No club assigned</div>;

  return <div>Club ID: {clubId}</div>;
}
```

### Returns

```typescript
{
  clubId: number | null;      // User's assigned club ID
  loading: boolean;           // Loading state of the check
  hasClub: boolean;          // Whether user has a club assignment
}
```

### Behavior

- Fetches current user data from the API
- Extracts club ID from user's data
- Uses Clerk authentication token from `useAuth()`
- Includes abort pattern to prevent state updates after unmount
- Caches result to prevent excessive API calls

### When to Use

- Protecting routes that require club assignment
- Navigating to club-specific URLs
- Displaying club-specific content
- Conditional rendering based on club membership

### Example: Protected Navigation

```typescript
function Navbar() {
  const { clubId, loading } = useClubCheck();
  const router = useRouter();

  const handleNavigate = () => {
    if (clubId) {
      router.push(`/club/${clubId}/appointments`);
    }
  };

  return (
    <button onClick={handleNavigate} disabled={loading}>
      {loading ? 'Loading...' : 'Go to Appointments'}
    </button>
  );
}
```

---

## useAdminCheck()

Checks if the user has admin permissions.

### Usage

```typescript
import { useAdminCheck } from '@/hooks/useAdminCheck';

function AdminComponent() {
  const { isAdmin, loading, error, currentUser } = useAdminCheck();

  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return <div>Admin access required</div>;

  return <div>Admin panel for {currentUser?.email}</div>;
}
```

### Returns

```typescript
{
  isAdmin: boolean;                  // Whether user is an admin
  loading: boolean;                  // Loading state of the check
  error: AdminCheckError | null;     // Error details if any
  currentUser: MinimalUser | null;   // Authenticated user info
}
```

### Error Object

```typescript
type AdminCheckError = {
  code: 'NOT_SIGNED_IN' | 'NO_TOKEN' | 'FETCH_FAILED' | 'PARSE_FAILED';
  message: string;
}
```

### Behavior

- Checks if user is signed in with Clerk
- Fetches current user data from API
- Checks `is_admin` flag in user data
- Returns early if user not signed in (with loading = false)
- Returns early if no token available (with loading = false)
- Includes abort pattern for cleanup
- Logs errors to console in development

### When to Use

- Protecting admin-only routes
- Displaying admin-only UI elements
- Hiding admin features from regular users
- Checking permissions before sensitive operations

### Example: Admin Dropdown

```typescript
function Navbar() {
  const { isAdmin, loading } = useAdminCheck();

  return (
    <>
      {!loading && isAdmin && (
        <div className="dropdown">
          <Link href="/admin/clubs">Manage Clubs</Link>
          <Link href="/admin/users">Manage Users</Link>
        </div>
      )}
    </>
  );
}
```

---

## useAuth()

Accesses Clerk authentication state.

### Usage

```typescript
import { useAuth } from '@clerk/nextjs';

function MyComponent() {
  const { userId, isSignedIn, getToken } = useAuth();

  const token = await getToken();

  return <div>User: {userId}</div>;
}
```

### Returns

```typescript
{
  userId: string | null;              // Clerk user ID
  isSignedIn: boolean;                // Whether user is authenticated
  sessionId: string | null;           // Session ID
  getToken: () => Promise<string>;    // Get JWT token
  signOut: () => Promise<void>;       // Sign out user
  // ... other Clerk methods
}
```

### Behavior

- Provided by `@clerk/nextjs` package
- Returns Clerk-managed authentication state
- Token is valid for short period (typically 1 hour)
- Automatically refreshed by Clerk
- Available in client components

### When to Use

- Getting the current user ID
- Checking if user is signed in
- Getting JWT token for API calls
- Signing out programmatically

### Example: API Request with Token

```typescript
import { useAuth } from '@clerk/nextjs';

async function fetchAppointments() {
  const { getToken } = useAuth();
  const token = await getToken();

  const response = await fetch('/api/appointments', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}
```

---

## Hook Implementation Patterns

### Pattern 1: Loading State Handling

```typescript
function useMyHook() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function fetchData() {
      try {
        const result = await api.getData();
        if (isActive) {
          setData(result);
        }
      } catch (err) {
        if (isActive) {
          setError(err);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isActive = false;
    };
  }, []);

  return { data, loading, error };
}
```

### Pattern 2: Early Return with Loading State

```typescript
function useMyHook() {
  const { isSignedIn } = useAuth();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Early return if condition not met
    if (!isSignedIn) {
      setState(null);
      setLoading(false);  // ← Important: set loading to false!
      return;
    }

    // Continue with API call
    let isActive = true;

    async function fetch() {
      try {
        const data = await api.getAuthData();
        if (isActive) setState(data);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    fetch();

    return () => {
      isActive = false;
    };
  }, [isSignedIn]);

  return { state, loading };
}
```

### Pattern 3: Dependency Handling

```typescript
function useClubData(clubId: number) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) {
      setData(null);
      setLoading(false);
      return;
    }

    let isActive = true;

    async function fetch() {
      try {
        const result = await api.getClubData(clubId);
        if (isActive) setData(result);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    fetch();

    return () => {
      isActive = false;
    };
  }, [clubId]); // Re-fetch when clubId changes

  return { data, loading };
}
```

---

## Creating a Custom Hook

### Step 1: Identify the Need

Create a hook when you have:
- Logic shared across multiple components
- Complex state management
- Side effects that need cleanup
- Authentication/authorization checks

### Step 2: Create the Hook File

File: `hooks/useMyCustom.ts`

```typescript
import { useState, useEffect } from 'react';

export function useMyCustom() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function initialize() {
      try {
        // Your logic here
        setLoading(false);
      } catch (err) {
        if (isActive) {
          setError(err);
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      isActive = false;
    };
  }, []);

  return { state, loading, error };
}
```

### Step 3: Create Tests

File: `hooks/__tests__/useMyCustom.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyCustom } from '../useMyCustom';

describe('useMyCustom', () => {
  it('returns initial loading state', () => {
    const { result } = renderHook(() => useMyCustom());

    expect(result.current.loading).toBe(true);
  });

  it('loads data', async () => {
    const { result } = renderHook(() => useMyCustom());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.state).toBeDefined();
  });
});
```

### Step 4: Use in Component

```typescript
import { useMyCustom } from '@/hooks/useMyCustom';

export default function MyComponent() {
  const { state, loading, error } = useMyCustom();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Use state */}</div>;
}
```

---

## Best Practices

### 1. Always Handle Loading State

```typescript
// ✓ Good
const { data, loading } = useMyHook();
if (loading) return <Spinner />;

// ✗ Avoid
const { data } = useMyHook();
// Ignoring loading state
```

### 2. Always Set Loading to False in Early Returns

```typescript
// ✓ Good
if (!condition) {
  setLoading(false);
  return;
}

// ✗ Avoid
if (!condition) {
  return;  // Loading never becomes false!
}
```

### 3. Use Abort Pattern for Cleanup

```typescript
// ✓ Good
useEffect(() => {
  let isActive = true;

  async function fetch() {
    const data = await api.getData();
    if (isActive) setState(data);  // Only update if mounted
  }

  fetch();

  return () => {
    isActive = false;
  };
}, []);

// ✗ Avoid
useEffect(() => {
  api.getData().then(data => setState(data)); // May update after unmount!
}, []);
```

### 4. Specify Dependencies

```typescript
// ✓ Good
useEffect(() => {
  // fetch data
}, [clubId]);  // Re-fetch when clubId changes

// ✗ Avoid
useEffect(() => {
  // fetch data
});  // Runs on every render!
```

### 5. Type Your Hooks

```typescript
// ✓ Good
function useMyHook(): { data: User | null; loading: boolean } {
  // ...
}

// ✗ Avoid
function useMyHook() {
  // No return type!
}
```

---

## Hook Composition

Hooks can use other hooks:

```typescript
import { useAuth } from '@clerk/nextjs';

function useClubAppointments(clubId: number) {
  const { getToken } = useAuth();  // Use another hook
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function fetch() {
      const token = await getToken();
      const data = await api.getAppointments(clubId, token);
      if (isActive) setAppointments(data);
      if (isActive) setLoading(false);
    }

    if (clubId) fetch();

    return () => {
      isActive = false;
    };
  }, [clubId, getToken]);

  return { appointments, loading };
}
```

---

## Related Documentation

- [Club-Based Routing](./club-based-routing.md) - How hooks are used in routing
- [Components](./components.md) - Guard components that use hooks
- [Testing Guide](../development/testing.md) - Testing hooks
