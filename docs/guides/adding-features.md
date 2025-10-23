# Adding New Features

Step-by-step guide for implementing new features in Locomotive House.

## Feature Development Checklist

- [ ] Plan and design feature
- [ ] Create feature branch
- [ ] Implement feature
- [ ] Write tests
- [ ] Update documentation
- [ ] Create pull request
- [ ] Get code review
- [ ] Merge and deploy

## Step 1: Plan Your Feature

### Define Requirements

Before coding, define:
- What problem does it solve?
- Who will use it?
- What are the inputs/outputs?
- What are edge cases?

### Design the Solution

Sketch out:
- UI mockups (even rough drawings)
- Data model changes
- API endpoints needed
- User flows

### Check Existing Code

Look for similar features:
```bash
# Search for related code
grep -r "appointment" --include="*.tsx" --include="*.ts"
```

## Step 2: Create Feature Branch

```bash
# Start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

Use descriptive names:
- `feature/appointment-filters` - New feature
- `fix/auth-bug` - Bug fix
- `docs/api-guide` - Documentation

## Step 3: Implement Feature

### Club-Scoped Features

If your feature is club-specific:

```typescript
// 1. Create page at /club/[id]/feature/
// File: app/club/[id]/your-feature/page.tsx

import { ClubGuard } from '@/components/guards/ClubGuard';
import { useClubCheck } from '@/hooks/useClubCheck';

function YourFeatureContent() {
  const params = useParams();
  const clubId = Number(params.id);
  const { clubId: userClubId } = useClubCheck();

  // Verify user has access to club
  if (userClubId && userClubId !== clubId) {
    return <div>Access denied</div>;
  }

  return <div>Your feature</div>;
}

export default function YourFeaturePage() {
  return (
    <ClubGuard>
      <YourFeatureContent />
    </ClubGuard>
  );
}
```

### Create Components

```typescript
// File: components/your-feature/YourFeature.tsx

interface YourFeatureProps {
  clubId: number;
  onSuccess?: () => void;
}

export default function YourFeature({ clubId, onSuccess }: YourFeatureProps) {
  return (
    <div>
      {/* Your feature UI */}
    </div>
  );
}
```

### Add API Calls

```typescript
// File: lib/api.ts

export const api = {
  // ... existing endpoints ...

  // Add your endpoints
  async getYourData(clubId: number, token: string) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/clubs/${clubId}/your-endpoint`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
};
```

### Update Navigation

Update navbar to include your feature:

```typescript
// File: components/layout/Navbar.tsx

function Navbar() {
  const { clubId, loading } = useClubCheck();

  return (
    <nav>
      {clubId && (
        <>
          {/* Existing links */}
          <Link href={`/club/${clubId}/your-feature`}>
            Your Feature
          </Link>
        </>
      )}
    </nav>
  );
}
```

## Step 4: Write Tests

### Test Component

```typescript
// File: components/your-feature/YourFeature.test.tsx

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import YourFeature from './YourFeature';

describe('YourFeature', () => {
  it('renders feature', () => {
    render(<YourFeature clubId={1} />);
    expect(screen.getByText(/your feature/i)).toBeInTheDocument();
  });
});
```

### Test API Calls

```typescript
// Test that feature calls correct endpoint
import * as api from '@/lib/api';
import { vi } from 'vitest';

vi.mock('@/lib/api');

it('loads data on mount', async () => {
  vi.mocked(api.getYourData).mockResolvedValue([...]);

  render(<YourFeature clubId={1} />);

  await waitFor(() => {
    expect(api.getYourData).toHaveBeenCalledWith(1, expect.any(String));
  });
});
```

### Run Tests

```bash
npm test

# In watch mode
npm run test:watch
```

## Step 5: Update Documentation

### Document the Feature

Create feature documentation:

```bash
# File: docs/features/your-feature.md

# Your Feature

Description of what the feature does...

## How to Use

Step by step guide...

## API Endpoints

List endpoints used...
```

### Update README

Update main README if public-facing feature.

## Step 6: Create Pull Request

### Commit Changes

```bash
# Stage changes
git add .

# Commit with description
git commit -m "feat: add your feature

- Added your feature component
- Added your feature page at /club/:id/your-feature
- Added tests for your feature
- Updated documentation

Closes #123"
```

### Push Branch

```bash
git push origin feature/your-feature-name
```

### Open Pull Request

On GitHub:
1. Click "Create Pull Request"
2. Fill in template:
   - Clear title
   - Description of changes
   - Testing instructions
   - Related issues

### Pull Request Checklist

- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] No console errors
- [ ] Documentation updated
- [ ] Types are correct: `npm run type-check`

