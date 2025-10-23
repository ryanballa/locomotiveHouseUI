# Locomotive House Architecture

High-level system architecture for the Locomotive House platform.

## Overview

Locomotive House is a cloud-based appointment and address management system built with:
- **Frontend**: Next.js 15 (React 18+) with TypeScript
- **Backend**: Cloudflare Workers
- **Database**: PostgreSQL (Neon)
- **Auth**: Clerk.js

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                     (Next.js, React 18+)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pages: Appointments, Addresses, Admin, Auth          │   │
│  │ Components: Reusable UI components                   │   │
│  │ Hooks: useClubCheck, useAdminCheck, useAuth         │   │
│  │ State: React hooks + context                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                  HTTP JSON + JWT Token
                           │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (API)                             │
│            (Cloudflare Workers, TypeScript)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes: REST API endpoints                           │   │
│  │ Middleware: Auth, CORS, Logging                      │   │
│  │ Controllers: Business logic                          │   │
│  │ Services: Utilities and helpers                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                    PostgreSQL queries
                           │
┌─────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                       │
│                   (Neon.tech)                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Users, Clubs, Appointments, Addresses tables         │   │
│  │ Relationships: Users→Clubs, Appts→Clubs, etc        │   │
│  │ Indexes: For performance optimization                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

External Services:
- Clerk.js: User authentication and JWT
- Cloudflare: CDN and Workers runtime
- Neon: PostgreSQL as a service
```

## Core Concepts

### Club-Based Architecture

All resources are organized around **clubs**:

```
Club (Organization Unit)
├── Users (assigned to club)
├── Appointments (scheduled in club)
└── Addresses (belong to club)
```

Users access features through their club context.

### Authentication Flow

```
1. User Signs In → Clerk
2. Clerk Issues JWT
3. Frontend Stores Token (Clerk manages)
4. Every API Request Includes Token
5. Backend Validates Token with Clerk
6. Request Processed with User Context
```

### Access Control

Two-tier access control:

1. **Club Membership**: User must belong to club
2. **Admin Permissions**: Some operations require admin role

### Data Model

```
Users
├── id (Clerk user ID)
├── email
├── club_id (assigned club)
└── is_admin (boolean)

Clubs
├── id
├── name
└── description

Appointments
├── id
├── club_id
├── title
├── start_time
└── duration_minutes

Addresses
├── id
├── club_id
├── address_number
├── description
└── assigned_user_id
```

## Technology Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| Next.js 15 | React framework with SSR |
| React 18+ | UI library |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Vitest | Unit testing |
| React Testing Library | Component testing |

### Backend

| Technology | Purpose |
|-----------|---------|
| Cloudflare Workers | Serverless runtime |
| TypeScript | Type safety |
| PostgreSQL | Database |
| Neon | PostgreSQL as service |
| Clerk | Authentication |

### Development

| Tool | Purpose |
|------|---------|
| npm | Package management |
| Git | Version control |
| GitHub | Code hosting |
| GitHub Actions | CI/CD |

## Directory Structure

```
app/                  # Next.js app directory
├── club/[id]/       # Club-scoped routes
├── admin/           # Admin routes
└── auth/            # Clerk auth pages

components/         # Reusable React components
├── guards/         # Access control components
├── layout/         # Layout components
├── common/         # Generic components
└── features/       # Feature-specific components

hooks/              # Custom React hooks
lib/                # Utilities and helpers
docs/               # Documentation
```

See [App Structure](docs/architecture/app-structure.md) for details.

## Request/Response Flow

### Typical User Action

```
User Clicks "Create Appointment"
        ↓
React Component State Updates
        ↓
Form Submitted → API Endpoint Called
        ↓
Frontend Calls: POST /api/clubs/1/appointments
with Authorization: Bearer <TOKEN>
        ↓
Backend Validates Token with Clerk
        ↓
Backend Checks User Club Assignment
        ↓
Backend Executes SQL: INSERT INTO appointments...
        ↓
Database Returns New Appointment
        ↓
Backend Returns JSON Response
        ↓
Frontend Updates Component State
        ↓
User Sees Success Message
```

## Key Design Decisions

### 1. Club-Based Scoping
**Why**: Supports multi-tenant architecture, clear access boundaries

### 2. Clerk for Authentication
**Why**: Reduces security complexity, built-in OAuth support

### 3. Guard Components for Access Control
**Why**: Declarative, reusable, prevents unauthorized access

### 4. Custom Hooks for Logic
**Why**: Code reuse, easier testing, consistent behavior

### 5. RESTful API Design
**Why**: Familiar, easy to test, standard error handling

## Security Architecture

### Authentication
- JWT tokens from Clerk
- Verified on every API request
- Token expiration enforced
- Automatic refresh by Clerk

### Authorization
- Club membership verified per request
- Admin role required for admin endpoints
- User can only access own club

### Data Protection
- HTTPS only (enforced by Cloudflare)
- CORS configured for trusted origins
- Input validation on backend
- SQL injection prevention

## Performance Considerations

### Frontend
- Next.js automatic code splitting
- Image optimization
- Lazy loading of components
- Memoization for expensive calculations

### Backend
- Database connection pooling
- Query optimization with indexes
- Pagination for large datasets
- Caching with Cloudflare KV

### Database
- Indexed on frequently queried columns
- Connection pooling via Neon
- Automated backups and replication

## Scalability

### Horizontal Scaling
- Cloudflare Workers auto-scale
- Neon handles database connections
- Frontend served globally via CDN

### Vertical Scaling
- Database can handle many users
- Workers have high concurrency limits
- No single points of failure

## Development Workflow

```
Feature Branch
  ↓
Local Development & Testing
  ↓
Push to GitHub
  ↓
CI/CD: Lint, Tests, Build
  ↓
Code Review
  ↓
Deploy to Staging
  ↓
Final Testing
  ↓
Merge to Main
  ↓
Deploy to Production
```

## Deployment Architecture

```
Development
└─ Local machine
   ├─ npm run dev (frontend)
   ├─ wrangler dev (backend)
   └─ Local database

Staging
└─ Cloud
   ├─ Frontend: Vercel or similar
   ├─ Backend: Cloudflare Workers
   └─ Database: Neon staging project

Production
└─ Cloud
   ├─ Frontend: CDN
   ├─ Backend: Cloudflare Workers
   └─ Database: Neon production project
```

## Monitoring & Observability

### Frontend Monitoring
- Browser errors via error tracking
- User actions/analytics
- Performance metrics

### Backend Monitoring
- API request logs via Cloudflare
- Database query performance
- Error rates and uptime

### Database Monitoring
- Query performance
- Connection usage
- Backup status

## Related Documentation

- [System Overview](docs/architecture/overview.md) - Detailed system overview
- [Club-Based Routing](docs/architecture/club-based-routing.md) - Routing and access control
- [App Structure](docs/architecture/app-structure.md) - Directory organization
- [Custom Hooks](docs/architecture/hooks.md) - Hook reference
- [Components](docs/architecture/components.md) - Component reference
- [Getting Started](docs/getting-started/installation.md) - Setup guide
