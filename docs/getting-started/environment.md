# Environment Setup

Configure your environment variables to connect the application to Clerk and the API.

## Environment Variables File

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

## Required Variables

### Clerk Authentication

These variables are required for user authentication through Clerk.

```env
# Clerk Authentication - Get these from your Clerk Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### API Configuration

Configure where your backend API is running.

```env
# API URL - Change if your API runs on a different port/domain
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Getting Clerk Credentials

### 1. Create a Clerk Account
Visit [https://clerk.com](https://clerk.com) and sign up for a free account.

### 2. Create an Application
1. In your Clerk Dashboard, click "Create application"
2. Choose your authentication methods (Email/Password, Google, etc.)
3. Click "Create"

### 3. Copy Your Keys
1. Go to "API Keys" in your application settings
2. Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy the **Secret Key** (starts with `sk_test_` or `sk_live_`)
4. Paste these into your `.env.local`

### 4. Configure Sign-in/Sign-up URLs
In your Clerk application settings:
1. Go to "Paths" under "Customization"
2. Set Sign-in URL: `/sign-in`
3. Set Sign-up URL: `/sign-up`
4. Set After sign-in URL: `/`
5. Set After sign-up URL: `/`

## API Configuration

### Development
For local development:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Production
For deployed applications:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

## Verifying Your Setup

Run the following command to verify your environment is set up correctly:

```bash
npm run dev
```

You should see output like:
```
 ▲ Next.js 15.x.x
 - Local:        http://localhost:3000
 - Environments: .env.local
```

Visit `http://localhost:3000` in your browser. You should see:
- The Locomotive House application loading
- A "Sign In" button in the navbar
- No console errors related to authentication

## Troubleshooting

### "Clerk API error" or authentication not working
- **Check**: Are your Clerk keys in `.env.local`?
- **Check**: Did you copy the entire key value?
- **Check**: Are you using the `pk_test_` (publishable) and `sk_test_` (secret) keys correctly?
- **Fix**: Restart the dev server after changing `.env.local`

### "API not found" or connection errors
- **Check**: Is your API running on the correct port?
- **Check**: Is `NEXT_PUBLIC_API_URL` pointing to the right address?
- **Check**: Are there CORS errors in the browser console?

### Port already in use
If port 3000 is already in use:
```bash
npm run dev -- -p 3001
```

## Next Steps

1. **[First Run](./first-run.md)** - Start the development server and test the setup
2. **[Development Setup](../development/setup-dev-env.md)** - Configure your development environment further
3. **[Architecture](../architecture/overview.md)** - Understand how the application works
