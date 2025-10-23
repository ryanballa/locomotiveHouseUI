# Setting Up Your Development Environment

Configure your development tools and environment for optimal productivity.

## IDE Setup

### Visual Studio Code (Recommended)

#### Installation

1. Download from [https://code.visualstudio.com](https://code.visualstudio.com)
2. Install the application
3. Open the project folder: `File → Open Folder`

#### Recommended Extensions

Install these extensions for better development experience:

```
esbenp.prettier-vscode          # Code formatter
dbaeumer.vscode-eslint          # Linting
bradlc.vscode-tailwindcss       # Tailwind CSS IntelliSense
Vue.volar                        # TypeScript support
ms-vscode.vscode-typescript-next # Latest TS version
```

#### Settings

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

#### Launch Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Other IDEs

- **WebStorm**: Open project, install recommended plugins
- **Neovim**: Configure TypeScript LSP
- **Vim**: Use TypeScript plugins

## Node.js Setup

### Version

Required: Node.js 18+ (20+ recommended)

### Check Version

```bash
node --version
npm --version
```

### Install NVM (Node Version Manager)

Recommended for managing multiple Node versions:

```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Then close and reopen terminal
nvm install 20
nvm use 20
```

### Verify Installation

```bash
node --version  # Should be v20.x or higher
npm --version   # Should be 10.x or higher
```

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/locomotiveHouseV4UI.git
cd locomotiveHouseV4UI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy example env file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Clerk keys and API URL.

### 4. Verify Setup

```bash
npm run build
```

Should complete without errors.

## Development Workflow

### Starting Development Server

```bash
npm run dev
```

Access at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint      # Check for issues
npm run lint:fix  # Auto-fix issues
```

### Type Checking

```bash
npm run type-check
```

### Testing

```bash
npm test          # Run tests once
npm run test:watch # Watch mode for active development
npm run test:ui   # UI test dashboard
```

## Git Workflow

### Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `test/description` - Tests
- `refactor/description` - Code refactoring
- `chore/description` - Maintenance

### Commit Changes

```bash
git add .
git commit -m "feat: short description"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/).

### Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create PR on GitHub.

## Debugging

### Browser DevTools

1. Open DevTools: `F12` or `Cmd+Option+I`
2. Check Console for errors
3. Use Network tab to see API requests
4. Use Sources to set breakpoints

### VS Code Debugging

Use the launch configuration to debug with breakpoints:

1. Set breakpoint in code (click line number)
2. Run debugger: `Ctrl+Shift+D`
3. Select "Next.js" configuration
4. Click play button
5. Trigger breakpoint

### Debugging with console.log

```typescript
// ✓ Good: Clear labels
console.log('User data:', userData);
console.error('Failed to fetch:', error);
console.warn('Deprecated API used');

// ✗ Avoid
console.log(userData);
console.log('debug1');
```

## Performance Monitoring

### Build Size

Check bundle size:

```bash
npm run build
# Check .next/static folder size
```

### Runtime Performance

Use Chrome DevTools:
1. Performance tab
2. Record user interaction
3. Analyze performance metrics

## Environment Variables for Development

### Required

```env
# Clerk authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# API
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Optional (for advanced development)

```env
# Enable verbose logging
DEBUG=*

# Custom port
PORT=3001

# Use different API
NEXT_PUBLIC_API_URL=https://staging-api.example.com
```

## Docker Development (Optional)

### Build Docker Image

```bash
docker build -t locomotive-house .
```

### Run Container

```bash
docker run -p 3000:3000 -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx locomotive-house
```

## Troubleshooting Setup

### "Module not found" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use

```bash
# Use different port
npm run dev -- -p 3001
```

### TypeScript errors after setup

```bash
npm run type-check
npm run build
```

### Node version mismatch

```bash
nvm install 20
nvm use 20
npm install
```

## Recommended Workflow

1. **Morning**: Update code
   ```bash
   git pull origin main
   npm install  # if dependencies changed
   ```

2. **During development**: Run dev server
   ```bash
   npm run dev
   # Keep running in background
   ```

3. **While coding**: Lint as you go
   ```bash
   npm run lint:fix
   ```

4. **Before committing**: Run full checks
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

5. **Creating PR**: Follow commit conventions
   ```bash
   git commit -m "feat: description"
   git push origin feature/name
   ```

## Productivity Tips

### 1. Use npm scripts

All common commands are in `package.json`:
```bash
npm run          # List all scripts
npm run dev      # Development
npm run build    # Production build
npm test         # Run tests
npm run lint     # Check code style
```

### 2. Format on save

Configure VS Code to auto-format with Prettier.

### 3. Use Git branches

Always work in feature branches, never directly on main.

### 4. Commit frequently

Small, logical commits are easier to review and debug.

### 5. Read error messages

Error messages usually tell you exactly what's wrong.

## Related Documentation

- [Coding Standards](./coding-standards.md) - Code style and conventions
- [Testing Guide](./testing.md) - Writing and running tests
- [Git Workflow](./git-workflow.md) - Git best practices
- [Debugging Guide](./debugging.md) - Advanced debugging techniques
