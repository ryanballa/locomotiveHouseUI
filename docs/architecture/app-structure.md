# Application Structure

Understand how the Locomotive House codebase is organized.

## Directory Organization

```
locomotiveHouseV4UI/
├── app/                           # Next.js app router directory
│   ├── page.tsx                   # Home page (redirects to club appointments)
│   ├── layout.tsx                 # Root layout with providers
│   ├── sign-in/
│   │   └── [[...index]]/page.tsx  # Clerk sign-in page
│   ├── sign-up/
│   │   └── [[...index]]/page.tsx  # Clerk sign-up page
│   ├── club/
│   │   └── [id]/
│   │       ├── layout.tsx         # Club layout wrapper
│   │       ├── appointments/
│   │       │   ├── page.tsx       # View club appointments
│   │       │   ├── create/
│   │       │   │   └── page.tsx   # Create new appointment
│   │       │   └── [appointmentId]/
│   │       │       └── page.tsx   # Edit appointment
│   │       └── addresses/
│   │           └── page.tsx       # Manage club addresses
│   ├── admin/
│   │   ├── layout.tsx             # Admin layout with guard
│   │   ├── page.tsx               # Admin dashboard
│   │   ├── clubs/
│   │   │   ├── page.tsx           # Club list
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Club details/management
│   │   └── users/
│   │       ├── page.tsx           # User management
│   │       └── [id]/
│   │           └── page.tsx       # User details
│   └── (legacy)/                  # Deprecated routes (kept for backwards compatibility)
│       ├── appointments/
│       ├── addresses/
│       └── ...
├── components/                    # Reusable React components
│   ├── layout/
│   │   ├── Navbar.tsx             # Main navigation bar
│   │   ├── Footer.tsx             # Footer component
│   │   └── Sidebar.tsx            # Sidebar (if used)
│   ├── guards/
│   │   ├── ClubGuard.tsx          # Club membership protection
│   │   ├── AdminGuard.tsx         # Admin permission protection
│   │   └── AuthGuard.tsx          # General authentication protection
│   ├── appointments/
│   │   ├── AppointmentList.tsx    # Display appointments
│   │   ├── AppointmentCard.tsx    # Single appointment card
│   │   ├── AppointmentForm.tsx    # Create/edit form
│   │   └── AppointmentModal.tsx   # Modal wrapper
│   ├── addresses/
│   │   ├── AddressList.tsx        # Display addresses
│   │   ├── AddressCard.tsx        # Single address card
│   │   ├── AddressForm.tsx        # Create/edit form
│   │   └── AddressModal.tsx       # Modal wrapper
│   ├── clubs/
│   │   ├── ClubList.tsx           # Admin: club list
│   │   ├── ClubCard.tsx           # Single club card
│   │   ├── ClubForm.tsx           # Create/edit form
│   │   └── ClubSelector.tsx       # Club selection dropdown
│   ├── users/
│   │   ├── UserList.tsx           # Admin: user list
│   │   ├── UserCard.tsx           # Single user card
│   │   ├── UserForm.tsx           # User form
│   │   └── UserAssignment.tsx     # Assign users to clubs
│   ├── common/
│   │   ├── Button.tsx             # Reusable button
│   │   ├── Modal.tsx              # Reusable modal
│   │   ├── LoadingSpinner.tsx     # Loading indicator
│   │   ├── ErrorMessage.tsx       # Error display
│   │   ├── ConfirmDialog.tsx      # Confirmation dialog
│   │   └── Badge.tsx              # Status badge
│   └── __tests__/                 # Component tests (co-located)
│       └── *.test.tsx
├── hooks/                         # Custom React hooks
│   ├── useClubCheck.ts            # Get user's club assignment
│   ├── useAdminCheck.ts           # Check admin permissions
│   ├── useAuth.ts                 # Clerk authentication state
│   ├── useFetch.ts                # API data fetching hook
│   ├── useLocalStorage.ts         # LocalStorage management
│   ├── useDebounce.ts             # Debounce hook
│   ├── usePagination.ts           # Pagination logic
│   └── __tests__/
│       └── *.test.ts
├── lib/                           # Utility functions and helpers
│   ├── api.ts                     # Centralized API client
│   ├── auth.ts                    # Authentication utilities
│   ├── date-utils.ts              # Date formatting and manipulation
│   ├── time-utils.ts              # Time formatting and manipulation
│   ├── format.ts                  # Data formatting helpers
│   ├── validators.ts              # Input validation
│   ├── constants.ts               # App-wide constants
│   ├── types.ts                   # TypeScript type definitions
│   └── __tests__/
│       └── *.test.ts
├── styles/                        # Global styles
│   ├── globals.css                # Global Tailwind and custom CSS
│   ├── variables.css              # CSS custom properties
│   └── animations.css             # Reusable animations
├── public/                        # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
├── docs/                          # Documentation (this directory)
│   ├── README.md
│   ├── getting-started/
│   ├── architecture/
│   ├── features/
│   ├── development/
│   ├── deployment/
│   ├── troubleshooting/
│   ├── api/
│   └── guides/
├── .claude/                       # Claude Code configuration
│   ├── docs-map.md                # Documentation navigation for Claude Code
│   └── commands/                  # Custom slash commands
├── .github/
│   └── workflows/                 # GitHub Actions workflows
│       ├── ci.yml                 # Continuous Integration
│       ├── create-release-branch.yaml
│       └── ...
├── tests/                         # Integration tests
│   ├── e2e/                       # End-to-end tests
│   └── integration/               # Integration tests
├── .env.local.example             # Environment variables template
├── .eslintrc.json                 # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── tsconfig.json                  # TypeScript configuration
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── vitest.config.ts               # Vitest configuration
├── package.json                   # Dependencies and scripts
├── package-lock.json              # Locked dependencies
├── CONTRIBUTING.md                # Contributing guidelines
├── README.md                       # Project overview
├── LICENSE                        # Project license
└── .gitignore                     # Git ignore rules
```

