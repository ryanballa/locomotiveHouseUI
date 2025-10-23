# Admin Features

Manage clubs, users, and system-wide settings as an administrator.

## Admin Access

### Becoming an Admin

Only existing admins can make new admins. To become an admin:

1. Contact an existing administrator
2. Ask them to promote your account in the admin panel
3. You'll receive admin access

### Accessing Admin Features

Once an admin, you'll see an "Admin" dropdown in the navbar.

- Click the dropdown
- Select from:
  - Manage Clubs
  - Manage Users
  - Dashboard (if configured)

Admin pages require `/admin/` in the URL.

## Admin Dashboard

### Location

`/admin`

### Features

- Overview of system statistics
- Quick access to management pages
- Recent activity (if configured)
- System health status

## Club Management

### Access Admin Clubs Page

1. Click "Admin" in navbar
2. Select "Manage Clubs"
3. You'll see list of all clubs

### View All Clubs

The clubs list shows:
- Club name
- Description
- Number of users
- Created date
- Edit/Delete buttons

### Create a New Club

1. Click "Create Club" button
2. Enter:
   - **Club Name**: Required, unique
   - **Description**: Optional details about the club
3. Click "Create"
4. Club is created and appears in list

### Edit a Club

1. Click edit button on club row
2. Update:
   - Club name
   - Description
3. Click "Save"
4. Changes are saved

### Delete a Club

1. Click delete button on club row
2. Confirm deletion (cannot be undone)
3. Club is removed with all its data

## User Management

### Access Admin Users Page

1. Click "Admin" in navbar
2. Select "Manage Users"
3. You'll see list of all users

### View All Users

The users list shows:
- User email
- Club assignment
- Admin status
- Created date
- Edit/Delete buttons

### View User Details

Click on a user to see:
- Email address
- Current club assignment
- Admin status
- Created/updated dates

### Assign User to Club

1. Click edit button on user row
2. Select club from "Club Assignment" dropdown
3. Click "Save"
4. User is now assigned to club

### Change User Admin Status

1. Click edit button on user row
2. Check/uncheck "Admin" checkbox
3. Click "Save"
4. User's admin status updated

### Delete a User

1. Click delete button on user row
2. Confirm deletion
3. User is removed from system

## Club-Specific Management

### View Club Members

1. Go to "Manage Clubs"
2. Click on a club
3. See all users assigned to that club

### Add User to Club

1. In club details page
2. Click "Add Member" button
3. Select user from list
4. Click "Confirm"
5. User is added to club

### Remove User from Club

1. In club details page
2. Find user in members list
3. Click remove/delete button
4. Confirm removal
5. User is removed from club

## Admin Permissions

Admins can:

| Action | Permission |
|--------|-----------|
| View all clubs | ✓ |
| Create clubs | ✓ |
| Edit clubs | ✓ |
| Delete clubs | ✓ |
| View all users | ✓ |
| Edit user club assignment | ✓ |
| Make users admin | ✓ |
| Delete users | ✓ |
| View all appointments | ✓ |
| Edit any appointment | ✓ |
| Delete any appointment | ✓ |
| View all addresses | ✓ |
| Edit any address | ✓ |
| Delete any address | ✓ |

## API Access

### Admin Endpoints

Admins can access special admin endpoints:

```bash
# List all clubs
GET /api/admin/clubs

# Get all users
GET /api/admin/users

# Create club
POST /api/admin/clubs

# Edit club
PUT /api/admin/clubs/:id

# Delete club
DELETE /api/admin/clubs/:id

# Assign user to club
POST /api/admin/users/:userId/assign-club

# Make user admin
POST /api/admin/users/:userId/make-admin

# Remove admin status
POST /api/admin/users/:userId/remove-admin
```

See [API Endpoints](../api/endpoints.md) for complete reference.

## Common Admin Tasks

### Task: Set Up New Organization

1. Create club for organization
   - Go to `/admin/clubs`
   - Click "Create Club"
   - Enter organization name
2. Add users to club
   - Go to club details
   - Click "Add Member"
   - Select user, confirm
3. Repeat for each user

### Task: Restructure Organization

1. Create new club
2. Move users to new club:
   - Click on user
   - Change club assignment
   - Save
3. Optional: Delete old club (if empty)

### Task: Grant Admin Access

1. Find user in users list
2. Click edit
3. Check "Admin" checkbox
4. Click "Save"
5. User now has admin access

### Task: Audit User Access

1. Go to "Manage Users"
2. Review each user's club assignment
3. Remove users from clubs if needed
4. Update admin status as needed

## Best Practices

### 1. Document Club Structure

Keep notes on:
- What each club represents
- Which users belong to each club
- Any special configurations

```
Club 1: "Downtown Branch"
  - Users: John, Sarah, Mike
  - Purpose: Main office operations

Club 2: "Warehouse"
  - Users: Tom, Lisa
  - Purpose: Inventory management
```

### 2. Regular Audits

Periodically review:
- Inactive users
- Incorrect club assignments
- Unnecessary admin accounts
- Deleted users

### 3. Careful with Deletions

Before deleting users or clubs:
1. Verify they're no longer needed
2. Check for related appointments/addresses
3. Archive instead of delete if possible
4. Keep backups/records

### 4. Assign One Admin Per Club

Avoid having too many admins. Per club, designate:
- 1 primary admin
- 1 backup admin (optional)

### 5. Review Permissions

Regularly check:
- Who has admin access
- Who can edit appointments
- Who can delete addresses
- Club membership accuracy

## Security Considerations

### 1. Secure Admin Account

- Use strong password
- Enable 2FA if available
- Don't share admin credentials
- Log out when done

### 2. Audit Admin Actions

- Review admin activity logs
- Check for unauthorized changes
- Monitor club membership changes

### 3. Principle of Least Privilege

- Only make users admin if necessary
- Give users access to only their club
- Regularly review and revoke access

### 4. Change Management

When updating club structure:
1. Plan the change
2. Notify affected users
3. Make the change
4. Verify it worked
5. Document the change

## Troubleshooting

### Can't see admin features

**Problem**: No "Admin" dropdown in navbar

**Solution**: Contact existing admin to be promoted to admin status

### Can't assign user to club

**Problem**: User dropdown is empty

**Solution**:
1. Verify users exist in system
2. Users must sign up first
3. Then admin can assign them

### Can't delete club

**Problem**: Delete button greyed out

**Solution**:
1. Club may have users assigned
2. Remove all users first
3. Then delete club

### Changes not saving

**Problem**: Edit form shows error

**Solution**:
1. Check all required fields filled
2. Verify data is valid format
3. Check browser console for error details

## Related Documentation

- [Club Management](./club-management.md) - Club concepts
- [API Endpoints](../api/endpoints.md) - API reference
- [Troubleshooting](../troubleshooting/common-issues.md) - Common problems
