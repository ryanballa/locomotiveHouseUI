# Addresses

Manage addresses and assign them to users within a club.

## Overview

Addresses are locations that can be managed and assigned to users within a club. Common use cases include:
- Service locations
- Client offices
- Delivery addresses
- Business locations

## Address Data Model

```typescript
interface Address {
  id: number;
  club_id: number;
  address_number: string;    // e.g., "001", "0234"
  description: string;        // e.g., "Main Office", "Downtown Branch"
  assigned_user_id?: number;  // User assigned to this address
  in_use: boolean;           // Whether address is currently active
  created_at: string;
  updated_at: string;
}
```

## Viewing Addresses

### Navigate to Addresses

1. Click "Addresses" in the navbar
2. You'll see a table of all addresses in your club

### Address Table

The address table shows:
- Address number
- Description
- Assigned user
- In-use status
- Edit/Delete buttons

### Columns

| Column | Description |
|--------|-------------|
| Number | Address identifier (e.g., 003, 0234) |
| Description | Location name/details |
| Assigned To | User assigned to address (if any) |
| In Use | Whether address is active |
| Actions | Edit/Delete buttons |

## Creating an Address

### Step-by-Step

1. Click "Addresses" in the navbar
2. Click "Create Address" button
3. Fill in the address details:
   - **Address Number**: Unique identifier (003-9999)
   - **Description**: Location name or details
   - **Assigned User**: Select a user (optional)
   - **In Use**: Check if address is currently active
4. Click "Create"

### Via API

```bash
curl -X POST http://localhost:8080/api/clubs/1/addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address_number": "0001",
    "description": "Main Office",
    "in_use": true
  }'
```

## Editing an Address

### Via UI

1. Click "Addresses" in the navbar
2. Find the address in the table
3. Click the "Edit" button in that row
4. Modify the details:
   - Description
   - Assigned user
   - In-use status
5. Click "Save"

### Via API

```bash
curl -X PUT http://localhost:8080/api/clubs/1/addresses/123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Downtown Branch",
    "assigned_user_id": 42,
    "in_use": true
  }'
```

## Deleting an Address

### Via UI

1. Click "Addresses" in the navbar
2. Find the address
3. Click the "Delete" button (trash icon)
4. Confirm deletion in the dialog
5. Address is removed

### Via API

```bash
curl -X DELETE http://localhost:8080/api/clubs/1/addresses/123 \
  -H "Authorization: Bearer $TOKEN"
```

## Address Features

### Address Number

- Format: 3-4 digit string
- Examples: "001", "0234", "9999"
- Should be unique within club (enforced by backend)
- Used to identify addresses on maps or in routing

### Description

- Free-text field
- Used for human-readable address name
- Examples:
  - "Downtown Office - 123 Main St"
  - "Service Center #2"
  - "Client HQ - New York"

### User Assignment

- Each address can be assigned to one user
- Useful for:
  - Assigning service territories
  - Tracking responsibility
  - Routing appointments to specific users
- Optional (address can have no assigned user)

### In-Use Status

- Boolean flag indicating if address is active
- Allows archiving without deleting
- Filter options might show only "in-use" addresses

## Address Permissions

### Who Can View

- Users in the same club can view all addresses
- Users not in the club cannot view addresses

### Who Can Create

- Any user in the club can create addresses

### Who Can Edit

- Any user in the club can edit any address
- Admin users have full access

### Who Can Delete

- Any user in the club can delete addresses
- Admin users have full access

## Address Use Cases

### Service Territory Management

Assign each service address to a technician:
- Address 001: "Downtown" → Assigned to John
- Address 002: "Midtown" → Assigned to Sarah
- Address 003: "Uptown" → Assigned to Mike

### Multi-location Business

Manage multiple business locations:
- Address 001: "Headquarters - 123 Main St"
- Address 002: "Branch Office - 456 Oak Ave"
- Address 003: "Warehouse - 789 Industrial Dr"

### Client Network

Track client locations:
- Address 001: "Client A - NYC Office"
- Address 002: "Client B - Boston Office"
- Address 003: "Client C - LA Office"

## Best Practices

### 1. Use Clear Descriptions

```typescript
// ✓ Good
"Downtown Office - 123 Main St"
"Service Center #2 - North Region"
"Client HQ - New York, NY"

// ✗ Avoid
"Office"
"Location"
"Place"
```

### 2. Organize Address Numbers

```typescript
// ✓ Good: Logical numbering
001 - Main Office
002 - Branch 1
003 - Branch 2
101 - Warehouse

// ✗ Avoid: Random numbering
023, 005, 087, 001
```

### 3. Keep Descriptions Concise

```typescript
// ✓ Good: Specific and brief
"Downtown Office - 123 Main St, Suite 100"

// ✗ Avoid: Too verbose
"This is the downtown office location situated at 123 Main Street in the downtown area where we operate"
```

### 4. Assign Users for Accountability

```typescript
// ✓ Good: Each address has owner
Address 001 → John (Downtown territory)
Address 002 → Sarah (Midtown territory)

// ✗ Avoid: Unassigned addresses
Address 001 → (no one assigned)
Address 002 → (no one assigned)
```

### 5. Archive Unused Addresses

Rather than deleting, mark as "In Use: False":

```typescript
// Mark as inactive instead of deleting
{
  "description": "Old Office (Closed 2025-01-01)",
  "in_use": false  // ✓ Keeps history
}

// Rather than
// DELETE /api/clubs/1/addresses/123  // ✗ Loses history
```

## Accessing Addresses

### As Regular User

Addresses are accessed via: `/club/:id/addresses`

This page is protected by ClubGuard and requires:
- User to be signed in
- User to be assigned to a club
- User to have access to the specific club

### As Admin

Admin users can view all club addresses in the admin panel.

## Address Table Features

### Sorting

You can sort addresses by:
- Address number (ascending/descending)
- Description (A-Z)
- Assigned user
- In-use status

### Filtering

Future enhancements:
- Filter by "In Use" status
- Filter by assigned user
- Search by description

### Pagination

Addresses are paginated if there are many. Use pagination controls to navigate.

## Address API Endpoints

See [API Endpoints](../api/endpoints.md) for complete API reference.

### List Addresses
```
GET /api/clubs/:clubId/addresses
```

### Get Single Address
```
GET /api/clubs/:clubId/addresses/:id
```

### Create Address
```
POST /api/clubs/:clubId/addresses
```

### Update Address
```
PUT /api/clubs/:clubId/addresses/:id
```

### Delete Address
```
DELETE /api/clubs/:clubId/addresses/:id
```

## Troubleshooting

### Can't see addresses

**Problem**: "Club Assignment Required" message

**Solution**: Contact your administrator to assign your account to a club.

### Can't create address

**Problem**: Form won't submit or shows error

**Solution**:
1. Ensure Address Number is in valid format (003-9999)
2. Ensure Address Number isn't already taken
3. Ensure Description is filled in
4. Check browser console for specific error message

### Assigned user not showing

**Problem**: User assignment dropdown is empty

**Solution**:
1. Check that users are assigned to your club
2. Refresh the page
3. Contact administrator if users should be available

## Related Documentation

- [Club Management](./club-management.md) - Club organization
- [Appointments](./appointments.md) - Appointment management
- [API Endpoints](../api/endpoints.md) - API reference
- [Troubleshooting](../troubleshooting/common-issues.md) - Common problems
