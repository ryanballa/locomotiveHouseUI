# API Endpoints Reference

Complete reference of all available API endpoints.

## Base URL

```
Development: http://localhost:8080/api
Production: https://api.example.com
```

## Authentication

All endpoints require JWT token in Authorization header:

```bash
Authorization: Bearer <JWT_TOKEN>
```

Get token from Clerk after user signs in.

## Appointments Endpoints

### List Appointments

```
GET /clubs/:clubId/appointments
```

Get all appointments for a club.

**Parameters:**
- `clubId` (required) - Club ID

**Query Parameters:**
- `skip` (optional) - Number of records to skip (default: 0)
- `limit` (optional) - Number of records to return (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "start_time": "2025-10-24T14:00:00Z",
    "duration_minutes": 60,
    "club_id": 1,
    "created_at": "2025-10-24T10:00:00Z",
    "updated_at": "2025-10-24T10:00:00Z"
  }
]
```

### Get Single Appointment

```
GET /clubs/:clubId/appointments/:appointmentId
```

Get a specific appointment.

**Response:**
```json
{
  "id": 1,
  "title": "Team Meeting",
  "start_time": "2025-10-24T14:00:00Z",
  "duration_minutes": 60,
  "club_id": 1
}
```

### Create Appointment

```
POST /clubs/:clubId/appointments
```

Create a new appointment.

**Request Body:**
```json
{
  "title": "Team Meeting",
  "description": "Weekly sync",
  "start_time": "2025-10-24T14:00:00Z",
  "duration_minutes": 60,
  "location": "Conference Room A"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Team Meeting",
  "start_time": "2025-10-24T14:00:00Z",
  "duration_minutes": 60,
  "club_id": 1
}
```

### Update Appointment

```
PUT /clubs/:clubId/appointments/:appointmentId
```

Update an appointment.

**Request Body:**
```json
{
  "title": "Updated Meeting",
  "start_time": "2025-10-24T15:00:00Z",
  "duration_minutes": 90
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Updated Meeting",
  "start_time": "2025-10-24T15:00:00Z",
  "duration_minutes": 90
}
```

### Delete Appointment

```
DELETE /clubs/:clubId/appointments/:appointmentId
```

Delete an appointment.

**Response:**
```json
{
  "success": true
}
```

## Addresses Endpoints

### List Addresses

```
GET /clubs/:clubId/addresses
```

Get all addresses for a club.

**Query Parameters:**
- `skip` (optional) - Number of records to skip
- `limit` (optional) - Number of records to return

**Response:**
```json
[
  {
    "id": 1,
    "address_number": "001",
    "description": "Main Office",
    "assigned_user_id": null,
    "in_use": true,
    "club_id": 1
  }
]
```

### Get Single Address

```
GET /clubs/:clubId/addresses/:addressId
```

Get a specific address.

**Response:**
```json
{
  "id": 1,
  "address_number": "001",
  "description": "Main Office",
  "assigned_user_id": null,
  "in_use": true
}
```

### Create Address

```
POST /clubs/:clubId/addresses
```

Create a new address.

**Request Body:**
```json
{
  "address_number": "001",
  "description": "Main Office",
  "assigned_user_id": null,
  "in_use": true
}
```

**Response:**
```json
{
  "id": 1,
  "address_number": "001",
  "description": "Main Office",
  "club_id": 1
}
```

### Update Address

```
PUT /clubs/:clubId/addresses/:addressId
```

Update an address.

**Request Body:**
```json
{
  "description": "Downtown Branch",
  "assigned_user_id": 5,
  "in_use": true
}
```

### Delete Address

```
DELETE /clubs/:clubId/addresses/:addressId
```

Delete an address.

## Admin Endpoints

Admin users only. Require `is_admin` flag.

### List All Clubs

```
GET /admin/clubs
```

Get all clubs in the system.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Downtown Branch",
    "description": "Main office",
    "created_at": "2025-10-24T10:00:00Z"
  }
]
```

### Create Club

```
POST /admin/clubs
```

Create a new club.

**Request Body:**
```json
{
  "name": "New Branch",
  "description": "Branch office"
}
```

### Update Club

```
PUT /admin/clubs/:clubId
```

Update club details.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "New description"
}
```

### Delete Club

```
DELETE /admin/clubs/:clubId
```

Delete a club.

### List All Users

```
GET /admin/users
```

Get all users in the system.

**Response:**
```json
[
  {
    "id": "user_123",
    "email": "user@example.com",
    "club_id": 1,
    "is_admin": false,
    "created_at": "2025-10-24T10:00:00Z"
  }
]
```

### Get User Details

```
GET /admin/users/:userId
```

Get user information.

### Assign User to Club

```
POST /admin/users/:userId/assign-club
```

Assign user to a club.

**Request Body:**
```json
{
  "club_id": 1
}
```

### Make User Admin

```
POST /admin/users/:userId/make-admin
```

Grant admin privileges to user.

### Remove Admin

```
POST /admin/users/:userId/remove-admin
```

Revoke admin privileges.

### Delete User

```
DELETE /admin/users/:userId
```

Delete a user account.

## Authentication Endpoints

### Get Current User

```
GET /users/me
```

Get current authenticated user's information.

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "club_id": 1,
  "is_admin": false,
  "clubs": [
    {
      "id": 1,
      "name": "Downtown Branch"
    }
  ]
}
```

## Error Responses

### 400 Bad Request

Invalid request parameters.

```json
{
  "error": "Invalid input",
  "message": "Club ID must be a number"
}
```

### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden

User doesn't have permission.

```json
{
  "error": "Forbidden",
  "message": "You do not have access to this club"
}
```

### 404 Not Found

Resource not found.

```json
{
  "error": "Not Found",
  "message": "Appointment not found"
}
```

### 500 Internal Server Error

Server error.

```json
{
  "error": "Internal Server Error",
  "message": "An error occurred processing your request"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 204 | No Content - Success, no response body |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Server Error - Server problem |

## Rate Limiting

API enforces rate limiting to prevent abuse.

Headers in response:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635360000
```

When limit exceeded:
```
Status: 429 Too Many Requests
Retry-After: 60
```

## Pagination

Large result sets are paginated.

**Query Parameters:**
- `skip` - Records to skip (default: 0)
- `limit` - Records to return (default: 50, max: 100)

**Example:**
```bash
GET /clubs/1/appointments?skip=0&limit=20
```

**Response Headers:**
```
X-Total-Count: 150
X-Page-Count: 8
```

## Date Format

All dates use ISO 8601 format:

```
2025-10-24T14:00:00Z
```

- Z suffix indicates UTC timezone
- Use `toISOString()` in JavaScript

## Testing API

### Using curl

```bash
# Get token from Clerk
TOKEN=$(echo $CLERK_TOKEN)

# Make request
curl https://api.example.com/clubs/1/appointments \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Get JWT token from Clerk
2. Set Authorization header
3. Set request method and URL
4. Send request

## Related Documentation

- [Authentication](../features/authentication.md) - Getting tokens
- [Appointments](../features/appointments.md) - Using appointments
- [Addresses](../features/addresses.md) - Managing addresses
