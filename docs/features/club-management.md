# Club Management

Understand how clubs work and how to manage them.

## What is a Club?

A club is the primary organizational unit in Locomotive House. All resources (appointments, addresses, users) belong to a club.

- Each user is assigned to a club
- All appointments are scoped to a club
- All addresses belong to a club
- Admin users can manage clubs and users

## Club Basics

### Club Data Model

```typescript
interface Club {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
```

### Club Assignment

When a user signs up:
1. User is created in Clerk
2. User is registered in the database
3. User is assigned to a club (admin must do this)
4. User can now access club-specific features

### Current Club

Get the current user's club:

```typescript
import { useClubCheck } from '@/hooks/useClubCheck';

function MyComponent() {
  const { clubId } = useClubCheck();

  // clubId is the current user's assigned club
}
```

## Club URLs

All club-dependent URLs use the club ID in the path:

```
/club/[id]/appointments         → View club appointments
/club/[id]/appointments/create  → Create appointment
/club/[id]/addresses            → Manage addresses
```

The `[id]` is replaced with the actual club ID, e.g., `/club/1/appointments`.

## Admin Features

### View All Clubs

Admin-only page: `/admin/clubs`

Features:
- List all clubs
- Create new clubs
- Edit club details
- Delete clubs
- View users in club

### Manage Club Members

Admin-only page: `/admin/clubs/[id]`

Features:
- View all users assigned to club
- Add users to club
- Remove users from club
- Change user roles

### Assign Users to Clubs

In the admin panel, click on a club to view its members. You can then:

1. Click "Add User"
2. Search for user by email
3. Select user
4. Click "Confirm"

The user is now assigned to the club and can access club features.

## Creating a Club (Admin Only)

### Via Admin Panel

1. Navigate to `/admin/clubs`
2. Click "Create Club"
3. Enter club name and description
4. Click "Create"

### Via API

```bash
curl -X POST http://localhost:8080/api/clubs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Gym",
    "description": "Main gym location"
  }'
```

## Club-Scoped Features

All of these features are club-scoped:

### Appointments

Users in a club can:
- View club appointments
- Create new appointments
- Edit own appointments
- Delete own appointments

See [Appointments](./appointments.md) for details.

### Addresses

Users in a club can:
- View all addresses in club
- Create new addresses
- Edit addresses
- Delete addresses
- Assign addresses to users

See [Addresses](./addresses.md) for details.

## Multi-Club Support

The architecture supports users belonging to multiple clubs, but currently each user is assigned to a single club.

Future enhancement: Allow users to switch between clubs in the navbar.

```typescript
// Potential future code
const { clubs, currentClubId } = useClubCheck();

// Let user switch clubs
<select onChange={(e) => switchClub(parseInt(e.target.value))}>
  {clubs.map(club => (
    <option key={club.id} value={club.id}>{club.name}</option>
  ))}
</select>
```

## Best Practices

### 1. Always Use Club ID in URLs

```typescript
// ✓ Good
router.push(`/club/${clubId}/appointments`);

// ✗ Avoid
router.push('/appointments');  // No club context!
```

### 2. Wrap Pages with ClubGuard

```typescript
// ✓ Good
export default function AppointmentsPage() {
  return (
    <ClubGuard>
      <AppointmentsContent />
    </ClubGuard>
  );
}

// ✗ Avoid
export default function AppointmentsPage() {
  return <AppointmentsContent />;  // No access control!
}
```

### 3. Verify Club Access

Always verify the user has access to the club they're trying to access:

```typescript
function AppointmentsContent() {
  const params = useParams();
  const clubId = Number(params.id);
  const { clubId: userClubId } = useClubCheck();

  // ✓ Good: Verify access
  if (userClubId && userClubId !== clubId) {
    return <div>You do not have access to this club</div>;
  }
}
```

## Navigation

### For Regular Users

Regular users see:
- Appointments link (dropdown menu with View and Create options)
- Addresses link
- Sign out option

All links automatically include the club ID.

### For Admin Users

Admin users additionally see:
- Admin dropdown with:
  - Manage Clubs
  - Manage Users
  - Dashboard

## Related Documentation

- [Club-Based Routing](../architecture/club-based-routing.md) - Technical routing details
- [Appointments](./appointments.md) - Appointment management
- [Addresses](./addresses.md) - Address management
- [Authentication](./authentication.md) - User authentication
