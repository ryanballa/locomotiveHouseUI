# Component Reference

Complete reference for reusable components used throughout the application.

## Guard Components

Guard components wrap pages and components to enforce access control.

### ClubGuard

Ensures user has a club assignment before rendering content.

#### Usage

```typescript
import { ClubGuard } from '@/components/guards/ClubGuard';

export default function MyClubPage() {
  return (
    <ClubGuard>
      <MyPageContent />
    </ClubGuard>
  );
}
```

#### Props

```typescript
interface ClubGuardProps {
  children: React.ReactNode;  // Content to render if check passes
}
```

#### Behavior

1. **Loading**: Shows loading spinner while checking club assignment
2. **No Club**: Shows "Club Assignment Required" message if user has no club
3. **Has Club**: Renders children if user has club assignment

#### Implementation

```typescript
export function ClubGuard({ children }: ClubGuardProps) {
  const { hasClub, loading } = useClubCheck();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasClub) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Club Assignment Required</h2>
        <p className="text-gray-600">Please contact your administrator to assign a club.</p>
      </div>
    );
  }

  return <>{children}</>;
}
```

#### When to Use

- Wrapping pages that require club membership
- Wrapping features that are club-specific
- Example: `/club/[id]/appointments` page

---

### AdminGuard

Ensures user has admin permissions before rendering content.

#### Usage

```typescript
import { AdminGuard } from '@/components/guards/AdminGuard';

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  );
}
```

#### Props

```typescript
interface AdminGuardProps {
  children: React.ReactNode;  // Content to render if admin
}
```

#### Behavior

1. **Loading**: Shows loading spinner while checking permissions
2. **Not Admin**: Shows "Admin access required" message if not admin
3. **Is Admin**: Renders children if user is admin

#### Implementation

```typescript
export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, loading } = useAdminCheck();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <p className="text-gray-600">You do not have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
```

#### When to Use

- Wrapping admin dashboard pages
- Wrapping club management pages
- Wrapping user management pages
- Example: `/admin/clubs` page

---

## Layout Components

### Navbar

Main navigation component at the top of the page.

#### Location

`components/layout/Navbar.tsx`

#### Features

- User authentication status
- Club-aware navigation links
- Appointments dropdown menu
- Addresses link
- Admin dropdown (admins only)
- User profile menu

#### Usage

```typescript
// Typically used in root layout
import { Navbar } from '@/components/layout/Navbar';

export default function RootLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
```

#### Club-Aware Navigation

Navbar uses `useClubCheck()` to get the user's club ID:

```typescript
function Navbar() {
  const { clubId, loading } = useClubCheck();

  return (
    <nav>
      {clubId && (
        <Link href={`/club/${clubId}/appointments`}>
          Appointments
        </Link>
      )}
    </nav>
  );
}
```

#### Dropdown Menus

The Navbar includes state management for dropdown menus:

```typescript
const [isAppointmentsDropdownOpen, setIsAppointmentsDropdownOpen] = useState(false);
const [isAddressesDropdownOpen, setIsAddressesDropdownOpen] = useState(false);
```

---

## Common Components

Reusable UI components for consistent styling and behavior.

### LoadingSpinner

Shows a loading indicator to the user.

#### Usage

```typescript
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function MyComponent() {
  const { loading } = useData();

  if (loading) return <LoadingSpinner />;

  return <div>Data loaded</div>;
}
```

#### Variants

```typescript
// Default spinner
<LoadingSpinner />

// With message
<LoadingSpinner message="Loading appointments..." />

// Size variants
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />
```

---

### ErrorMessage

Displays error messages to users.

#### Usage

```typescript
import { ErrorMessage } from '@/components/common/ErrorMessage';

export function MyComponent() {
  const { error } = useData();

  if (error) return <ErrorMessage message={error.message} />;

  return <div>Data loaded</div>;
}
```

#### Props

```typescript
interface ErrorMessageProps {
  message: string;              // Error message to display
  onDismiss?: () => void;       // Called when user dismisses error
  type?: 'error' | 'warning';   // Message type (styling)
}
```

---

### Button

Reusable button component with consistent styling.

#### Usage

```typescript
import { Button } from '@/components/common/Button';

export function MyComponent() {
  return (
    <Button onClick={handleClick}>
      Click Me
    </Button>
  );
}
```

#### Variants

```typescript
// Primary button (default)
<Button>Click Me</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Danger button
<Button variant="danger">Delete</Button>

// Disabled state
<Button disabled>Loading...</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}
```

---

### Modal

Reusable modal dialog component.

#### Usage

```typescript
import { Modal } from '@/components/common/Modal';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Modal.Header>Modal Title</Modal.Header>
        <Modal.Body>
          <p>Modal content goes here</p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
          <Button variant="primary">Save</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
```

#### Props

```typescript
interface ModalProps {
  isOpen: boolean;              // Whether modal is visible
  onClose: () => void;          // Called when modal should close
  title?: string;               // Modal title
  children: React.ReactNode;    // Modal content
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}
```

---

### ConfirmDialog

Modal for confirmation actions (delete, etc.).

#### Usage

```typescript
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export function DeleteButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = async () => {
    await api.deleteItem();
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="danger">
        Delete
      </Button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Delete Item?"
        message="This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
```

