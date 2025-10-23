# Testing Guide

Write effective tests to ensure code quality and prevent regressions.

## Testing Stack

- **Framework**: Vitest
- **Component Testing**: React Testing Library
- **Assertion Library**: Vitest built-in expect

## Running Tests

### Run All Tests

```bash
npm test
```

### Run in Watch Mode

```bash
npm run test:watch
```

Reruns tests on file changes during development.

### Run Specific Test File

```bash
npm test AppointmentCard.test.tsx
```

### Run with UI

```bash
npm run test:ui
```

Opens interactive dashboard.

### Coverage Report

```bash
npm test -- --coverage
```

Shows code coverage percentage.

## Test Structure

### Basic Test File

File: `components/appointments/AppointmentCard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentCard } from './AppointmentCard';

describe('AppointmentCard', () => {
  it('renders appointment details', () => {
    const appointment = {
      id: 1,
      title: 'Team Meeting',
      start_time: '2025-10-24T14:00:00Z',
      duration_minutes: 60,
    };

    render(<AppointmentCard appointment={appointment} />);

    expect(screen.getByText('Team Meeting')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const appointment = { id: 1, title: 'Meeting', start_time: '', duration_minutes: 60 };

    render(<AppointmentCard appointment={appointment} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalled();
  });
});
```

## Testing Components

### Rendering

```typescript
// ✓ Good: Test rendering
it('renders user name', () => {
  render(<UserCard user={{ name: 'John' }} />);
  expect(screen.getByText('John')).toBeInTheDocument();
});

// ✓ Good: Test conditional rendering
it('shows loading state', () => {
  render(<UserCard user={null} isLoading={true} />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

### User Interactions

```typescript
import userEvent from '@testing-library/user-event';

// ✓ Good: Test button clicks
it('handles click event', async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click Me</Button>);

  await userEvent.click(screen.getByRole('button'));

  expect(onClick).toHaveBeenCalled();
});

// ✓ Good: Test form submission
it('submits form', async () => {
  const onSubmit = vi.fn();
  render(<Form onSubmit={onSubmit} />);

  const input = screen.getByLabelText('Name');
  await userEvent.type(input, 'John');
  await userEvent.click(screen.getByText('Submit'));

  expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
});
```

### Testing Props

```typescript
// ✓ Good: Test different prop combinations
it('renders with primary variant', () => {
  render(<Button variant="primary">Click</Button>);
  expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
});

it('renders with secondary variant', () => {
  render(<Button variant="secondary">Click</Button>);
  expect(screen.getByRole('button')).toHaveClass('bg-gray-600');
});

it('disables button when disabled prop is true', () => {
  render(<Button disabled>Click</Button>);
  expect(screen.getByRole('button')).toBeDisabled();
});
```

## Testing Hooks

### Basic Hook Test

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useClubCheck } from '@/hooks/useClubCheck';

describe('useClubCheck', () => {
  it('returns initial loading state', () => {
    const { result } = renderHook(() => useClubCheck());

    expect(result.current.loading).toBe(true);
  });

  it('returns club ID when loaded', async () => {
    const { result } = renderHook(() => useClubCheck());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.clubId).toBeDefined();
  });
});
```

### Testing Hook Dependencies

```typescript
it('refetches when dependency changes', async () => {
  const { result, rerender } = renderHook(
    ({ clubId }: { clubId: number }) => useClubAppointments(clubId),
    { initialProps: { clubId: 1 } }
  );

  await waitFor(() => {
    expect(result.current.appointments).toBeDefined();
  });

  // Change dependency
  rerender({ clubId: 2 });

  await waitFor(() => {
    // Verify data was refetched for new clubId
    expect(result.current.appointments).toBeDefined();
  });
});
```

## Mocking

### Mock API Calls

```typescript
import { vi } from 'vitest';
import * as api from '@/lib/api';

// Mock the api module
vi.mock('@/lib/api');

describe('MyComponent', () => {
  it('displays appointments', async () => {
    // Setup mock
    vi.mocked(api.getAppointments).mockResolvedValue([
      { id: 1, title: 'Meeting' },
    ]);

    render(<MyComponent />);

    await waitFor(() => {
      expect(screen.getByText('Meeting')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    // Setup mock to reject
    vi.mocked(api.getAppointments).mockRejectedValue(
      new Error('API Error')
    );

    render(<MyComponent />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Mock Hooks

```typescript
import { useClubCheck } from '@/hooks/useClubCheck';

vi.mock('@/hooks/useClubCheck');

