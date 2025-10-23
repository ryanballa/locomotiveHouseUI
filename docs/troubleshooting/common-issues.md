# Common Issues and Solutions

Troubleshooting guide for frequently encountered problems.

## Authentication Issues

### Sign-In Button Does Nothing

**Problem**: Clicking "Sign In" doesn't open the sign-in form.

**Possible Causes**:
- Clerk keys not configured
- Dev server not restarted after adding env variables
- CORS configuration issue

**Solutions**:
1. Verify `.env.local` has Clerk keys
   ```bash
   grep CLERK_PUBLISHABLE_KEY .env.local
   ```

2. Restart dev server
   ```bash
   # Stop: Ctrl+C
   npm run dev
   ```

3. Clear browser cache: `Ctrl+Shift+Delete` or `Cmd+Shift+Delete`

4. Check browser console (F12) for errors

### "Clerk API error" Message

**Problem**: Error when attempting to sign in.

**Solution**:
1. Copy Clerk keys from Clerk Dashboard again
2. Verify they start with correct prefix:
   - Public key: `pk_test_` or `pk_live_`
   - Secret key: `sk_test_` or `sk_live_`
3. Check for extra spaces in `.env.local`
4. Restart dev server

### Token Expiration Error

**Problem**: Error about expired or invalid token after some time.

**Solution**: This is handled automatically by Clerk. The token is refreshed automatically. If persistent:
1. Sign out completely
2. Clear browser cookies for Clerk domain
3. Sign back in

## Club Assignment Issues

### "Club Assignment Required" Message

**Problem**: Message appears after sign-in, user can't access features.

**Cause**: User hasn't been assigned to a club yet.

**Solutions**:
1. Contact an administrator to assign your account to a club
2. If you're an admin, assign yourself:
   - Go to `/admin/users`
   - Find your user
   - Click edit
   - Select club from dropdown
   - Click save

### Can't See Club in Dropdown

**Problem**: Club dropdown in navbar is empty or shows "No club assigned".

**Solutions**:
1. Check if useClubCheck hook is loading:
   - Open DevTools Console
   - Check for API errors
2. Verify club assignment:
   - Go to `/admin/users`
   - Check your club assignment
3. Refresh page: `Ctrl+R` or `Cmd+R`

## API Connection Issues

### "Cannot find API" Error

**Problem**: API connection failure, appointments/addresses won't load.

**Possible Causes**:
- Wrong API URL in `.env.local`
- API server not running
- CORS configuration issue

**Solutions**:

1. Check API URL is correct:
   ```bash
   grep NEXT_PUBLIC_API_URL .env.local
   ```
   Should match where your API is running.

2. Test API is running:
   ```bash
   curl http://localhost:8080/health
   # Should return success response
   ```

3. Check for CORS errors:
   - Open DevTools → Network tab
   - Try to load appointments
   - Look for CORS errors in failed requests
   - Contact API maintainer

### 401 Unauthorized Errors

**Problem**: API returns 401 Unauthorized.

**Cause**: Token not being sent or token invalid.

**Solutions**:
1. Verify you're signed in
2. Check browser console for errors
3. Try signing out and back in
4. Clear browser cache

## Database Connection Issues

### Slow Loading / Timeouts

**Problem**: Pages take a long time to load or timeout.

**Possible Causes**:
- Database connection slow
- Network latency
- Large data set

**Solutions**:
1. Check database is running:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   # Should return success
   ```

2. Check API logs:
   ```bash
   wrangler tail
   ```

3. Optimize queries:
   - Check DevTools Network tab
   - See which API calls are slow
   - File an issue with API team

### "Connection refused" Error

**Problem**: Can't connect to database.

**Solutions**:
1. Verify DATABASE_URL is correct
2. Verify database is running
3. Check credentials are correct
4. Check network connectivity if remote database

## Build Issues

### "Cannot find module" Errors

**Problem**: TypeScript/build error about missing modules.

**Solutions**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Try building again
npm run build
```

### Type Errors After npm install

**Problem**: TypeScript errors appear after installing dependencies.

**Solutions**:
```bash
# Update TypeScript
npm install --save-dev typescript@latest

# Regenerate types
npm run type-check

# Try building
npm run build
```

### Port Already in Use

