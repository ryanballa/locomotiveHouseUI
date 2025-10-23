# Authentication

Understand how user authentication works in Locomotive House.

## Authentication Provider: Clerk

Locomotive House uses [Clerk.js](https://clerk.com) for user authentication.

### Why Clerk?

- Secure, managed authentication service
- No need to store passwords
- Built-in OAuth/social login support
- JWT token generation
- User management dashboard
- Email verification
- Multi-factor authentication ready

## Authentication Flow

### 1. User Signs Up

```
User visits /sign-up
  ↓
Clerk Sign-up Form
  ↓
User creates account with email/password
  ↓
Email verification (if required)
  ↓
Account created in Clerk
```

### 2. Clerk Registration

When a user signs up in Clerk:
- A JWT token is generated
- User is automatically registered in our database
- User data is synced

### 3. User Signs In

```
User visits /sign-in
  ↓
Clerk Sign-in Form
  ↓
User enters email/password
  ↓
Clerk validates credentials
  ↓
JWT token issued
  ↓
User logged in
```

### 4. API Authentication

All API requests include the JWT token:

```
User Action
  ↓
Browser fetches JWT from Clerk
  ↓
Request made to API with token:
Authorization: Bearer <JWT_TOKEN>
  ↓
API validates token with Clerk
  ↓
Request processed
```

### 5. Club Assignment

```
User signs in
  ↓
Admin assigns user to club (via admin panel)
  ↓
User's club_id stored in database
  ↓
User can now access club features
```

## Sign In Page

### Location

`/sign-in`

### Accessing

1. Click "Sign In" button in navbar
2. Clerk's hosted sign-in UI appears
3. Enter credentials
4. After successful sign-in, redirected to home (`/`)

### Features Provided by Clerk

- Email/password authentication
- Social login (Google, GitHub, etc. if configured)
- Password reset
- Email verification
- Account recovery

## Sign Up Page

### Location

`/sign-up`

### Accessing

1. Click "Sign In" button in navbar
2. On the sign-in form, click "Create account"
3. Enter email and password
4. Verify email (if required)
5. Account is created and you're logged in

### New User Flow

After sign-up:
1. User is created in Clerk
2. User is registered in our database
3. Redirected to home page (`/`)
4. User sees "Club Assignment Required" message
5. Admin must assign user to club

## Getting Authentication Token

### In Components

Use the `useAuth()` hook from `@clerk/nextjs`:

```typescript
import { useAuth } from '@clerk/nextjs';

function MyComponent() {
  const { getToken, isSignedIn, userId } = useAuth();

  if (!isSignedIn) return <div>Please sign in</div>;

  const handleClick = async () => {
    const token = await getToken();
    // Use token in API calls
  };

  return <button onClick={handleClick}>Make API Call</button>;
}
```

### In API Calls

```typescript
import { useAuth } from '@clerk/nextjs';

async function fetchData() {
  const { getToken } = useAuth();
  const token = await getToken();

  const response = await fetch('/api/data', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}
```

### Token Structure

JWT tokens include:
- User ID
- Email
- Metadata
- Expiration time (typically 1 hour)
- Issue time

Tokens are automatically refreshed by Clerk.

## Backend Token Validation

The API (Cloudflare Worker):

1. Receives JWT in Authorization header
2. Validates token with Clerk
3. Extracts user ID
4. Looks up user in database
5. Processes request with user context

## User Data

### What's Stored in Clerk

- Email address
- Password hash (Clerk managed)
- Profile picture
- Name
- Phone number (optional)
- Custom metadata (if configured)

### What's Stored in Our Database

- User ID (from Clerk)
- Email (from Clerk)
- Club assignment
- Admin status
- Created/updated timestamps

### Syncing User Data

User data is synced between Clerk and our database when:
- User signs up (registration)
- User updates profile (webhooks)
- User's club assignment changes (admin action)

## Authentication Hooks

### useAuth() - From Clerk

```typescript
import { useAuth } from '@clerk/nextjs';

const { isSignedIn, userId, getToken } = useAuth();
```

### useClubCheck() - Custom Hook

```typescript
import { useClubCheck } from '@/hooks/useClubCheck';

const { clubId, loading, hasClub } = useClubCheck();
```

Checks user's club assignment from our database.

### useAdminCheck() - Custom Hook

```typescript
import { useAdminCheck } from '@/hooks/useAdminCheck';

const { isAdmin, loading } = useAdminCheck();
```

Checks if user has admin permissions.

## Sign Out

### Via UI

1. Click user menu in navbar
2. Click "Sign Out"
3. User is logged out and redirected

### Programmatically

```typescript
import { useClerk } from '@clerk/nextjs';

function MyComponent() {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut();
    // User is signed out
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

## Access Control

### Public Pages

- `/sign-in` - Sign in form
- `/sign-up` - Sign up form
- `/` - Home page (redirects to club appointments)

### Protected Pages

All pages except auth pages require:
- User to be signed in (checked by Clerk)
- User to have a club assignment (checked by ClubGuard)

### Admin Pages

Admin pages require:
- User to be signed in
- User to be admin (checked by AdminGuard)

Example: `/admin/clubs`

## Session Management

### Session Duration

- JWT tokens issued by Clerk
- Default duration: 1 hour
- Automatically refreshed by Clerk

### Session Checking

```typescript
import { useAuth } from '@clerk/nextjs';

function MyComponent() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome back!</div>;
}
```

## Environment Variables

### Required for Authentication

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

See [Environment Setup](../getting-started/environment.md) for details.

## Best Practices

### 1. Always Check Authentication

```typescript
// ✓ Good
const { isSignedIn } = useAuth();
if (!isSignedIn) return <div>Please sign in</div>;

