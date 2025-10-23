# Features

Complete documentation of Locomotive House features.

## User Features

### [Appointments](./appointments.md)
Schedule and manage appointments within your club.
- Create, view, edit, delete appointments
- Organize by date and time
- Assign to users
- **[Read Full Guide →](./appointments.md)**

### [Addresses](./addresses.md)
Manage service locations and assign them to users.
- Create and organize addresses
- Assign users to locations
- Track which locations are in use
- **[Read Full Guide →](./addresses.md)**

### [Club Management](./club-management.md)
Understand how clubs organize your team.
- Club-based resource organization
- User assignment to clubs
- Club-specific access
- **[Read Full Guide →](./club-management.md)**

## Authentication & Security

### [Authentication](./authentication.md)
How user authentication works in Locomotive House.
- Sign in and sign up flow
- Token management
- Session handling
- **[Read Full Guide →](./authentication.md)**

## Admin Features

### [Admin Features](./admin-features.md)
Administrative capabilities for system management.
- Create and manage clubs
- Manage users and assignments
- Admin access control
- **[Read Full Guide →](./admin-features.md)**

## Feature Overview

| Feature | For | Purpose |
|---------|-----|---------|
| Appointments | Everyone | Schedule and track appointments |
| Addresses | Everyone | Manage service locations |
| Club Management | Everyone | Organize team by clubs |
| Authentication | Everyone | Secure user access |
| Admin Panel | Admins | Manage system and users |

## Quick Start by Use Case

### I want to create an appointment
→ [Appointments Guide](./appointments.md) → Creating an Appointment

### I want to manage addresses
→ [Addresses Guide](./addresses.md) → Creating an Address

### I want to assign a user to a club
→ [Admin Features](./admin-features.md) → Assign User to Club

### I want to understand how authentication works
→ [Authentication Guide](./authentication.md) → Authentication Flow

### I want to become an admin
→ [Admin Features](./admin-features.md) → Becoming an Admin

## Core Concepts

### Clubs
Your organization is divided into clubs. Each user belongs to a club and can access club resources.

### Appointments
Scheduled events within your club. Each appointment has a time, duration, and optional details.

### Addresses
Physical or service locations. Addresses can be assigned to users for routing or responsibility.

### Users
People in the system. Each user has an email, optional club assignment, and optional admin status.

## Permissions

### Regular Users
- View appointments in their club
- Create appointments in their club
- Edit their own appointments
- View all addresses in their club
- Create and edit addresses in their club

### Admins
- View all clubs
- Create and delete clubs
- Manage all users
- Assign users to clubs
- View all appointments and addresses
- Edit or delete any appointment or address

## Related Documentation

- **[System Overview](../architecture/overview.md)** - How features fit together
- **[API Endpoints](../api/endpoints.md)** - API endpoints for features
- **[Guides](../guides/)** - How-to guides for common tasks