#### Props

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;         // Default: "Confirm"
  cancelText?: string;          // Default: "Cancel"
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isDanger?: boolean;           // Red styling for dangerous actions
}
```

---

## Feature Components

Feature-specific components organized by domain.

### Appointments Components

```
components/appointments/
├── AppointmentList.tsx      # Displays all appointments
├── AppointmentCard.tsx      # Single appointment in list
├── AppointmentForm.tsx      # Create/edit form
└── AppointmentModal.tsx     # Modal wrapper
```

#### AppointmentList

```typescript
import { AppointmentList } from '@/components/appointments/AppointmentList';

export function AppointmentsPage() {
  const appointments = useClubAppointments(clubId);

  return <AppointmentList appointments={appointments} />;
}
```

#### AppointmentCard

```typescript
interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}
```

#### AppointmentForm

Form for creating or editing appointments:

```typescript
interface AppointmentFormProps {
  onSubmit: (data: CreateAppointmentInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: Appointment;  // For editing
}
```

---

### Addresses Components

```
components/addresses/
├── AddressList.tsx         # Displays all addresses
├── AddressCard.tsx         # Single address in list
├── AddressForm.tsx         # Create/edit form
└── AddressModal.tsx        # Modal wrapper
```

#### AddressForm

Form for creating or editing addresses:

```typescript
interface AddressFormProps {
  onSubmit: (data: CreateAddressInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: Address;     // For editing
  users?: User[];            // For user selection
}
```

---

## Component Patterns

### Pattern 1: Controlled Form Components

```typescript
export function MyForm({ onSubmit, isLoading }: MyFormProps) {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Button type="submit" isLoading={isLoading}>
        Submit
      </Button>
    </form>
  );
}
```

### Pattern 2: List with Actions

```typescript
export function MyList({ items, onEdit, onDelete }: MyListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex justify-between">
          <span>{item.name}</span>
          <div className="space-x-2">
            <Button onClick={() => onEdit(item.id)} size="sm">
              Edit
            </Button>
            <Button onClick={() => onDelete(item.id)} variant="danger" size="sm">
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 3: Compound Components

For complex component hierarchies:

```typescript
export function Modal({ children }: ModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

Modal.Trigger = function ModalTrigger({ children }: { children: React.ReactNode }) {
  const { setIsOpen } = useContext(ModalContext);
  return <button onClick={() => setIsOpen(true)}>{children}</button>;
};

Modal.Content = function ModalContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useContext(ModalContext);
  return isOpen ? <div>{children}</div> : null;
};

// Usage
<Modal>
  <Modal.Trigger>Open</Modal.Trigger>
  <Modal.Content>Content</Modal.Content>
</Modal>
```

---

## Styling Components

All components use **Tailwind CSS** for styling. No inline styles.

### Common Tailwind Classes

```typescript
// Buttons
'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'

// Cards
'p-6 bg-white rounded-lg shadow-md'

// Containers
'container mx-auto max-w-7xl px-4'

// Spacing
'mb-4 mt-2 space-y-2'

// Text
'text-lg font-semibold text-gray-900'
```

### Creating Styled Components

```typescript
// ✓ Good: Tailwind classes
function Button({ children }) {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      {children}
    </button>
  );
}

// ✗ Avoid: Inline styles
function Button({ children }) {
  return (
    <button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
      {children}
    </button>
  );
}
```

---

## Best Practices

### 1. Keep Components Small

```typescript
// ✓ Good: Single responsibility
export function AppointmentCard({ appointment }: AppointmentCardProps) {
  return (
    <div className="p-4 border rounded">
      <h3>{appointment.title}</h3>
      <p>{appointment.time}</p>
    </div>
  );
}

// ✗ Avoid: Too much logic
export function AppointmentList({ appointments }) {
  // 100 lines of rendering + logic
}
```

### 2. Extract Reusable Logic

```typescript
// ✓ Good: Custom hook for logic
function AppointmentList() {
  const { appointments, loading, error } = useAppointments();
  // Use appointments in JSX
}

// ✗ Avoid: Logic in component
function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  useEffect(() => {
    // 30 lines of fetch logic
  }, []);
}
```

### 3. Use TypeScript for Props

```typescript
// ✓ Good: Typed props
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  // ...
}

// ✗ Avoid: No types
export function Button(props) {
  // ...
}
```

### 4. Avoid Prop Drilling

```typescript
// ✓ Good: Use context for shared data
<UserContext.Provider value={{ user, clubId }}>
  <PageA />
</UserContext.Provider>

// ✗ Avoid: Passing props through many levels
<PageA user={user} clubId={clubId}>
  <PageB user={user} clubId={clubId}>
    <PageC user={user} clubId={clubId} />
  </PageB>
</PageA>
```

---

## Testing Components

See [Testing Guide](../development/testing.md) for comprehensive component testing examples.

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/common/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalled();
  });
});
```

---

## Related Documentation

- [App Structure](./app-structure.md) - Where components live
- [Club-Based Routing](./club-based-routing.md) - Guard usage in routing
- [Testing Guide](../development/testing.md) - Testing components
