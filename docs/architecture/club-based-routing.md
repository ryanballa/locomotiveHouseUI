# Club-Based Routing Architecture

Understand how the application uses clubs to organize and protect resources.

## Overview

The Locomotive House application uses clubs as the primary organizational unit. All user-facing features are nested under a club context.

## Routing Structure

```
/                           → Home (redirects to /club/:id/appointments)
├── /club/[id]/
│   ├── /appointments       → View club appointments
│   │   └── /create         → Create new appointment
│   └── /addresses          → Manage club addresses
├── /appointments/
│   └── /edit/[id]          → Edit appointment (legacy)
├── /addresses              → Addresses (legacy/admin)
├── /admin/
│   ├── /clubs              → Admin: club list
│   └── /clubs/[id]         → Admin: club details
└── /sign-in, /sign-up      → Clerk authentication pages
```

## Club-Based Access Control

### How It Works

1. **User Signs In** → Clerk authenticates user
2. **User Assigned to Club** → Backend determines which club(s) user belongs to
3. **useClubCheck Hook** → Frontend fetches user's club assignment
4. **ClubGuard Wrapper** → Checks user has club assignment before rendering page
5. **Club ID in Route** → Page verifies user has access to the specific club

### Code Example

```typescript
// In app/club/[id]/appointments/page.tsx
function ClubAppointmentsContent() {
  const params = useParams();
  const clubId = Number(params.id);
  const { clubId: userClubId } = useClubCheck();

  // Verify user has access to this club
  useEffect(() => {
    if (userClubId && userClubId !== clubId) {
      setError("You do not have access to this club");
    }
  }, [clubId, userClubId]);

  // ... rest of component
}

export default function ClubAppointmentsPage() {
  return (
    <ClubGuard>
      <ClubAppointmentsContent />
    </ClubGuard>
  );
}
```

## Custom Hooks

### useClubCheck()

Checks if the user has a club assignment.

```typescript
import { useClubCheck } from '@/hooks/useClubCheck';

function MyComponent() {
  const { clubId, loading, hasClub } = useClubCheck();

  if (loading) return <div>Loading...</div>;
  if (!hasClub) return <div>No club assigned</div>;

  return <div>Club ID: {clubId}</div>;
}
```

**Returns**:
- `clubId: number | null` - The user's assigned club ID
- `loading: boolean` - Whether check is in progress
- `hasClub: boolean` - Whether user has a club assignment

### useAdminCheck()

Checks if the user has admin permissions.

```typescript
import { useAdminCheck } from '@/hooks/useAdminCheck';

function AdminComponent() {
  const { isAdmin, loading, error } = useAdminCheck();

  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return <div>Admin access required</div>;

  return <div>Admin panel</div>;
}
```

**Returns**:
- `isAdmin: boolean` - Whether user is an admin
- `loading: boolean` - Whether check is in progress
- `error: AdminCheckError | null` - Error details if any

## Guard Components

### ClubGuard

Wraps pages that require club assignment.

```typescript
export default function MyClubPage() {
  return (
    <ClubGuard>
      <MyPageContent />
    </ClubGuard>
  );
}
```

**Behavior**:
- Shows loading spinner while checking club assignment
- Shows message if user isn't assigned to a club
- Renders children if user has club assignment

### AdminGuard

Wraps pages that require admin permissions.

```typescript
export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  );
}
```

**Behavior**:
- Shows loading spinner while checking permissions
- Shows message if user isn't an admin
- Renders children if user is an admin

## Navigation with Club Context

The navbar uses the club ID for navigation:

```typescript
function Navbar() {
  const { clubId, loading } = useClubCheck();

  return (
    <nav>
      {/* Appointments dropdown with club-specific links */}
      {clubId && (
        <>
          <Link href={`/club/${clubId}/appointments`}>
            View Appointments
          </Link>
          <Link href={`/club/${clubId}/appointments/create`}>
            Create Appointment
          </Link>
        </>
      )}

      {/* Addresses with club-specific link */}
      {clubId && (
        <Link href={`/club/${clubId}/addresses`}>
          Addresses
        </Link>
      )}
    </nav>
  );
}
```

