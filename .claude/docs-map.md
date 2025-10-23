# Documentation Map

Quick navigation guide for all Locomotive House documentation.

## Start Here

- **[Architecture Overview](../ARCHITECTURE.md)** - System design and high-level overview
- **[Getting Started](../docs/getting-started/installation.md)** - Setup and installation
- **[Contributing](../CONTRIBUTING.md)** - How to contribute to the project

## Feature Documentation

### User Features
- **[Appointments](../docs/features/appointments.md)** - Create and manage appointments
- **[Addresses](../docs/features/addresses.md)** - Manage service locations
- **[Club Management](../docs/features/club-management.md)** - Organize users into clubs
- **[Authentication](../docs/features/authentication.md)** - How user auth works
- **[Admin Features](../docs/features/admin-features.md)** - Admin-only capabilities

## Architecture & Design

- **[System Architecture](../docs/architecture/overview.md)** - Tech stack and design
- **[Club-Based Routing](../docs/architecture/club-based-routing.md)** - Routing system and access control
- **[App Structure](../docs/architecture/app-structure.md)** - Directory organization
- **[Custom Hooks](../docs/architecture/hooks.md)** - Reusable React hooks
- **[Components](../docs/architecture/components.md)** - Component reference

## Development

### Setup
- **[Installation](../docs/getting-started/installation.md)** - Install dependencies
- **[Environment Setup](../docs/getting-started/environment.md)** - Configure environment
- **[First Run](../docs/getting-started/first-run.md)** - First time setup

### Development Guidelines
- **[Dev Environment Setup](../docs/development/setup-dev-env.md)** - IDE and tools
- **[Coding Standards](../docs/development/coding-standards.md)** - Code style
- **[Testing Guide](../docs/development/testing.md)** - Writing tests
- **[Git Workflow](../docs/development/git-workflow.md)** - Git best practices

## Deployment & DevOps

- **[Cloudflare Deployment](../docs/deployment/cloudflare.md)** - Deploy to Cloudflare Workers
- **[Environments](../docs/deployment/environments.md)** - Dev/Staging/Production
- **[CI/CD Pipeline](../docs/deployment/ci-cd.md)** - Automated testing and deployment

## Troubleshooting

- **[Common Issues](../docs/troubleshooting/common-issues.md)** - FAQ and solutions

## Guides

- **[Adding Features](../docs/guides/adding-features.md)** - Step-by-step feature development

## API Reference

- **[API Endpoints](../docs/api/endpoints.md)** - Complete endpoint reference

## By Task

### "I want to..."

| Goal | Go To |
|------|-------|
| Set up development environment | [Dev Environment Setup](../docs/development/setup-dev-env.md) |
| Add a new feature | [Adding Features Guide](../docs/guides/adding-features.md) |
| Write tests | [Testing Guide](../docs/development/testing.md) |
| Deploy to production | [Cloudflare Deployment](../docs/deployment/cloudflare.md) |
| Understand the codebase | [Architecture Overview](../docs/architecture/overview.md) |
| Fix a bug | [Coding Standards](../docs/development/coding-standards.md) |
| Create a pull request | [Git Workflow](../docs/development/git-workflow.md) |
| Use appointments feature | [Appointments](../docs/features/appointments.md) |
| Manage addresses | [Addresses](../docs/features/addresses.md) |
| Access admin features | [Admin Features](../docs/features/admin-features.md) |
| Debug a problem | [Common Issues](../docs/troubleshooting/common-issues.md) |

## Directory Structure

```
docs/
├── README.md                          # Docs overview
├── getting-started/
│   ├── installation.md                # Install dependencies
│   ├── environment.md                 # Configure environment
│   └── first-run.md                   # First time setup
├── architecture/
│   ├── overview.md                    # System architecture
│   ├── club-based-routing.md          # Routing system
│   ├── app-structure.md               # Directory organization
│   ├── hooks.md                       # Custom hooks
│   └── components.md                  # Components reference
├── features/
│   ├── appointments.md                # Appointments feature
│   ├── addresses.md                   # Addresses feature
│   ├── club-management.md             # Clubs
│   ├── authentication.md              # Authentication
│   └── admin-features.md              # Admin features
├── development/
│   ├── setup-dev-env.md               # IDE setup
│   ├── coding-standards.md            # Code style
│   ├── testing.md                     # Testing
│   └── git-workflow.md                # Git
├── deployment/
│   ├── cloudflare.md                  # Deploy backend
│   ├── environments.md                # Dev/Staging/Prod
│   └── ci-cd.md                       # CI/CD
├── troubleshooting/
│   └── common-issues.md               # FAQ
├── guides/
│   └── adding-features.md             # Add features
└── api/
    └── endpoints.md                   # API reference

ARCHITECTURE.md                        # High-level architecture
CONTRIBUTING.md                        # Contributing guide
README.md                              # Project overview
```

## Search Tips

Use Cmd+F (or Ctrl+F) to search within documents for:
- Keywords: "authentication", "deployment", "testing"
- API endpoint names: "/appointments", "/addresses"
- Component names: "ClubGuard", "AppointmentCard"
- Error messages: "Club Assignment Required"

## Documentation Conventions

- **Bold** = Emphasis or important
- `Code` = Code snippets or files
- > Blockquote = Tips or important notes
- ### Heading = Section

## Feedback

To improve documentation:
1. Open an issue on GitHub
2. Suggest improvements
3. Submit documentation PRs
4. Report broken links or outdated info

## Related Resources

- **GitHub Repository**: https://github.com/yourname/locomotiveHouseV4UI
- **Clerk Documentation**: https://clerk.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