## Step 7: Code Review

Address feedback:

```bash
# Make requested changes
git add .
git commit -m "Address review feedback"
git push origin feature/your-feature-name
```

Once approved, merge:
1. GitHub automatically updates PR
2. Click "Merge pull request"
3. Delete branch

## Step 8: Deploy

After merging to main:

```bash
# Monitor deployment in GitHub Actions
# Check that tests pass and deployment succeeds
```

Feature is now live!

## Common Feature Patterns

### Add Filter/Search

```typescript
// Add state for filter
const [filter, setFilter] = useState('');

// Filter data
const filtered = data.filter(item =>
  item.name.includes(filter)
);

// Add input
<input
  placeholder="Search..."
  value={filter}
  onChange={(e) => setFilter(e.target.value)}
/>
```

### Add Modal Dialog

```typescript
const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
</Modal>
```

### Add Form

```typescript
const [formData, setFormData] = useState({ name: '' });

<form onSubmit={async (e) => {
  e.preventDefault();
  await api.create(formData);
}}>
  <input
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  />
  <button type="submit">Submit</button>
</form>
```

### Add Loading State

```typescript
const { data, loading, error } = useYourData();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;

return <div>{/* Display data */}</div>;
```

## Database Changes

If your feature needs database changes:

1. Plan schema
2. Create migration
3. Run locally
4. Test thoroughly
5. Document changes

```bash
# Create migration
npm run db:migrate:create "add_your_table"

# Run locally
npm run db:migrate:dev

# Test queries work
npm test
```

## API Changes

If your feature needs backend changes:

1. Coordinate with backend team
2. Define API contract (endpoints, request/response)
3. Implement frontend assuming API exists
4. Test integration when backend ready
5. Document endpoints

## Testing Edge Cases

Think about and test:
- Empty states (no data)
- Error states (API fails)
- Loading states
- Invalid input
- Large data sets
- Different screen sizes

## Performance Considerations

For features with data:

```typescript
// Use useMemo for expensive calculations
const processed = useMemo(() => {
  return data.filter(...).map(...).sort(...);
}, [data]);

// Use pagination for large lists
// Use debounce for search inputs
// Lazy load images
```

## Accessibility

Make features accessible:

```typescript
// Use semantic HTML
<button>Submit</button>

// Add labels to inputs
<label htmlFor="name">Name</label>
<input id="name" />

// Use ARIA for screen readers
<div role="alert">{errorMessage}</div>

// Ensure color contrast
// Support keyboard navigation
```

## Example: Complete Feature

Complete example adding a "Reports" feature:

```bash
# 1. Create branch
git checkout -b feature/add-reports

# 2. Create files
# app/club/[id]/reports/page.tsx
# components/reports/ReportList.tsx
# components/reports/ReportCard.tsx
# hooks/useReports.ts
# docs/features/reports.md

# 3. Implement feature
# ... write code ...

# 4. Test
npm test

# 5. Commit
git add .
git commit -m "feat: add reports feature"

# 6. Push and PR
git push origin feature/add-reports

# 7. Review and merge
# ... review process ...

# 8. Feature is live!
```

## Related Documentation

- [Architecture Overview](../architecture/overview.md) - System design
- [Coding Standards](../development/coding-standards.md) - Code style
- [Testing Guide](../development/testing.md) - Writing tests
- [Git Workflow](../development/git-workflow.md) - Git process