describe('MyComponent', () => {
  it('renders when user has club', () => {
    vi.mocked(useClubCheck).mockReturnValue({
      clubId: 1,
      loading: false,
      hasClub: true,
    });

    render(<MyComponent />);

    expect(screen.getByText('Club: 1')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useClubCheck).mockReturnValue({
      clubId: null,
      loading: true,
      hasClub: false,
    });

    render(<MyComponent />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

## Test Organization

### Describe Blocks

Organize tests with describe blocks:

```typescript
describe('AppointmentForm', () => {
  describe('rendering', () => {
    it('renders form fields', () => {});
    it('renders submit button', () => {});
  });

  describe('validation', () => {
    it('requires date field', () => {});
    it('requires time field', () => {});
  });

  describe('submission', () => {
    it('submits valid form', () => {});
    it('shows error on invalid form', () => {});
  });
});
```

### Setup and Teardown

```typescript
describe('MyComponent', () => {
  let mockApi;

  beforeEach(() => {
    // Setup before each test
    mockApi = vi.mock('@/lib/api');
  });

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks();
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

## Best Practices

### 1. Test User Behavior, Not Implementation

```typescript
// ✓ Good: Test what user sees
it('shows success message after deletion', async () => {
  render(<DeleteButton />);
  await userEvent.click(screen.getByText('Delete'));
  await userEvent.click(screen.getByText('Confirm'));
  expect(screen.getByText('Deleted successfully')).toBeInTheDocument();
});

// ✗ Avoid: Testing internal state
it('sets isDeleted to true', () => {
  const { result } = renderHook(() => useDelete());
  // Test internal state
  expect(result.current.isDeleted).toBe(true);
});
```

### 2. Use Semantic Queries

```typescript
// ✓ Good: Semantic queries (what users see)
screen.getByRole('button');
screen.getByLabelText('Email');
screen.getByText('Submit');

// ✗ Avoid: Implementation details
screen.getByTestId('submit-button');
screen.getByClassName('button-primary');
```

### 3. Avoid Testing Implementation Details

```typescript
// ✓ Good: Test visible behavior
it('shows error when email is invalid', async () => {
  render(<Form />);
  await userEvent.type(screen.getByLabelText('Email'), 'invalid');
  expect(screen.getByText('Invalid email')).toBeInTheDocument();
});

// ✗ Avoid: Testing implementation
it('sets validationError state', () => {
  // Testing internal state
});
```

### 4. Test Happy Path and Edge Cases

```typescript
describe('calculateTotal', () => {
  it('calculates correct total', () => {
    expect(calculateTotal([10, 20, 30])).toBe(60);
  });

  it('handles empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('handles negative numbers', () => {
    expect(calculateTotal([10, -5, 20])).toBe(25);
  });
});
```

### 5. Use Descriptive Test Names

```typescript
// ✓ Good: Clear test names
it('shows success message when appointment is created', () => {});
it('disables submit button when form has errors', () => {});
it('navigates to appointments after creation', () => {});

// ✗ Avoid: Vague names
it('works', () => {});
it('test form', () => {});
it('success', () => {});
```

## Code Coverage

### Coverage Goals

- **Line coverage**: >80%
- **Branch coverage**: >75%
- **Function coverage**: >80%

### View Coverage

```bash
npm test -- --coverage
```

### Focus on Critical Paths

```typescript
// ✓ Good: High coverage on critical features
// - Authentication
// - Data validation
// - Error handling

// ✗ Avoid: Testing trivial code
// - Simple getters
// - CSS utilities
// - Third-party code
```

## Common Assertions

### Component Rendering

```typescript
expect(screen.getByText('Hello')).toBeInTheDocument();
expect(screen.getByRole('button')).toBeVisible();
expect(element).toHaveClass('active');
expect(element).toHaveAttribute('href', '/appointments');
```

### Functions and Values

```typescript
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith('arg1');
expect(value).toBe(true);
expect(array).toHaveLength(3);
expect(object).toEqual({ name: 'John' });
expect(() => throwError()).toThrow();
```

### Async

```typescript
await waitFor(() => {
  expect(element).toBeInTheDocument();
});

await expect(promise).rejects.toThrow('error message');
await expect(promise).resolves.toEqual({ data: 'value' });
```

## Example: Complete Test Suite

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentForm } from './AppointmentForm';
import * as api from '@/lib/api';

vi.mock('@/lib/api');

describe('AppointmentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders form fields', () => {
      render(<AppointmentForm onSuccess={() => {}} />);

      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Time')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<AppointmentForm onSuccess={() => {}} />);
      expect(screen.getByText('Create Appointment')).toBeInTheDocument();
    });
  });

  describe('submission', () => {
    it('submits form with valid data', async () => {
      vi.mocked(api.createAppointment).mockResolvedValue({
        id: 1,
        title: 'Meeting',
      });

      const onSuccess = vi.fn();
      render(<AppointmentForm onSuccess={onSuccess} />);

      await userEvent.type(screen.getByLabelText('Title'), 'Meeting');
      await userEvent.click(screen.getByText('Create Appointment'));

      await waitFor(() => {
        expect(api.createAppointment).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('shows error on failure', async () => {
      vi.mocked(api.createAppointment).mockRejectedValue(
        new Error('API Error')
      );

      render(<AppointmentForm onSuccess={() => {}} />);

      await userEvent.type(screen.getByLabelText('Title'), 'Meeting');
      await userEvent.click(screen.getByText('Create Appointment'));

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
```

## Related Documentation

- [Coding Standards](./coding-standards.md) - Code style
- [Contributing Guide](../../CONTRIBUTING.md) - Test requirements in PR
