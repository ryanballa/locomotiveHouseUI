# Coding Standards

Follow these standards to maintain consistent, high-quality code.

## TypeScript

### Strict Mode

Always enable strict TypeScript mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Type Annotations

Always type function parameters and return values:

```typescript
// ✓ Good: Clear types
function getUserName(userId: number): string {
  return users.find(u => u.id === userId)?.name || 'Unknown';
}

// ✗ Avoid: No types
function getUserName(userId) {
  return users.find(u => u.id === userId)?.name;
}

// ✗ Avoid: Using `any`
function getUserName(userId: any): any {
  return users.find(u => u.id === userId)?.name;
}
```

### Avoid `any`

```typescript
// ✓ Good: Specific type
function processData(data: Appointment[]): void {
  // ...
}

// ✗ Avoid: Using any
function processData(data: any): any {
  // ...
}
```

### Use Interfaces for Objects

```typescript
// ✓ Good
interface User {
  id: number;
  email: string;
  name: string;
}

const user: User = { id: 1, email: 'test@example.com', name: 'John' };

// ✗ Avoid
const user: { id: number; email: string; name: string } = {
  id: 1,
  email: 'test@example.com',
  name: 'John'
};
```

### Union Types for Variants

```typescript
// ✓ Good: Discriminated unions
type Result =
  | { status: 'success'; data: User }
  | { status: 'error'; message: string };

function handleResult(result: Result) {
  if (result.status === 'success') {
    console.log(result.data);
  }
}

// ✗ Avoid: Non-discriminated union
type Result = User | Error;  // Unclear when to use which
```

## Components

### Functional Components Only

```typescript
// ✓ Good: Functional component
export default function UserCard({ user }: UserCardProps) {
  return <div>{user.name}</div>;
}

// ✗ Avoid: Class component
class UserCard extends React.Component {
  // ...
}
```

### Use Hooks for State

```typescript
// ✓ Good: Use useState
function MyComponent() {
  const [count, setCount] = useState(0);

  return <div>{count}</div>;
}

// ✗ Avoid: State property
function MyComponent() {
  this.state = { count: 0 };
}
```

### Component Naming

```typescript
// ✓ Good: PascalCase, descriptive
export default function AppointmentCard() {}
export default function UserList() {}

// ✗ Avoid: Not descriptive
export default function Card() {}
export default function List() {}
export const Comp = () => {};
```

### Props Type Definition

```typescript
// ✓ Good: Props interface
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function Button({ onClick, children, disabled }: ButtonProps) {
  // ...
}

// ✗ Avoid: No type safety
export default function Button(props) {
  // ...
}
```

### Component File Structure

```typescript
// 1. Imports
import { useState } from 'react';
import { useClubCheck } from '@/hooks/useClubCheck';

// 2. Type definitions
interface MyComponentProps {
  title: string;
}

// 3. Component
export default function MyComponent({ title }: MyComponentProps) {
  const { clubId } = useClubCheck();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <h1>{title}</h1>
      {/* JSX */}
    </div>
  );
}
```

### Default Exports

```typescript
// ✓ Good: Export default
export default function MyComponent() {}

// ✗ Avoid: Named export for components
export function MyComponent() {}
```

## Styling

### Use Tailwind CSS

```typescript
// ✓ Good: Tailwind classes
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
  Click me
</button>

// ✗ Avoid: Inline styles
<button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
  Click me
</button>

// ✗ Avoid: CSS-in-JS libraries (unless necessary)
const StyledButton = styled.button`
  padding: 8px 16px;
  background-color: blue;
`;
```

### Common Patterns

```typescript
// Buttons
'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'

// Cards
'p-6 bg-white rounded-lg shadow-md border border-gray-200'

// Forms
'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'

// Containers
'container mx-auto max-w-7xl px-4'

// Spacing
'mb-4 mt-2 space-y-2'

// Text
'text-lg font-semibold text-gray-900'
```

### Responsive Design

```typescript
// ✓ Good: Mobile-first
<div className="w-full md:w-1/2 lg:w-1/3">
  Content
</div>

// ✓ Good: Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
```

## Error Handling

### Always Handle Errors

```typescript
// ✓ Good: Explicit error handling
async function fetchData() {
  try {
    const response = await api.getData();
    setData(response);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Failed to fetch data';
    setError(message);
  }
}

// ✗ Avoid: No error handling
async function fetchData() {
  const response = await api.getData();
  setData(response);
}
```

### Meaningful Error Messages

```typescript
// ✓ Good: Specific error messages
throw new Error('User not found with id: 123');
throw new Error('Failed to connect to database');

// ✗ Avoid: Generic messages
throw new Error('Error');
throw new Error('Failed');
```

### Error Logging

```typescript
// ✓ Good: Log with context
console.error('Failed to create appointment:', error);
console.warn('Deprecated API endpoint used');

// ✗ Avoid
console.error(error);
console.log('ERROR');
```

