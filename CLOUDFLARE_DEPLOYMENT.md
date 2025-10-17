# Cloudflare Pages Deployment Guide

This guide walks you through deploying your Next.js application to Cloudflare Pages.

## Prerequisites

- A Cloudflare account (sign up at https://dash.cloudflare.com/sign-up)
- Wrangler CLI installed: `npm install -g wrangler`
- Authenticated with Wrangler: `wrangler login`

## Deployment Methods

### Method 1: Direct CLI Deployment (Quick)

1. **Build the application for Cloudflare:**
   ```bash
   npm run pages:build
   ```

2. **Deploy to Cloudflare Pages:**
   ```bash
   npm run pages:deploy
   ```

3. **Follow the prompts** to create a new project or select an existing one.

### Method 2: Git-based Deployment (Recommended for CI/CD)

This method automatically deploys when you push to your repository.

1. **Push your code to GitHub/GitLab:**
   ```bash
   git add .
   git commit -m "Configure Cloudflare deployment"
   git push
   ```

2. **Connect to Cloudflare Pages:**
   - Go to https://dash.cloudflare.com
   - Navigate to **Workers & Pages** > **Create application** > **Pages**
   - Click **Connect to Git**
   - Select your repository
   - Configure build settings:
     - **Build command:** `npx @opennextjs/cloudflare`
     - **Build output directory:** `.open-next/worker`
     - **Root directory:** (leave blank or specify if in monorepo)

3. **Add Environment Variables:**
   In the Cloudflare dashboard under your Pages project:
   - Go to **Settings** > **Environment variables**
   - Add the following variables:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
     CLERK_SECRET_KEY=your_clerk_secret_key
     NEXT_PUBLIC_API_URL=https://locomotivehouseapi.your-subdomain.workers.dev/api
     ```

4. **Deploy:**
   - Click **Save and Deploy**
   - Cloudflare will build and deploy your application

## Environment Configuration

### Required Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Fill in your actual values in `.env.local`.

For production on Cloudflare Pages, add these in the dashboard:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `NEXT_PUBLIC_API_URL` - Your backend API URL (likely your Cloudflare Worker)

## Custom Domain

1. Go to your Pages project in Cloudflare Dashboard
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain and follow the DNS configuration steps

## Testing Locally with Cloudflare

Test your build locally before deploying:

```bash
npm run pages:dev
```

This runs your app in a local Cloudflare Pages environment.

## Important Notes

### Static Export Configuration

This project is configured with `output: "export"` in `next.config.ts`, which means:
- No server-side rendering (SSR)
- No API routes in the `/app/api` directory
- All pages are pre-rendered at build time
- Client-side rendering for dynamic content

If you need SSR or API routes, you'll need to adjust your architecture or use Cloudflare Workers for backend logic.

### Image Optimization

Next.js Image Optimization is disabled (`images.unoptimized: true`) because Cloudflare Pages doesn't support the Next.js Image Optimization API. Consider using:
- Cloudflare Images for image optimization
- External image CDN services
- Pre-optimized images

### Clerk Authentication

Clerk works seamlessly with Cloudflare Pages. Ensure:
- Your Clerk application is configured with your Cloudflare Pages domain
- Add both production and preview URLs to Clerk's allowed origins

### Backend API

Your `wrangler.toml` indicates you have a Cloudflare Worker API (`locomotivehouseapi`). Make sure:
- Your Worker is deployed: `wrangler deploy` (in the Worker directory)
- Update `NEXT_PUBLIC_API_URL` to point to your deployed Worker URL
- Configure CORS on your Worker to allow requests from your Pages domain

## Troubleshooting

### Build Fails

- Check build logs in Cloudflare dashboard
- Verify all environment variables are set correctly
- Test the build locally: `npm run pages:build`

### Authentication Issues

- Verify Clerk keys are correct
- Check that your Cloudflare Pages domain is added to Clerk's allowed origins
- Ensure environment variables are set in both **Production** and **Preview** environments

### API Connection Issues

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration on your backend
- Use browser DevTools Network tab to inspect failed requests

## Useful Commands

```bash
# Build for Cloudflare
npm run pages:build

# Deploy to Cloudflare Pages
npm run pages:deploy

# Run local Cloudflare Pages dev environment
npm run pages:dev

# View deployment logs
wrangler pages deployment list

# View project details
wrangler pages project list
```

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [OpenNext Cloudflare Adapter](https://opennext.js.org/cloudflare)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Clerk Documentation](https://clerk.com/docs)
