# Deploying to Cloudflare Workers

Deploy the Locomotive House backend API to Cloudflare Workers.

## Prerequisites

- Cloudflare account with Workers subscription
- Wrangler CLI installed (`npm install -g wrangler`)
- PostgreSQL database (Neon recommended)
- Clerk API keys

## Initial Setup

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler auth
```

This opens browser to authenticate. After authentication, your credentials are saved.

### 3. Create Worker Project

If you don't already have a Worker project:

```bash
wrangler init my-api
cd my-api
```

### 4. Configure wrangler.toml

```toml
name = "locomotive-house-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Routes
routes = [
  { pattern = "api.example.com/*", zone_id = "abc123" }
]

# Environment
env = "production"

# Database bindings
[env.production.bindings]
DB_CONNECTION_STRING = "postgresql://user:pass@host/db"

# KV bindings (if using)
[[kv_namespaces]]
binding = "CACHE"
id = "abc123"
```

### 5. Set Environment Variables

```bash
wrangler secret put CLERK_SECRET_KEY
# Paste your Clerk secret key

wrangler secret put DATABASE_URL
# Paste your database URL
```

View secrets:
```bash
wrangler secret list
```

## Deploying

### Deploy to Production

```bash
wrangler deploy
```

### Deploy to Staging

Create staging environment in `wrangler.toml`:

```toml
[env.staging]
name = "locomotive-house-api-staging"

[env.staging.bindings]
DB_CONNECTION_STRING = "postgresql://staging-db"
```

Deploy:
```bash
wrangler deploy --env staging
```

### Deployment Output

After successful deployment, you'll see:

```
 ✓ Uploaded locomotive-house-api (0.45 sec)
   Deployed to https://locomotive-house-api.workers.dev
```

## Testing Deployment

### Test API Endpoint

```bash
# Test healthcheck
curl https://locomotive-house-api.workers.dev/health

# Test authenticated endpoint
curl https://locomotive-house-api.workers.dev/api/appointments \
  -H "Authorization: Bearer $TOKEN"
```

### View Logs

```bash
# Real-time logs
wrangler tail

# Tail specific environment
wrangler tail --env production
```

### Debugging

```bash
# Deploy with verbose logging
wrangler deploy --verbose

# Test locally first
wrangler dev
```

## Database Connection

### Neon Database

Neon provides serverless PostgreSQL ideal for Cloudflare Workers.

#### Connection String Format

```
postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

#### Setting Up

1. Create Neon account at [neon.tech](https://neon.tech)
2. Create new project and database
3. Copy connection string
4. Store in environment variable

```bash
wrangler secret put DATABASE_URL
# Paste: postgresql://...
```

### Connection Pooling

For best performance with Workers (many concurrent connections):

```typescript
import { Client } from '@neon/serverless';

const client = new Client({
  connectionString: env.DATABASE_URL,
});

await client.connect();
// Use client
await client.end();
```

## Environment Variables

### Required

```bash
# Clerk authentication
CLERK_SECRET_KEY=sk_test_xxxxx

# Database
DATABASE_URL=postgresql://user:pass@host/db

# API configuration
API_DOMAIN=https://api.example.com
```

### Setting Variables

```bash
# Secrets (sensitive data)
wrangler secret put CLERK_SECRET_KEY

# Variables (public data)
wrangler secret put DATABASE_URL  # Actually secret
```

## Custom Domain

### Point Domain to Cloudflare

1. Update domain DNS to use Cloudflare nameservers
2. In Cloudflare dashboard, add your zone

### Configure Custom Domain

In `wrangler.toml`:

```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### Deploy to Custom Domain

```bash
wrangler deploy
```

Your API is now at: `https://api.yourdomain.com`

## Monitoring

### View Worker Analytics

1. Go to Cloudflare dashboard
2. Navigate to Workers
3. Select your worker
4. View Analytics tab

Shows:
- Requests per day
- Errors and error rates
- CPU milliseconds used
- Response status distribution

### Tail Logs in Real-Time

```bash
wrangler tail
```

Shows live logs from your worker:

```
[2025-10-24T14:23:45Z] GET /api/appointments 200
[2025-10-24T14:23:46Z] GET /api/appointments/123 200
[2025-10-24T14:23:47Z] POST /api/appointments 201
```

### Set Up Alerts

In Cloudflare dashboard:
1. Workers Analytics Engine
2. Create alert for:
   - High error rate
   - High latency
   - Unusual traffic

## Performance Optimization

### Caching

Use Cloudflare KV for caching:

```typescript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cache_key = url.pathname;

    // Check cache
    const cached = await env.CACHE.get(cache_key);
    if (cached) return new Response(cached);

    // Fetch from database
    const response = await fetchData();

    // Store in cache for 5 minutes
    await env.CACHE.put(cache_key, response, { expirationTtl: 300 });

    return response;
  }
};
```

### Minimize Cold Starts

- Keep handler functions small
- Avoid heavy initialization
- Defer non-critical work

### Database Query Optimization

- Use indexes on frequently queried columns
- Limit result sets with pagination
- Use connection pooling

## Rollback

### Rollback to Previous Version

Cloudflare automatically keeps recent versions. To rollback:

1. Go to Cloudflare dashboard
2. Workers → Your worker → Deployments
3. Click "Rollback" on previous version

Or via CLI:

```bash
wrangler rollback
```

## Monitoring Database

### Query Performance

View slow queries in Neon:

```sql
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 1000  -- Queries over 1 second
ORDER BY mean_time DESC;
```

### Connection Count

```sql
SELECT count(*) FROM pg_stat_activity;
```

Cloudflare Workers default: 10 concurrent connections

## Security

### API Authentication

Always validate JWT tokens:

```typescript
const token = request.headers.get('Authorization')?.split(' ')[1];
if (!token) return new Response('Unauthorized', { status: 401 });

const payload = await verifyToken(token, env.CLERK_SECRET_KEY);
```

### CORS Headers

```typescript
const headers = {
  'Access-Control-Allow-Origin': 'https://app.example.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### Rate Limiting

Use Cloudflare Workers Analytics Engine for rate limiting:

```typescript
const ip = request.headers.get('cf-connecting-ip');
const key = `rate:${ip}`;
const count = await env.CACHE.get(key) || 0;

if (count > 100) {
  return new Response('Rate limited', { status: 429 });
}

await env.CACHE.put(key, count + 1, { expirationTtl: 60 });
```

## Troubleshooting

### Worker Not Responding

```bash
# Check deployment
wrangler tail

# Test locally
wrangler dev

# Check secrets are set
wrangler secret list
```

### Database Connection Errors

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pooling
# Limit connections in code
```

### High Latency

1. Check database query performance
2. Add caching with KV
3. Optimize database indexes
4. Check Cloudflare analytics

### 502 Bad Gateway

Usually database connection issue:

```bash
# Check database is running
# Check DATABASE_URL environment variable
# Check credentials are correct
```

## Cost Optimization

### Worker Costs

Cloudflare Workers pricing:
- 100,000 requests/day free
- $0.50 per million requests above that

### Database Costs

Neon pricing:
- Free tier: Limited compute and storage
- Paid: $0.16 per 1 million compute-seconds

### Optimization Tips

- Use Workers KV for caching
- Batch database queries
- Compress responses
- Minimize cold starts

## Related Documentation

- [CI/CD Deployment](./ci-cd.md) - Automated deployments
- [Environment Setup](../getting-started/environment.md) - Configuration
- [Troubleshooting](../troubleshooting/common-issues.md) - Common problems
