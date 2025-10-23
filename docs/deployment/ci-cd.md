# CI/CD Pipeline

Automated testing and deployment with GitHub Actions.

## Overview

The CI/CD pipeline automatically:
- Runs tests on every commit
- Checks code quality
- Builds the application
- Deploys to staging/production

## GitHub Actions Workflows

### Continuous Integration (ci.yml)

Runs on every push and pull request.

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

### Deploy Workflow (deploy.yml)

Deploys to staging on develop, production on main.

```yaml
name: Deploy

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Cloudflare
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            npm run deploy:prod
          else
            npm run deploy:staging
          fi
```

## Setting Up CI/CD

### 1. GitHub Secrets

Store sensitive values in GitHub:

1. Go to Settings → Secrets → Actions
2. Add secrets:
   - `CLOUDFLARE_API_TOKEN` - Cloudflare API token
   - `CLERK_SECRET_KEY` - Clerk secret key
   - `DATABASE_URL` - Database connection string

### 2. Configure Workflows

Create `.github/workflows/` directory with YAML files.

### 3. Protect Main Branch

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Require:
   - Pull request reviews
   - Status checks pass
   - No dismiss of stale pull reviews
   - Restrict who can push

## Typical Workflow

### 1. Push to Feature Branch

```bash
git push origin feature/my-feature
```

GitHub Actions automatically:
- Runs linter
- Runs type checker
- Runs tests
- Builds application

### 2. Create Pull Request

Open PR on GitHub with results showing:
- ✅ All checks passed
- ❌ Some checks failed (fix before merging)

### 3. Code Review

Team reviews code, suggests changes.

### 4. Merge to Main

Once approved and all checks pass:
- Click "Merge pull request"
- GitHub automatically deploys to production

## Deployment Strategies

### Basic: Manual Trigger

```yaml
on: workflow_dispatch

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run deploy
```

Deploy manually from Actions tab.

### Branch-Based: Auto Deploy

```yaml
on:
  push:
    branches:
      - main       # Deploy to production
      - staging    # Deploy to staging
      - develop    # Deploy to development
```

### Protected: Approval Required

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]

jobs:
  deploy:
    if: github.event.workflow_run.conclusion == 'success'
    environment: production
    runs-on: ubuntu-latest
    steps:
      - run: npm run deploy:prod
```

Requires manual approval in GitHub UI.

## Monitoring Deployments

### View Workflow Results

1. Go to repository
2. Click "Actions" tab
3. View workflow runs with status:
   - ✅ Success
   - ❌ Failed
   - ⏳ In progress

### View Logs

Click workflow run to see detailed logs:
```
Setup Node.js 20
Install dependencies
Run linter
Run tests
Build application
Deploy to production
```

### Notifications

Configure GitHub to notify:
- Failed deployments
- Review requests
- Pull request comments

## Secrets Management

### Using Secrets in Workflows

```yaml
- name: Deploy
  env:
    CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npm run deploy
```

### Types of Secrets

**Repository Secrets**: Shared across all workflows
**Environment Secrets**: Specific to deployment environment
**Organization Secrets**: Shared across repositories

### Best Practices

- Never log secrets
- Rotate secrets regularly
- Use minimal permissions
- Use different secrets per environment

## Caching

Speed up workflows with caching:

```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

Subsequent runs reuse cached dependencies.

## Conditional Workflows

Run different steps based on conditions:

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: npm run deploy:prod

- name: Deploy to staging
  if: github.ref == 'refs/heads/develop'
  run: npm run deploy:staging

- name: Notify team
  if: failure()
  run: echo "Deployment failed"
```

## Creating Release Workflows

Example: Release workflow on version tag

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build
        run: npm run build

      - name: Deploy to production
        run: npm run deploy:prod

      - name: Create release notes
        run: |
          gh release create ${{ github.ref_name }} \
            --generate-notes \
            --draft
```

Deploy when tags are pushed.

## Testing in CI/CD

### Run Tests

```yaml
- name: Run tests
  run: npm test -- --coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

### Test Reports

Generate and upload reports:

```yaml
- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results.xml
```

## Docker in CI/CD

Build and push Docker images:

```yaml
- name: Build Docker image
  run: docker build -t myapp:${{ github.sha }} .

- name: Push to registry
  run: |
    docker tag myapp:${{ github.sha }} myapp:latest
    docker push myapp:latest
```

## Rollback in CI/CD

Automatically rollback on failure:

```yaml
- name: Deploy
  id: deploy
  run: npm run deploy:prod

- name: Rollback on failure
  if: failure()
  run: |
    wrangler rollback --env production
    echo "Deployment failed, rolled back"
```

## Performance

### Optimize Workflow Time

1. **Parallel Jobs**
   ```yaml
   jobs:
     test:
       runs-on: ubuntu-latest
       steps: [...]

     lint:
       runs-on: ubuntu-latest
       steps: [...]
   ```
   Both run simultaneously.

2. **Cache Dependencies**
   Saves 30-60 seconds per build.

3. **Skip Unnecessary Checks**
   ```yaml
   if: "!contains(github.event.head_commit.message, '[skip ci]')"
   ```

### Typical Timing

- Install: 30-60 seconds
- Lint: 10-20 seconds
- Tests: 30-120 seconds
- Build: 30-60 seconds
- Deploy: 20-60 seconds

Total: 2-5 minutes per workflow

## Troubleshooting CI/CD

### Workflow Not Running

1. Check `.github/workflows/` files exist
2. Check YAML syntax is correct
3. Check branch rules match

### Deployment Failed

1. View detailed logs in Actions tab
2. Check secrets are configured
3. Check build succeeds locally

### Slow Workflows

1. Enable caching
2. Run jobs in parallel
3. Remove unnecessary steps

## Best Practices

### 1. Keep Workflows Simple

```yaml
# ✓ Good: Clear, focused
- name: Run tests
  run: npm test

# ✗ Avoid: Complex logic
- name: Run tests and other stuff
  run: |
    npm test
    npm lint
    npm type-check
    npm build
    # 20 more lines...
```

### 2. Cache Effectively

```yaml
# ✓ Good: Cache node_modules
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-npm-${{ hashFiles('package-lock.json') }}

# ✗ Avoid: No caching
# Reinstalls dependencies every time
```

### 3. Secure Secrets

```yaml
# ✓ Good: Use GitHub secrets
- run: npm run deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}

# ✗ Avoid: Hardcoding secrets
- run: echo "API_KEY=xyz123" > .env
```

### 4. Document Workflows

```yaml
# Deploy application
# - Runs tests
# - Builds Docker image
# - Pushes to production

name: Deploy Production
```

### 5. Use Status Checks

```yaml
# Prevent merging until checks pass
branch_protection_rules:
  - require_status_checks
  - require_pull_request_reviews
```

## Related Documentation

- [Git Workflow](../development/git-workflow.md) - Git best practices
- [Cloudflare Deployment](./cloudflare.md) - Deploying backend
- [Environments](./environments.md) - Staging vs production