## Home Page Redirect

The home page (`/`) serves as an entry point:

```typescript
// app/page.tsx
export default function Home() {
  const { clubId, loading } = useClubCheck();
  const router = useRouter();

  useEffect(() => {
    if (!loading && clubId) {
      // Redirect to club appointments
      router.push(`/club/${clubId}/appointments`);
    }
  }, [clubId, loading, router]);

  // Show loading while checking club
  return <LoadingSpinner />;
}
```

## Flow Diagram

```
User Visits / (Home)
    ↓
Check Club Assignment (useClubCheck)
    ↓
Club Found?
    ├─ Yes → Redirect to /club/:id/appointments
    └─ No  → Show "Club Assignment Required" message

User Visits /club/[id]/appointments
    ↓
ClubGuard checks hasClub
    ├─ Loading → Show spinner
    ├─ No club → Show error message
    └─ Has club → Render ClubAppointmentsContent
        ↓
    Verify user has access to :id
        ├─ Access denied → Show error
        └─ Access granted → Show appointments
```

## Best Practices

### 1. Always Use ClubGuard
Protect all club-dependent pages:

```typescript
// ✓ Good
export default function ClubPage() {
  return <ClubGuard><Content /></ClubGuard>;
}

// ✗ Avoid
export default function ClubPage() {
  return <Content />; // No guard!
}
```

### 2. Verify Club Access
Double-check club access inside components:

```typescript
// ✓ Good
const { clubId: userClubId } = useClubCheck();

useEffect(() => {
  if (userClubId && userClubId !== clubId) {
    setError("Access denied");
  }
}, [clubId, userClubId]);

// ✗ Avoid
// Relying only on ClubGuard without route verification
```

### 3. Use Club ID for Navigation
Always include club ID in navigation links:

```typescript
// ✓ Good
router.push(`/club/${clubId}/appointments`);

// ✗ Avoid
router.push(`/appointments`); // No club context
```

### 4. Handle Loading States
Always handle loading state in navigation:

```typescript
// ✓ Good
if (clubLoading) return <LoadingSpinner />;
if (!clubId) return <NoClubMessage />;

// ✗ Avoid
// Ignoring loading state
```

## Multi-Club Support

The architecture supports users in multiple clubs:

```typescript
// Potential future feature: switch between clubs
const { clubs, currentClubId } = useClubCheck();

return (
  <select onChange={(e) => switchClub(e.target.value)}>
    {clubs.map(club => (
      <option value={club.id}>{club.name}</option>
    ))}
  </select>
);
```

Currently, users are assigned to a single club, but the architecture supports expansion.

## Adding a New Club-Scoped Feature

1. **Create the page** in `app/club/[id]/feature/page.tsx`
2. **Wrap with ClubGuard**: Ensures user has club assignment
3. **Use useClubCheck**: Get and verify club ID
4. **Verify access**: Check user has access to the specific club
5. **Update navigation**: Add link in navbar with club ID
6. **Update tests**: Test both guard behavior and access control

Example:

```typescript
// app/club/[id]/reports/page.tsx
import { ClubGuard } from '@/components/ClubGuard';
import { useClubCheck } from '@/hooks/useClubCheck';

function ReportsContent() {
  const params = useParams();
  const clubId = Number(params.id);
  const { clubId: userClubId } = useClubCheck();

  if (userClubId && userClubId !== clubId) {
    return <div>Access denied</div>;
  }

  return <div>Reports for club {clubId}</div>;
}

export default function ReportsPage() {
  return (
    <ClubGuard>
      <ReportsContent />
    </ClubGuard>
  );
}
```

## Related Documentation

- [useClubCheck Hook](./hooks.md#useClubCheck)
- [useAdminCheck Hook](./hooks.md#useAdminCheck)
- [ClubGuard Component](./components.md#ClubGuard)
- [AdminGuard Component](./components.md#AdminGuard)
- [Authentication Flow](../features/authentication.md)
