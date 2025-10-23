# Development

Guides for developers working on Locomotive House.

## Getting Started with Development

### [Setup Dev Environment](./setup-dev-env.md)
Configure your IDE and development tools.
- IDE setup (VS Code recommended)
- Node.js and npm setup
- Project setup and dependencies
- Development workflow
- **[Read Full Guide →](./setup-dev-env.md)**

### [Coding Standards](./coding-standards.md)
Code style and best practices.
- TypeScript conventions
- Component patterns
- Styling guidelines
- Error handling
- Naming conventions
- **[Read Full Guide →](./coding-standards.md)**

### [Testing Guide](./testing.md)
Writing and running tests.
- Testing setup with Vitest
- Component testing
- Hook testing
- Mocking
- Best practices
- **[Read Full Guide →](./testing.md)**

### [Git Workflow](./git-workflow.md)
How to use Git and create pull requests.
- Branch strategy
- Commit guidelines
- Pull request process
- Code review
- Merging and deployment
- **[Read Full Guide →](./git-workflow.md)**

## Development Checklist

### Before Starting Work

- [ ] Install Node.js 18+ (20+ recommended)
- [ ] Clone the repository
- [ ] Install dependencies: `npm install`
- [ ] Copy environment file: `cp .env.local.example .env.local`
- [ ] Fill in environment variables
- [ ] Start dev server: `npm run dev`

### While Developing

- [ ] Create feature branch
- [ ] Follow coding standards
- [ ] Write tests as you go
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm test`
- [ ] Build locally: `npm run build`

### Before Submitting PR

- [ ] All tests passing: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint:fix`
- [ ] Type checking passes: `npm run type-check`
- [ ] No console errors or warnings
- [ ] Documentation updated
- [ ] Commit message follows conventions

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Quality
npm run lint            # Check code style
npm run lint:fix        # Auto-fix code style
npm run type-check      # Check TypeScript types

# Testing
npm test                # Run tests once
npm run test:watch      # Watch mode
npm run test:ui         # UI test dashboard

# Database
npm run db:migrate:dev  # Run migrations (dev)
```

## Development Workflow Example

```bash
# 1. Start
git checkout main
git pull origin main
git checkout -b feature/my-feature

# 2. Develop
npm run dev
# ... write code ...
npm test
npm run lint:fix

# 3. Commit
git add .
git commit -m "feat: my feature"
git push origin feature/my-feature

# 4. Create PR on GitHub

# 5. Review and merge
# ... review process ...

# 6. Deploy happens automatically
```

## Directory Structure

Key development directories:

```
components/       React components
hooks/           Custom React hooks
lib/             Utilities and helpers
app/             Next.js pages/routes
public/          Static assets
docs/            Documentation
tests/           Integration tests
.github/         CI/CD workflows
```

See [App Structure](../architecture/app-structure.md) for complete structure.

## Tools & Technologies

### Frontend
- **Next.js** - React framework
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing

### Development
- **VS Code** - IDE (recommended)
- **npm** - Package manager
- **Git** - Version control

### Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

## Learning Resources

### Getting Started
1. [Setup Dev Environment](./setup-dev-env.md) - First time setup
2. [Coding Standards](./coding-standards.md) - Code style
3. [Testing Guide](./testing.md) - Writing tests

### Advanced
- [Architecture Overview](../architecture/overview.md) - System design
- [Adding Features Guide](../guides/adding-features.md) - Feature development
- [API Endpoints](../api/endpoints.md) - Backend endpoints

## Common Development Tasks

### Add a new component
→ Follow [Coding Standards](./coding-standards.md) → Components section

### Write tests
→ Follow [Testing Guide](./testing.md)

### Create a feature
→ Follow [Adding Features Guide](../guides/adding-features.md)

### Fix a bug
→ Check [Git Workflow](./git-workflow.md) → Creating a fix branch

### Review code
→ Check [Coding Standards](./coding-standards.md) → Code Review Checklist

## Troubleshooting

### Tests won't run
→ Check [Common Issues](../troubleshooting/common-issues.md) → Testing Issues

### Build failing
→ Check [Common Issues](../troubleshooting/common-issues.md) → Build Issues

### Git problems
→ Check [Git Workflow](./git-workflow.md) → Troubleshooting

## Best Practices

1. **Commit frequently** with clear messages
2. **Write tests** before or as you code
3. **Run linter** before committing
4. **Follow conventions** for consistency
5. **Test locally** before pushing
6. **Keep branches focused** on one feature
7. **Write clear PRs** with description

## Related Documentation

- **[Architecture](../architecture/)** - System design
- **[Contributing](../../CONTRIBUTING.md)** - Overall contribution guidelines
- **[Troubleshooting](../troubleshooting/)** - Common issues
