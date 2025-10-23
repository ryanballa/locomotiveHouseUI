# Architecture Documentation

Understand how Locomotive House is designed and organized.

## Overview

This section documents the technical architecture and design decisions behind Locomotive House.

## Key Documents

1. **[System Overview](./overview.md)** - Tech stack, architecture diagram, core concepts
2. **[Club-Based Routing](./club-based-routing.md)** - Routing system and access control
3. **[App Structure](./app-structure.md)** - Directory organization and file structure
4. **[Custom Hooks](./hooks.md)** - Reusable React hooks documentation
5. **[Components](./components.md)** - Reusable component reference

## Quick Reference

### Core Architecture
- Next.js 15 (React 18+) frontend
- Cloudflare Workers backend API
- PostgreSQL database (Neon)
- Clerk authentication

### Key Concepts
- **Club-Based Organization**: All resources scoped to clubs
- **Guard Components**: Access control wrappers
- **Custom Hooks**: Shared business logic
- **RESTful API**: Standard HTTP endpoints

## For Different Roles

### Frontend Developers
Start with:
1. [App Structure](./app-structure.md) - Understand file organization
2. [Custom Hooks](./hooks.md) - Learn available hooks
3. [Components](./components.md) - Review component patterns
4. [Club-Based Routing](./club-based-routing.md) - Understand routing

### Backend Developers
Start with:
1. [System Overview](./overview.md) - Understand data flow
2. API reference in [../../docs/api/endpoints.md](../api/endpoints.md)
3. Database schema documentation
4. Cloudflare Workers setup

### DevOps/Infrastructure
Start with:
1. [System Overview](./overview.md) - Understand architecture
2. Deployment docs in [../deployment/](../deployment/)
3. Environment setup in [../deployment/environments.md](../deployment/environments.md)

### New Team Members
Read in order:
1. [System Overview](./overview.md)
2. [App Structure](./app-structure.md)
3. [Club-Based Routing](./club-based-routing.md)
4. [Custom Hooks](./hooks.md)
5. [Components](./components.md)

## Design Principles

### 1. Club-Based Organization
All resources belong to clubs. Users access features through their club context.

### 2. Type Safety
Everything is typed with TypeScript. Strict mode enforced.

### 3. Declarative Access Control
Guard components make access control explicit and reusable.

### 4. Custom Hooks for Logic
Common logic extracted into hooks for reuse and testing.

### 5. RESTful API
Standard HTTP methods and status codes for consistency.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18+, TypeScript |
| Styling | Tailwind CSS |
| Testing | Vitest, React Testing Library |
| Backend | Cloudflare Workers |
| Database | PostgreSQL (Neon) |
| Auth | Clerk.js |
| Version Control | Git/GitHub |
| CI/CD | GitHub Actions |

## Common Tasks

### Add a New Route
1. Check [Club-Based Routing](./club-based-routing.md)
2. Create page in [App Structure](./app-structure.md#routing-structure)
3. Follow patterns in [Components](./components.md)

### Create a New Component
1. Reference [App Structure](./app-structure.md#component-placement-rules)
2. Review [Components](./components.md) patterns
3. Check [Custom Hooks](./hooks.md) for shared logic

### Add Authentication
1. Review [Club-Based Routing](./club-based-routing.md#custom-hooks)
2. Use `useClubCheck()` or `useAdminCheck()` hooks
3. Wrap with [ClubGuard](./components.md#clubguard) or [AdminGuard](./components.md#adminguard)

### Fetch Data
1. Check [Custom Hooks](./hooks.md) for existing patterns
2. Add endpoint to `lib/api.ts`
3. Create custom hook or use in component

## Architecture Diagrams

### Data Flow
```
User Action
  → React Component
  → API Client (lib/api.ts)
  → HTTP Request + JWT
  → Backend API
  → Database Query
  → Response
  → Component State Update
  → UI Re-render
```

### Access Control
```
User Visits Page
  → ClubGuard checks hasClub
  → useClubCheck fetches club assignment
  → Verifies club access
  → Renders content or error
```

## Related Documentation

- **[High-Level Architecture](../../ARCHITECTURE.md)** - System overview
- **[Features](../features/)** - How features are implemented
- **[Development](../development/)** - How to develop
- **[Deployment](../deployment/)** - How to deploy

## Performance Considerations

### Frontend
- Code splitting by Next.js
- Component memoization
- Lazy loading
- Image optimization

### Backend
- Query optimization with indexes
- Connection pooling
- Pagination for large datasets
- Caching with KV

### Database
- Indexed columns
- Connection pooling via Neon
- Query optimization

## Security

### Authentication
- JWT from Clerk
- Verified on every request
- Automatic refresh

### Authorization
- Club membership checked
- Admin role enforced
- User access scoped

### Data Protection
- HTTPS only
- CORS configured
- Input validation
- SQL injection prevention

## Further Learning

- **[Contributing Guide](../../CONTRIBUTING.md)** - How to contribute
- **[Development Setup](../development/setup-dev-env.md)** - IDE configuration
- **[Adding Features](../guides/adding-features.md)** - Feature development
