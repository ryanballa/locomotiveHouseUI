# Managing Environments

Manage development, staging, and production environments.

## Environment Overview

| Environment | Purpose | Database | URL | Access |
|-----------|---------|----------|-----|--------|
| Development | Local development | Local/Dev | localhost:3000 | Internal |
| Staging | Pre-production testing | Staging DB | staging.example.com | Limited |
| Production | Live users | Production DB | app.example.com | Public |

## Development Environment

### Local Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit with local values
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

### Run Development Server

```bash
npm run dev
```

Runs on `http://localhost:3000`

### Local Database

For development, use local PostgreSQL:

```bash
# Create database
createdb locomotive_house_dev

# Run migrations
npm run db:migrate:dev
```

Or use Docker:

```bash
docker-compose up
```

## Staging Environment

### Purpose

- Test features before production
- Load testing
- Team validation
- Client preview

### Deployment

```bash
# Deploy to staging
wrangler deploy --env staging
```

### Staging Database

Use separate Neon project:

```bash
# .env.staging
DATABASE_URL=postgresql://user:pass@staging-host/db
```

### Staging Domain

Point to staging API:

```env
NEXT_PUBLIC_API_URL=https://api-staging.example.com
```

## Production Environment

### Purpose

- Live user data
- Performance critical
- High availability
- Data backup and recovery

### Deployment

```bash
# Deploy to production
wrangler deploy --env production
```

### Production Database

Separate Neon project with:
- Automated backups
- High availability replicas
- Monitoring and alerts

```bash
# .env.production
DATABASE_URL=postgresql://user:pass@prod-host/db
```

### Production Domain

Primary domain for users:

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

## Environment Variables

### Frontend (.env.local)

```env
# Clerk (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# API (required)
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Optional
DEBUG=false
```

### Backend (wrangler.toml)

```toml
# Development
[env.development]
name = "locomotive-house-api-dev"

[env.development.bindings]
DB_CONNECTION_STRING = "postgresql://localhost/dev_db"

# Staging
[env.staging]
name = "locomotive-house-api-staging"

[env.staging.bindings]
DB_CONNECTION_STRING = "postgresql://staging-host/db"

# Production
[env.production]
name = "locomotive-house-api"

[env.production.bindings]
DB_CONNECTION_STRING = "postgresql://prod-host/db"
```

## Environment-Specific Behavior

### Feature Flags

```typescript
const isDevelopment = env.ENVIRONMENT === 'development';
const isProduction = env.ENVIRONMENT === 'production';

if (isDevelopment) {
  // Show debug info
}
```

### Logging

```typescript
// In development
console.log('Detailed debug info');

// In production
if (env.ENVIRONMENT !== 'production') {
  console.log('Debug info');
}
```

### Error Handling

```typescript
// In development: Show full errors
// In production: Hide sensitive details
const errorMessage = isDevelopment
  ? error.message
  : 'An error occurred';
```

## Secrets Management

### Development Secrets

Store locally in `.env.local` (git ignored):

```bash
# .gitignore
.env.local
.env.*.local
```

### Staging Secrets

Store in Cloudflare:

```bash
wrangler secret put --env staging CLERK_SECRET_KEY
```

### Production Secrets

Store in Cloudflare:

```bash
wrangler secret put --env production CLERK_SECRET_KEY
wrangler secret put --env production DATABASE_URL
```

## Database Migrations

### Development

```bash
# Create migration
npm run db:migrate:create "add_column_x"

# Run migrations
npm run db:migrate:dev

# Rollback
npm run db:migrate:rollback
```

### Staging

```bash
# Run migrations on staging database
npm run db:migrate:staging
```

### Production

```bash
# Run migrations on production database
# Usually done with deployment
npm run db:migrate:production
```

## Monitoring Environments

### Development

Local logging:
```bash
npm run dev
# Check terminal output
```

### Staging

Cloudflare logs:
```bash
wrangler tail --env staging
```

### Production

Cloudflare logs:
```bash
wrangler tail --env production
```

Production monitoring dashboard:
1. Go to Cloudflare dashboard
2. Workers → Logs
3. View real-time requests

## Backup and Recovery

### Development

Local database:
```bash
# Backup
pg_dump localhost:dev_db > backup.sql

# Restore
psql localhost:dev_db < backup.sql
```

### Staging/Production

Neon automatic backups:
1. Go to Neon dashboard
2. Database → Backups
3. View/restore backups

## Environment Promotion

Typical workflow:

```
Development → Staging → Production

Feature completed in dev
         ↓
Deploy to staging for testing
         ↓
QA validation in staging
         ↓
Deploy to production
         ↓
Monitor production
```

### Promoting Code

```bash
# Test in staging first
wrangler deploy --env staging

# After validation, deploy to production
wrangler deploy --env production
```

### Promoting Database

```bash
# Backup production first
# Create snapshot in Neon dashboard

# Run migrations on staging
npm run db:migrate:staging

# Validate in staging

# Run migrations on production
npm run db:migrate:production
```

## Testing Across Environments

### Test Plan

1. **Development**
   - Manual feature testing
   - Integration testing
   - Browser DevTools

2. **Staging**
   - Full feature testing
   - Load testing
   - Client validation
   - Team review

3. **Production**
   - Smoke tests
   - Critical path testing
   - Monitor real users

## Performance Across Environments

### Compare Performance

Development (local):
```bash
npm run build
npm run start
# Use DevTools to profile
```

Staging (remote):
```bash
# Deploy to staging
# Use Cloudflare analytics
# Run load tests
```

Production (live):
```bash
# Monitor real user metrics
# View Cloudflare analytics
# Check Core Web Vitals
```

## Rollback Procedure

### If Production Breaks

1. **Immediate Action**
   ```bash
   # Rollback to previous version
   wrangler rollback --env production
   ```

2. **Database Rollback**
   - If needed, restore from backup in Neon
   - Run previous migrations

3. **Notify Team**
   - Document incident
   - Post-mortem analysis

4. **Fix in Development**
   - Test thoroughly in staging
   - Re-deploy when fixed

## Best Practices

### 1. Test Before Production

```bash
# Always test in staging first
wrangler deploy --env staging
# Validate thoroughly

# Then deploy to production
wrangler deploy --env production
```

### 2. Keep Environments in Sync

```bash
# Code should be identical
# Only environment variables differ

# Test migrations on staging first
npm run db:migrate:staging
# Then production
npm run db:migrate:production
```

### 3. Monitor All Environments

- Development: Local logs
- Staging: Cloudflare logs + manual testing
- Production: Monitoring + real-time logs

### 4. Document Changes

```bash
# Clear commit messages
git commit -m "fix: resolve issue in production"

# Document migrations
# Document configuration changes
```

### 5. Automate Everything

Use CI/CD for:
- Running tests
- Deploying to staging
- Deploying to production (with approval)

## Related Documentation

- [Cloudflare Deployment](./cloudflare.md) - Deploy to Cloudflare Workers
- [CI/CD Deployment](./ci-cd.md) - Automated deployments
- [Troubleshooting](../troubleshooting/common-issues.md) - Environment-specific issues
