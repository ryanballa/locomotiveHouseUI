# Contributing Guide

Thank you for your interest in contributing to Locomotive House! This guide will help you understand how to contribute code, report issues, and improve the project.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/locomotiveHouseV4UI.git
   cd locomotiveHouseV4UI
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Follow the setup guide**: See [Installation](./docs/getting-started/installation.md)

## Development Process

### 1. Write Your Code

Follow the [Coding Standards](./docs/development/coding-standards.md):

- Use TypeScript for type safety
- Follow the existing code style
- Write clear, maintainable code
- Add comments for complex logic

### 2. Test Your Changes

```bash
# Run tests
npm test

# Run build
npm run build

# Check linting
npm run lint
```

All tests must pass before submitting a PR.

### 3. Commit Your Changes

Follow conventional commit format:

```
feat: add club-based appointments
fix: resolve authentication error
docs: update setup guide
test: add appointment creation tests
refactor: simplify routing logic
chore: update dependencies
```

Example:

```bash
git commit -m "feat: add club-based appointment management

- Created /club/[id]/appointments route
- Implemented ClubGuard component
- Added useClubCheck hook

Closes #123"
```

### 4. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 5. Create a Pull Request

1. Go to GitHub and create a PR from your branch to `main`
2. Fill in the PR template with:
   - Clear title
   - Description of changes
   - Links to related issues
   - Testing instructions

## Coding Standards

### TypeScript

- Use strict mode (enabled in tsconfig.json)
- Type all function parameters and returns
- Avoid `any` unless absolutely necessary

```typescript
// ✓ Good
function getUserName(userId: number): string {
  return users.find((u) => u.id === userId)?.name || "Unknown";
}

// ✗ Avoid
function getUserName(userId: any) {
  return users.find((u) => u.id === userId)?.name;
}
```

### Components

- Functional components only
- Use hooks for state and side effects
- Export default components
- Use descriptive names

```typescript
// ✓ Good
export default function ClubList() {
  const [clubs, setClubs] = useState([]);

  return (
    <div>
      {clubs.map(club => (
        <ClubCard key={club.id} club={club} />
      ))}
    </div>
  );
}

// ✗ Avoid
export const Comp = () => { ... }; // Unclear name
```

### Styling

- Use Tailwind CSS classes
- No inline styles
- Consistent spacing and sizing

```typescript
// ✓ Good
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  Click me
</button>

// ✗ Avoid
<button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
  Click me
</button>
```

### Error Handling

- Always handle errors in async operations
- Provide meaningful error messages
- Use try/catch blocks

```typescript
// ✓ Good
try {
  const data = await apiClient.getAppointments(token);
  setAppointments(data);
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Failed to load appointments";
  setError(message);
}

// ✗ Avoid
const data = await apiClient.getAppointments(token);
setAppointments(data); // No error handling
```

## Testing

### Test Structure

Place tests next to the code they test:

```
app/
├── components/
│   ├── ClubCard.tsx
│   └── ClubCard.test.tsx
```

### Writing Tests

Use Vitest and React Testing Library:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ClubCard from "./ClubCard";

describe("ClubCard", () => {
  it("renders club name", () => {
    const club = { id: 1, name: "Test Club" };
    render(<ClubCard club={club} />);

    expect(screen.getByText("Test Club")).toBeInTheDocument();
  });

  it("handles click event", () => {
    const onClick = vi.fn();
    const club = { id: 1, name: "Test Club" };

    render(<ClubCard club={club} onClick={onClick} />);

    screen.getByRole("button").click();
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Test Requirements

- Aim for >80% code coverage
- Test happy paths and error cases
- Test user interactions
- Mock external dependencies

## Git Workflow

### Branch Naming

```
feature/description        # New feature
fix/description           # Bug fix
docs/description          # Documentation
test/description          # Tests
refactor/description      # Code refactoring
chore/description         # Maintenance
```

### Commit Messages

Follow the 50/72 rule:

- First line: 50 characters, clear summary
- Blank line
- Detailed explanation (72 char lines)

```
feat: add appointment filtering

Allow users to filter appointments by date range and status.
This makes it easier to find specific appointments in a long list.

- Added DateRangePicker component
- Added status filter dropdown
- Updated appointments query to support filters
```

### Pull Request Process

1. **Ensure all tests pass**: `npm test && npm run build`
2. **Update documentation** if needed
3. **Request review** from maintainers
4. **Address feedback** from reviewers
5. **Merge** after approval

## Documentation

### When to Document

- New features need feature documentation
- Architecture changes need architecture updates
- New APIs need API documentation
- How-to guides for complex tasks

### Documentation Standards

- Clear, concise language
- Code examples where helpful
- Links to related documentation
- Markdown formatting

See [Docs README](./docs/README.md) for documentation structure.

## Reporting Issues

### Bug Reports

Include:

- Clear title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/error logs
- Environment (OS, Node version, etc.)

### Feature Requests

Include:

- Clear title
- Problem being solved
- Proposed solution
- Alternatives considered
- Use cases

## Review Process

Maintainers will:

1. Review code for quality and standards
2. Check all tests pass
3. Verify documentation is updated
4. Run integration tests
5. Approve or request changes

## Common Issues

### Build fails

```bash
rm -rf .next node_modules
npm install
npm run build
```

### Tests fail

```bash
npm test -- --reporter=verbose
```

### Type errors

```bash
npm run type-check
```

## Merge and Deploy

After approval:

1. Your branch will be merged to `main`
2. GitHub Actions will run final checks
3. Code will be deployed based on CI/CD configuration

## Getting Help

- 📖 Check the [Documentation](./docs/README.md)
- 💬 Ask in GitHub discussions
- 🐛 Open an issue for bugs
- 📧 Email the team

## Thank You

Thanks for contributing! Every contribution helps make Locomotive House better.

---

**Last updated**: 2025-10-23
**Version**: 1.0