## Naming Conventions

### Variables

```typescript
// ✓ Good: Descriptive names
const userName = 'John';
const isLoading = true;
const appointmentCount = 5;

// ✗ Avoid: Single letters (except loop counters)
const u = 'John';
const l = true;
const ac = 5;
```

### Constants

```typescript
// ✓ Good: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;

// ✓ Also good: camelCase for objects
const defaultConfig = { timeout: 5000 };

// ✗ Avoid: lowercase for constants
const max_retries = 3;
```

### Booleans

```typescript
// ✓ Good: is/has prefix for booleans
const isAdmin = true;
const hasClub = false;
const isLoading = true;

// ✗ Avoid: Unclear names
const admin = true;
const club = false;
const loading = true;
```

### Functions

```typescript
// ✓ Good: Verb naming for functions
const fetchAppointments = async () => {};
const validateEmail = (email: string) => {};
const handleClick = () => {};

// ✗ Avoid: Noun naming for functions
const appointments = () => {};
const email = (email: string) => {};
const click = () => {};
```

## File Organization

### Imports Order

1. React/Next.js
2. External libraries
3. Internal components/hooks
4. Internal utilities/lib
5. Types

```typescript
// ✓ Good
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

import { AppointmentList } from '@/components/appointments/AppointmentList';
import { useClubCheck } from '@/hooks/useClubCheck';
import { api } from '@/lib/api';
import type { Appointment } from '@/lib/types';
```

### Import/Export Style

```typescript
// ✓ Good: Clear imports
import { Component } from './Component';
import { useHook } from '@/hooks/useHook';

// ✓ Also good: Default exports
import Component from './Component';

// ✗ Avoid: Wildcard imports (except for barrel files)
import * as Utils from '@/lib/utils';

// ✗ Avoid: Relative paths for distant files
import { Component } from '../../../../components/Component';
```

## Comments

### When to Comment

```typescript
// ✓ Good: Explain WHY, not WHAT
// We use setTimeout to allow React to update DOM first
setTimeout(() => setIsOpen(false), 0);

// ✓ Good: Document complex logic
// Calculate business days (excluding weekends and holidays)
const businessDays = appointments.filter(apt => {
  const day = new Date(apt.date).getDay();
  return day !== 0 && day !== 6 && !holidays.includes(apt.date);
});

// ✗ Avoid: Obvious comments
const name = 'John';  // Set name to John
const count = 0;      // Initialize count
```

### Comment Style

```typescript
// ✓ Good: Single line for short comments
// User is not signed in
if (!isSignedIn) return null;

// ✓ Good: Multi-line for complex logic
/*
 * Fetch user data and check club assignment.
 * This ensures the user has access before rendering.
 */
useEffect(() => {
  // Implementation
}, []);
```

## Testing

### Test Every Component

```typescript
// ✓ Good: Tests for components
describe('AppointmentCard', () => {
  it('renders appointment details', () => {
    // Test implementation
  });

  it('handles click event', () => {
    // Test implementation
  });
});
```

### Use Descriptive Test Names

```typescript
// ✓ Good: Clear test descriptions
it('renders club name when user has club', () => {});
it('shows error message when fetch fails', () => {});
it('disables submit button when form is invalid', () => {});

// ✗ Avoid: Vague test names
it('works correctly', () => {});
it('test button', () => {});
```

## Performance

### Use useMemo for Expensive Calculations

```typescript
// ✓ Good: Memoize expensive calculation
const expensiveValue = useMemo(() => {
  return items.filter(/* complex logic */);
}, [items]);

// ✗ Avoid: Recalculate on every render
const expensiveValue = items.filter(/* complex logic */);
```

### Use useCallback for Function Dependencies

```typescript
// ✓ Good: Memoize callback
const handleClick = useCallback(() => {
  // Handle click
}, []);

// ✗ Avoid: Function recreated every render
const handleClick = () => {
  // Handle click
};
```

## Code Review Checklist

Before submitting PR:

- [ ] All functions/components have type annotations
- [ ] No `any` types without justification
- [ ] All errors are handled
- [ ] Code follows naming conventions
- [ ] Components are small and focused
- [ ] Tests are written and passing
- [ ] No console.log left in code
- [ ] Styles use Tailwind only
- [ ] Import order is correct
- [ ] Comments explain WHY, not WHAT
- [ ] No unused variables/imports
- [ ] Performance optimizations applied

## Tools

These tools help enforce standards:

- **ESLint**: Linting (run with `npm run lint`)
- **Prettier**: Code formatting (run with `npm run lint:fix`)
- **TypeScript**: Type checking (run with `npm run type-check`)
- **Vitest**: Testing (run with `npm test`)

## Related Documentation

- [Testing Guide](./testing.md) - Writing good tests
- [Git Workflow](./git-workflow.md) - Commit guidelines
- [Setup Dev Environment](./setup-dev-env.md) - IDE configuration
