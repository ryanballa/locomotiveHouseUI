# System Architecture Overview

Understand the high-level architecture and design of the Locomotive House application.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 18+)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk.js
- **State Management**: React Hooks (useState, useContext)
- **HTTP Client**: Fetch API with custom client (lib/api.ts)
- **Testing**: Vitest + React Testing Library

### Backend
- **Platform**: Cloudflare Workers
- **Language**: TypeScript/JavaScript
- **Database**: PostgreSQL (via Neon)
- **API Format**: RESTful JSON
- **Authentication**: JWT tokens from Clerk

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Locomotive House (Next.js Frontend)         │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │          React Components & Pages              │ │  │
│  │  │  - Appointments (view/create/edit)             │ │  │
│  │  │  - Addresses (manage)                          │ │  │
│  │  │  - Admin Dashboard (club management)           │ │  │
│  │  │  - Club-based routing                          │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                        ↓                             │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │    Clerk Authentication (Hosted UI)           │ │  │
│  │  │  - User sign-in/sign-up                        │ │  │
│  │  │  - JWT token generation                        │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                    │
│              HTTP Requests with JWT                        │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Workers (Backend API)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           API Router & Middleware                   │  │
│  │  - JWT validation                                   │  │
│  │  - CORS handling                                    │  │
│  │  - Request routing                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Business Logic & Controllers                │  │
│  │  - Appointments CRUD                                │  │
│  │  - Addresses CRUD                                   │  │
│  │  - User management                                  │  │
│  │  - Club management                                  │  │
│  │  - Authentication                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                        ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      PostgreSQL Database (Neon)                     │  │
│  │  - Users table                                      │  │
│  │  - Clubs table                                      │  │
│  │  - Appointments table                               │  │
│  │  - Addresses table                                  │  │
│  │  - User-Club relationships                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Concepts

### Club-Based Architecture
All resources are organized around clubs:
- **Users** belong to clubs
- **Appointments** are scheduled within clubs
- **Addresses** are assigned to users within specific clubs
- **Access Control** is based on club membership

See [Club-Based Routing](./club-based-routing.md) for details.

### Authentication Flow

1. **User Signs Up/In** → Clerk handles authentication
2. **Clerk Issues JWT** → JWT token is generated
3. **Frontend Sends JWT** → Included in all API requests
4. **Backend Validates JWT** → Verifies token and user
5. **Clerk Auto-Registration** → New users are automatically added to the database

### Data Flow

```
User Action → React Component → API Client (lib/api.ts)
    → HTTP Request with JWT → Cloudflare Worker
    → Database Query → Response → Component State Update
    → UI Renders
```

## Key Design Decisions

### 1. Club-Based Organization
**Decision**: All resources are scoped to clubs rather than being global
**Reason**:
- Supports multi-club deployments
- Clear access boundaries
- Scalable permission model

### 2. Clerk for Authentication
**Decision**: Use Clerk for user authentication instead of building custom auth
**Reason**:
- Reduces security complexity
- Built-in social login support
- User management dashboard
- JWT integration

### 3. Guard Components
**Decision**: Use wrapping components (AdminGuard, ClubGuard) for access control
**Reason**:
- Declarative permission model
- Reusable across pages
- Clear visual intent
- Prevents unauthorized pages from loading

### 4. Custom Hooks for Cross-Cutting Concerns
**Decision**: Extract authentication checks and data fetching into custom hooks
**Reason**:
- Code reuse
- Consistent behavior
- Centralized state management
- Easier testing

### 5. RESTful API Design
**Decision**: Use standard HTTP methods and status codes
**Reason**:
- Familiar to developers
- Easy to test
- Standard error handling
- Works with any frontend

## Component Hierarchy

```
App Layout
├── Navbar
│   ├── Links (Appointments, Addresses, etc.)
│   ├── Admin Dropdown (admins only)
│   └── Auth Buttons (SignIn/SignOut)
├── ClubGuard (protects club-dependent pages)
│   ├── /club/[id]/appointments
│   ├── /club/[id]/appointments/create
│   └── /club/[id]/addresses
├── AdminGuard (protects admin pages)
│   ├── /admin/clubs
│   └── /admin/clubs/[id]
└── Public Pages
    └── /
```

## State Management Strategy

### Local Component State
- Form inputs, UI toggles (useState)
- Component-specific data (dropdown open/closed)

### Custom Hooks
- `useAuth()` - Clerk authentication state
- `useClubCheck()` - Current user's club information
- `useAdminCheck()` - Admin permission validation

### API Client
- `lib/api.ts` - Centralized API communication
- Handles request formatting and response parsing

## Performance Considerations

### Frontend
- **Code Splitting**: Next.js automatically splits code by route
- **Image Optimization**: Next.js Image component for images
- **Memoization**: useMemo for expensive calculations
- **Server Components**: Use where possible to reduce JS sent to browser

### Backend
- **Database Indexing**: Indexed on frequently queried fields
- **Caching**: Clerk tokens cached in browser
- **Pagination**: Large data sets paginated
- **Connection Pooling**: Database connections pooled

## Security Architecture

### Authentication
- JWT tokens from Clerk verified on backend
- Tokens included in Authorization header
- Token expiration enforced

### Authorization
- Club membership verified on every request
- User permissions checked before operations
- Admin role required for sensitive operations

### Data Protection
- HTTPS only (enforced by Cloudflare)
- CORS configured to allow only trusted origins
- Input validation on backend
- SQL injection prevention via parameterized queries

## Scalability

### Horizontal Scaling
- Cloudflare Workers auto-scale
- Database connections handled by Neon
- Frontend served globally via CDN

### Vertical Scaling
- Database can handle many users
- Worker concurrency limits very high
- No single points of failure

## Next Steps

- [App Structure](./app-structure.md) - Directory organization
- [Club-Based Routing](./club-based-routing.md) - Routing and club scoping
- [Custom Hooks](./hooks.md) - Reusable hooks
- [Guard Components](./components.md) - Permission components