// ✗ Avoid
// Assume user is signed in
```

### 2. Use Guard Components

```typescript
// ✓ Good: Guard prevents unauthorized access
export default function ClubPage() {
  return <ClubGuard><Content /></ClubGuard>;
}

// ✗ Avoid: No guard
export default function ClubPage() {
  return <Content />;
}
```

### 3. Include Token in API Requests

```typescript
// ✓ Good
const token = await getToken();
const response = await fetch('/api/data', {
  headers: { Authorization: `Bearer ${token}` }
});

// ✗ Avoid
const response = await fetch('/api/data');
// No authentication!
```

### 4. Handle Token Expiration

```typescript
// ✓ Good: getToken() handles refresh automatically
const token = await getToken();  // Auto-refreshed if expired

// ✗ Avoid
const token = localStorage.getItem('token');  // May be expired
```

### 5. Clear User State on Sign Out

```typescript
// ✓ Good: State cleared after sign out
const handleSignOut = async () => {
  await signOut();
  // User state automatically cleared by Clerk
};
```

## Troubleshooting

### Sign-in page doesn't appear

**Problem**: Clerk button not showing or page blank

**Solution**:
1. Check `.env.local` has Clerk keys
2. Verify keys are correct (should start with `pk_test_`)
3. Restart dev server: `npm run dev`

### "Invalid API key" error

**Problem**: Clerk authentication failing

**Solution**:
1. Copy keys again from Clerk dashboard
2. Check for extra spaces in `.env.local`
3. Verify you're using PUBLIC key for frontend, SECRET key for backend

### Token not included in requests

**Problem**: API returning 401 Unauthorized

**Solution**:
1. Check `useAuth()` is being used to get token
2. Verify token is included in Authorization header
3. Check API URL is correct in `.env.local`

### Can't access club features after sign-up

**Problem**: "Club Assignment Required" message

**Solution**:
1. Admin needs to assign you to a club
2. Contact your administrator
3. Or check admin panel `/admin/clubs` to self-assign (if admin)

## Related Documentation

- [Club Management](./club-management.md) - Club assignment after authentication
- [Club-Based Routing](../architecture/club-based-routing.md) - Access control with routes
- [Environment Setup](../getting-started/environment.md) - Clerk configuration
