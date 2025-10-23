# Installation Guide

Get the Locomotive House project up and running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or later ([Download](https://nodejs.org/))
- **npm** 9.x or later (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- A **Clerk account** ([Sign up at clerk.com](https://clerk.com))

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/locomotiveHouseV4UI.git
cd locomotiveHouseV4UI
```

### 2. Install Dependencies

Install all project dependencies using npm:

```bash
npm install
```

This will install all packages listed in `package.json`, including:
- Next.js 15
- React and TypeScript
- Clerk authentication
- Tailwind CSS
- Testing frameworks (Vitest)
- And other development tools

### 3. Verify Installation

Run the following command to verify everything is installed correctly:

```bash
npm run build
```

A successful build output should show:
- ✓ Compiled successfully
- All routes listed without errors
- No TypeScript errors

## Verify Node.js Version

To check your Node.js version:

```bash
node --version
# Should output v18.x.x or later
```

To check npm version:

```bash
npm --version
# Should output 9.x.x or later
```

## Next Steps

Once installation is complete, proceed to:

1. **[Environment Setup](./environment.md)** - Configure environment variables
2. **[First Run](./first-run.md)** - Start the development server
3. **[Development Setup](../development/setup-dev-env.md)** - Configure your dev environment

## Troubleshooting Installation

### Node version mismatch
If you have an older version of Node.js, consider using a version manager:
- **nvm** (macOS/Linux): [https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)
- **nvm-windows** (Windows): [https://github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows)

### npm install fails
Try clearing the npm cache:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Permission errors on macOS/Linux
If you get permission errors, you may need to fix npm permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

## Installation Complete ✓

You've successfully installed the Locomotive House project!

**What's next?**
- Continue to [Environment Setup](./environment.md)
- Or jump to [First Run](./first-run.md)