## Key Directories Explained

### `/app` - Next.js App Router
The main application structure using Next.js 15 App Router:
- **Route segments** like `[id]` are dynamic parameters
- **layout.tsx** files create layout hierarchies
- **page.tsx** files are the actual routes
- Parallel routes and intercepting routes supported

### `/components` - Reusable Components
Organized by feature:
- **layout/** - Layout components (Navbar, Footer, etc.)
- **guards/** - Access control wrappers (ClubGuard, AdminGuard)
- **appointments/** - Appointment-related components
- **addresses/** - Address-related components
- **clubs/** - Club management components (admin)
- **users/** - User management components (admin)
- **common/** - Generic reusable components

Each component can have a co-located test file with `.test.tsx` extension.

### `/hooks` - Custom Hooks
Reusable hooks for common functionality:
- **useClubCheck** - Get user's club assignment and verify access
- **useAdminCheck** - Check if user is admin
- **useAuth** - Clerk authentication state
- **useFetch** - Generic API data fetching
- **useLocalStorage** - LocalStorage management

### `/lib` - Utilities
Helper functions and utilities:
- **api.ts** - Centralized API client with JWT handling
- **auth.ts** - Authentication utilities
- **types.ts** - Shared TypeScript types and interfaces
- **validators.ts** - Input validation functions
- **constants.ts** - App-wide constants

### `/docs` - Documentation
Complete documentation structure (see README.md).

### `/.claude` - Claude Code Configuration
Special directory for Claude Code IDE integration:
- **docs-map.md** - Documentation map for quick navigation
- **commands/** - Custom slash commands for common tasks

## File Naming Conventions

### Components
- **PascalCase** for component files: `AppointmentCard.tsx`
- **Functional components** only (no class components)
- Export default from file: `export default function AppointmentCard() { ... }`

### Hooks
- **camelCase** with `use` prefix: `useClubCheck.ts`
- Always start with `use`
- Export named or default function

### Utils
- **camelCase** for utility files: `date-utils.ts`
- Can export multiple functions

### Tests
- Same name as source file with `.test.ts(x)` suffix
- Example: `useClubCheck.ts` → `useClubCheck.test.ts`

## Import Paths

Use absolute imports with `@/` alias:

```typescript
// ✓ Good
import { useClubCheck } from '@/hooks/useClubCheck';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import { api } from '@/lib/api';

// ✗ Avoid
import { useClubCheck } from '../../../../hooks/useClubCheck';
```

The `@/` alias is configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Component Placement Rules

1. **Page Components** - Live in `/app` directory (route handlers)
2. **Feature Components** - Live in `/components/{feature}/` directory
3. **Reusable Components** - Live in `/components/common/` directory
4. **Guard Components** - Live in `/components/guards/` directory
5. **Layout Components** - Live in `/components/layout/` directory

## Example: Adding a New Feature

If you're adding a "Reports" feature:

```
app/
└── club/
    └── [id]/
        └── reports/
            ├── layout.tsx       # Reports layout
            └── page.tsx         # Reports page

components/
└── reports/
    ├── ReportList.tsx          # Display reports
    ├── ReportCard.tsx          # Single report card
    ├── ReportGenerator.tsx     # Generate report form
    ├── __tests__/
    │   ├── ReportList.test.tsx
    │   └── ReportCard.test.tsx

hooks/
└── useReports.ts               # Reports data hook

lib/
└── report-utils.ts             # Report helpers
```

## Build Output

When you run `npm run build`, Next.js creates a `.next` directory:

```
.next/
├── standalone/                 # Standalone build output
├── static/                     # Static files
└── server/                     # Server-side code
```

This is automatically generated and should be in `.gitignore`.

## Performance Optimization

### Code Splitting
- Next.js automatically splits code at route boundaries
- Each page loads only necessary code
- Dynamic imports: `const Component = dynamic(() => import('./Heavy'))`

### Image Optimization
- Use Next.js `Image` component instead of `<img>`
- Automatic lazy loading and responsive images

### Component Memoization
```typescript
// Prevent unnecessary re-renders
export default memo(function MyComponent(props) {
  // ...
});
```

## Related Documentation

- [Architecture Overview](./overview.md) - System design
- [Club-Based Routing](./club-based-routing.md) - Routing system
- [Hooks](./hooks.md) - Custom hooks reference
- [Components](./components.md) - Component reference
