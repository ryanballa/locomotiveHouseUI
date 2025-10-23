# Locomotive House Documentation

Welcome to the comprehensive documentation for the Locomotive House application. This documentation covers everything from initial setup to advanced features and deployment.

## Quick Navigation

### 🚀 Getting Started
- [Installation](./getting-started/installation.md) - Set up the project locally
- [Environment Setup](./getting-started/environment.md) - Configure environment variables
- [First Run](./getting-started/first-run.md) - Get up and running

### 🏗️ Architecture
- [System Overview](./architecture/overview.md) - High-level architecture and tech stack
- [App Structure](./architecture/app-structure.md) - Directory and file organization
- [Club-Based Routing](./architecture/club-based-routing.md) - Understanding the club architecture
- [Custom Hooks](./architecture/hooks.md) - Reusable hooks documentation
- [Guard Components](./architecture/components.md) - Permission and requirement guards

### ✨ Features
- [Club Management](./features/club-management.md) - Club assignment and management
- [Appointments](./features/appointments.md) - Appointment creation and management
- [Addresses](./features/addresses.md) - Address management system
- [Authentication](./features/authentication.md) - User authentication and registration
- [Admin Features](./features/admin-features.md) - Admin capabilities and club management

### 🔌 API Integration
- [API Overview](./api/overview.md) - API client and integration
- [Authentication](./api/authentication.md) - API authentication and tokens
- [Endpoints](./api/endpoints.md) - Available endpoints and usage
- [Webhooks](./api/webhooks.md) - Webhook configuration

### 👨‍💻 Development
- [Development Environment](./development/setup-dev-env.md) - Setting up your dev environment
- [Coding Standards](./development/coding-standards.md) - Code style and patterns
- [Testing](./development/testing.md) - Testing practices and running tests
- [Git Workflow](./development/git-workflow.md) - Git and GitHub workflow
- [Debugging](./development/debugging.md) - Debugging techniques and tools

### 🚢 Deployment
- [Cloudflare Deployment](./deployment/cloudflare.md) - Deploying to Cloudflare Workers
- [Environments](./deployment/environments.md) - Development, staging, and production
- [CI/CD](./deployment/ci-cd.md) - GitHub Actions and automated deployments

### ❓ Troubleshooting
- [Common Issues](./troubleshooting/common-issues.md) - Solutions to common problems
- [CORS Errors](./troubleshooting/cors-errors.md) - Fixing CORS issues
- [Authentication Errors](./troubleshooting/auth-errors.md) - Authentication troubleshooting
- [Performance](./troubleshooting/performance.md) - Performance optimization

### 📚 How-To Guides
- [Adding Features](./guides/adding-features.md) - Guide to adding new features
- [Database Migrations](./guides/database-migrations.md) - Managing database changes
- [Security](./guides/security.md) - Security best practices

## Project Overview

**Locomotive House** is a Next.js application for managing appointments, addresses, and club memberships with secure authentication powered by Clerk.

### Key Features
- ✅ Club-based resource management
- ✅ Appointment scheduling and management
- ✅ Address management with club ownership
- ✅ Secure user authentication (Clerk)
- ✅ Admin dashboard for club management
- ✅ Role-based access control

### Tech Stack
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Authentication**: Clerk.js
- **State Management**: React Hooks
- **API Client**: Fetch API with custom client
- **Testing**: Vitest
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Workers (API), Vercel (Frontend)

## Common Tasks

### I want to...

- **Add a new feature** → See [Adding Features](./guides/adding-features.md)
- **Set up my dev environment** → See [Development Environment](./development/setup-dev-env.md)
- **Understand the architecture** → See [System Overview](./architecture/overview.md)
- **Deploy the application** → See [Cloudflare Deployment](./deployment/cloudflare.md)
- **Fix a bug** → See [Troubleshooting](./troubleshooting/common-issues.md)
- **Understand the club system** → See [Club-Based Routing](./architecture/club-based-routing.md)
- **Work with the API** → See [API Overview](./api/overview.md)
- **Write tests** → See [Testing](./development/testing.md)

## Contributing

Please read [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on how to contribute to this project.

## Getting Help

- Check the [Troubleshooting](./troubleshooting/common-issues.md) section
- Review [Architecture](./architecture/overview.md) for system understanding
- Check existing GitHub issues
- Contact the development team

## Documentation Standards

This documentation follows Cursor/Claude Code standards:
- Clear, concise explanations
- Code examples where relevant
- Links to related documentation
- Regular updates as features change
- Organized by topic and use case
