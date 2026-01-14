# Locomotive House Client

A Next.js application for managing appointments with Clerk authentication.

## Features

- **Appointments**: Signed-in users can view scheduled appointments and create their own
- **Clerk Authentication**: Secure user authentication and management
- **Responsive Design**: Built with Tailwind CSS for a modern, mobile-friendly interface

## Prerequisites

- Node.js 18.x or later
- A Clerk account (sign up at https://clerk.com)
- Access to the Locomotive House API (running on `http://localhost:8080` by default)

## Setup Instructions

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the client directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Clerk credentials:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 3. Set Up Clerk

1. Go to https://clerk.com and create an account
2. Create a new application
3. Copy your publishable key and secret key to `.env.local`
4. In Clerk dashboard, configure:
   - **Sign-in methods**: Enable email/password or social providers
   - **JWT Template**: Create a default JWT template (used for API authentication)

### 4. Configure CORS in API

Ensure your API's `wrangler.toml` or `.dev.vars` includes:

```
ALLOWED_ORIGIN=http://localhost:3000
ALLOWED_PARTIES=your-clerk-frontend-api-url
```

The `ALLOWED_PARTIES` value can be found in your Clerk dashboard under "API Keys" > "Frontend API".

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## API Integration

The client communicates with the backend API using the `apiClient` utility in `lib/api.ts`.

### Authentication

All authenticated requests include a Bearer token with the raw JWT:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImNhdCI6...
```

This sends the Clerk JWT token directly to your Cloudflare Workers API.

## Important Notes

### Automatic User Registration

The app automatically handles user registration! When a user signs in for the first time:

1. The frontend checks if the user has an `lhUserId` in Clerk metadata
2. If not, it calls `/api/users/register` to create the user in your database
3. The API stores the Clerk user ID as the `token` field in the `users` table
4. The API updates Clerk metadata with the new `lhUserId`
5. Future requests use this cached `lhUserId` for appointments and other operations

No manual setup required - users are ready to create appointments immediately after signing in!

### Optional: Webhook Setup

For production environments, you may want to set up webhooks for better reliability:

1. In Clerk dashboard, go to "Webhooks"
2. Add endpoint: `https://your-api-domain.com/api/webhooks/`
3. Subscribe to events: `user.created`, `user.deleted`
4. Copy the webhook secret to your API's `.dev.vars` as `WEBHOOK_SECRET`

Webhooks will create users in the background when they sign up, but the auto-registration flow works as a fallback.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Customization

- **Time Slots**: Edit the `generateTimeSlots()` function in `app/appointments/create/page.tsx`
- **Styling**: Modify Tailwind classes or extend `tailwind.config.ts`
- **API URL**: Change `NEXT_PUBLIC_API_URL` in `.env.local`

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Ensure `ALLOWED_ORIGIN` is set to `http://localhost:3000` in your API configuration
2. Restart the API server after changing environment variables

### Authentication Errors

If authentication fails:

1. Verify Clerk keys in `.env.local`
2. Check that `ALLOWED_PARTIES` in API matches your Clerk Frontend API URL
3. Ensure JWT template is configured in Clerk dashboard

### API Connection Issues

1. Verify the API is running on `http://localhost:8080`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Review browser network tab for detailed error messages

## License

ISC
