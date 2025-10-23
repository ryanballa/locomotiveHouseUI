# Deployment

How to deploy Locomotive House to different environments.

## Deployment Overview

Locomotive House is deployed to:
- **Development**: Local machine
- **Staging**: Cloud (for testing)
- **Production**: Cloud (live users)

## Quick Links

### [Cloudflare Deployment](./cloudflare.md)
Deploy the backend API to Cloudflare Workers.
- Initial setup
- Deploying to production/staging
- Custom domains
- Monitoring
- **[Read Full Guide →](./cloudflare.md)**

### [Environment Management](./environments.md)
Manage development, staging, and production environments.
- Environment setup
- Environment variables
- Database management per environment
- Secrets management
- **[Read Full Guide →](./environments.md)**

### [CI/CD Pipeline](./ci-cd.md)
Automated testing and deployment with GitHub Actions.
- Setting up workflows
- Running tests automatically
- Automated deployment
- Monitoring deployments
- **[Read Full Guide →](./ci-cd.md)**

## Deployment Process

### Standard Workflow

```
1. Push Code to GitHub
        ↓
2. GitHub Actions Runs Tests
        ↓
3. Tests Pass?
   ├─ Yes: Continue
   └─ No: Block deployment
        ↓
4. Create Pull Request
        ↓
5. Code Review
        ↓
6. Merge to Main
        ↓
7. Automatic Deployment to Production
        ↓
8. Monitor for Issues
```

### Manual Deployment

```bash
# Frontend
npm run build
# Deploy to hosting (Vercel, Netlify, etc.)

# Backend
wrangler deploy --env production
```

## Environments

### Development
- **Location**: Local machine
- **Database**: Local or dev
- **Access**: Developer only
- **Deploy**: Manual (`npm run dev`)
- **Testing**: All types

### Staging
- **Location**: Cloud
- **Database**: Staging database
- **Access**: Team + clients
- **Deploy**: Automatic from `develop` branch
- **Testing**: Integration tests, QA

### Production
- **Location**: Cloud
- **Database**: Production database
- **Access**: Public/live users
- **Deploy**: Automatic from `main` branch (after PR)
- **Testing**: Smoke tests, monitoring

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Database migrations tested in staging
- [ ] Environment variables configured
- [ ] Backups taken
- [ ] Team notified

## Deployment Destinations

### Frontend
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Custom hosting

### Backend
- **Cloudflare Workers** (recommended)
- AWS Lambda
- Google Cloud Functions
- Heroku

### Database
- **Neon.tech** (recommended)
- AWS RDS
- Google Cloud SQL
- DigitalOcean

## Key Commands

### Deploy Backend

```bash
# Staging
wrangler deploy --env staging

# Production
wrangler deploy --env production
```

### Deploy Frontend

Depends on hosting provider:
```bash
# Vercel
vercel deploy --prod

# Netlify
netlify deploy --prod

# Manual
npm run build
# Upload build/ directory
```

### Check Deployment Status

```bash
# View logs
wrangler tail --env production

# Check CloudFlare dashboard
# Check hosting provider dashboard
```

## Rollback Procedure

If deployment goes wrong:

```bash
# Rollback backend
wrangler rollback --env production

# Rollback frontend
# Use hosting provider's rollback feature

# Restore database (if needed)
# Use database provider's backup restore
```

## Monitoring Deployments

### Real-Time Logs
```bash
wrangler tail --env production
```

### Analytics
1. Cloudflare dashboard - API analytics
2. Hosting provider dashboard - Frontend analytics
3. Application monitoring - Error tracking

### Alerts
Set up alerts for:
- High error rate
- High latency
- Service downtime
- Failed deployments

## Cost Optimization

### Frontend
- Use CDN
- Enable caching
- Optimize images
- Minify code

### Backend
- Use free tier limits efficiently
- Cache with KV
- Optimize database queries
- Monitor usage

### Database
- Use shared database for staging
- Archive old data
- Use indexes effectively

## Security in Production

### Before Deploying
- [ ] Secrets configured in platform
- [ ] CORS headers correct
- [ ] Authentication working
- [ ] No hardcoded secrets in code
- [ ] Security headers set

### After Deploying
- [ ] Monitor error logs
- [ ] Check authentication flow
- [ ] Verify API responses
- [ ] Test critical paths

## Database Migrations

### Development
```bash
npm run db:migrate:dev
```

### Staging
```bash
npm run db:migrate:staging
```

### Production
```bash
# Backup first!
npm run db:migrate:production
```

## Version Control

### Tag Releases
```bash
# Tag version
git tag v1.0.0

# Push tags
git push origin v1.0.0
```

### Track Deployments
```bash
# View deployment history
git log --oneline -10

# See what was deployed
git diff v1.0.0 v1.0.1
```

## Troubleshooting Deployments

### Deployment Failed
1. Check GitHub Actions logs
2. Check deployment provider logs
3. Verify environment variables
4. Check database connectivity

### After Deployment Issues
1. Check error logs: `wrangler tail`
2. Test API manually
3. Check database for issues
4. Rollback if critical

### Performance Issues Post-Deploy
1. Check Cloudflare analytics
2. Check database performance
3. Review recent code changes
4. Check for errors in logs

## Related Documentation

- **[Cloudflare Workers](./cloudflare.md)** - Backend deployment
- **[CI/CD Pipeline](./ci-cd.md)** - Automated deployment
- **[Environments](./environments.md)** - Environment configuration
- **[Architecture](../architecture/)** - System design
- **[Troubleshooting](../troubleshooting/)** - Common issues