**Problem**: Port 3000 is already in use.

**Solutions**:
```bash
# Use different port
npm run dev -- -p 3001

# Or kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

## Styling Issues

### Tailwind Styles Not Appearing

**Problem**: CSS classes don't apply, styles look broken.

**Solutions**:
1. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. Check Tailwind is configured in `tailwind.config.js`

3. Check import in `globals.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

4. Restart dev server

### Styles Flash Then Disappear

**Problem**: Styles load briefly then disappear.

**Cause**: Tailwind CSS not loading properly.

**Solutions**:
1. Check browser console for CSS load errors
2. Clear browser cache: `Ctrl+Shift+Delete`
3. Restart dev server

## Testing Issues

### Tests Won't Run

**Problem**: `npm test` fails to start.

**Solutions**:
```bash
# Check vitest is installed
npm list vitest

# Clear test cache
npm test -- --clearCache

# Try running specific test
npm test appointments
```

### Tests Failing After Changes

**Problem**: Previously passing tests now fail.

**Solutions**:
1. Check test file matches implementation
2. Update mocks if code changed
3. Run with verbose output:
   ```bash
   npm test -- --reporter=verbose
   ```
4. Check for console errors

## Performance Issues

### Pages Loading Slowly

**Problem**: Appointments/addresses take a long time to load.

**Solutions**:
1. Check Network tab in DevTools
   - Identify slow API calls
   - Check response sizes
2. Check database is performant
3. File issue with API team for optimization

### High Memory Usage

**Problem**: Application uses a lot of RAM.

**Solutions**:
1. Check DevTools Memory tab
2. Look for memory leaks in components
3. Check if many items in lists (add pagination)

### Slow Build Time

**Problem**: `npm run build` takes a long time.

**Solutions**:
```bash
# Check what's slow
npm run build -- --debug

# Clear cache
rm -rf .next

# Try again
npm run build
```

## Git Issues

### Can't Push to Repository

**Problem**: `git push` fails with authentication error.

**Solutions**:
1. Check SSH key is configured
2. Use HTTPS instead:
   ```bash
   git remote set-url origin https://github.com/user/repo.git
   git push
   ```
3. Check GitHub token is valid (if using tokens)

### Merge Conflicts

**Problem**: Can't merge branch due to conflicts.

**Solutions**:
1. Open conflicted files in editor
2. Resolve conflicts (keep both, or choose one)
3. Stage resolved files:
   ```bash
   git add resolved-file.ts
   ```
4. Commit:
   ```bash
   git commit -m "resolve merge conflicts"
   ```

## Browser Issues

### Page Blank or Won't Load

**Problem**: Browser shows blank page or won't load application.

**Solutions**:
1. Check browser console (F12) for errors
2. Check Network tab for failed requests
3. Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
4. Clear browser cache
5. Try different browser

### Responsive Design Breaking

**Problem**: Mobile view looks broken.

**Solutions**:
1. Check viewport meta tag in `app/layout.tsx`
2. Check Tailwind responsive classes are correct
3. Test in different device sizes
4. Check DevTools mobile emulation

## Getting Help

### Debug Information to Provide

When asking for help, include:
1. Error message (full text)
2. Browser console errors (screenshot)
3. Steps to reproduce
4. What you've already tried
5. Environment:
   - Node version: `node --version`
   - npm version: `npm --version`
   - OS

### Find Help

- GitHub Issues - Report bugs
- Documentation - Read guides
- Search existing issues
- Check console errors
- File issue with detailed info

## Advanced Debugging

### Enable Verbose Logging

```bash
# For build
npm run build -- --debug

# For tests
npm test -- --reporter=verbose

# For dev server
DEBUG=* npm run dev
```

### Inspect Network Requests

1. Open DevTools → Network tab
2. Try to reproduce issue
3. Look at request/response:
   - Status code
   - Headers
   - Response data

### Check Application State

In browser console:
```javascript
// Check Clerk auth state
window.__clerk

// Check browser storage
localStorage
sessionStorage
```

## Related Documentation

- [Setup Dev Environment](../development/setup-dev-env.md) - Initial setup
- [Coding Standards](../development/coding-standards.md) - Code issues
- [Git Workflow](../development/git-workflow.md) - Git problems
