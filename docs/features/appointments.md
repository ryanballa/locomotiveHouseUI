# Appointments

Create, view, and manage appointments within a club.

## Overview

Appointments are scheduled events within a club. Each appointment has:
- A date and time
- A duration
- Optional details
- Assigned to a club

## Appointment Data Model

```typescript
interface Appointment {
  id: number;
  club_id: number;
  title: string;
  description?: string;
  start_time: string;        // ISO 8601 datetime
  duration_minutes: number;  // 60-360 minutes
  location?: string;
  created_at: string;
  updated_at: string;
}
```

## Viewing Appointments

### Navigate to Appointments

1. Click "Appointments" in the navbar
2. Select "View Appointments" from the dropdown
3. You'll see a list of all appointments in your club, grouped by date

### Appointment List

The appointment list shows:
- Date header (grouped by date)
- Appointment time
- Title/description
- Duration
- Edit/Delete buttons

## Creating an Appointment

### Step-by-Step

1. Click "Appointments" in the navbar
2. Select "Create Appointment" from the dropdown
3. Fill in the appointment details:
   - **Date**: Select the appointment date
   - **Time**: Select start time (30-minute intervals)
   - **Duration**: Select duration (60-360 minutes)
   - **Title**: Appointment name (optional)
   - **Description**: Details (optional)
4. Review the appointment details in the preview
5. Click "Create Appointment"

### Via API

```bash
curl -X POST http://localhost:8080/api/clubs/1/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting",
    "description": "Weekly sync",
    "start_time": "2025-10-24T14:00:00Z",
    "duration_minutes": 60,
    "location": "Conference Room A"
  }'
```

## Editing an Appointment

### Via UI

1. Navigate to Appointments
2. Find the appointment
3. Click "Edit"
4. Modify the details
5. Click "Save"

### Via API

```bash
curl -X PUT http://localhost:8080/api/clubs/1/appointments/123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Meeting",
    "start_time": "2025-10-24T15:00:00Z",
    "duration_minutes": 90
  }'
```

## Deleting an Appointment

### Via UI

1. Navigate to Appointments
2. Find the appointment
3. Click "Delete"
4. Confirm deletion in the dialog
5. Appointment is removed

### Via API

```bash
curl -X DELETE http://localhost:8080/api/clubs/1/appointments/123 \
  -H "Authorization: Bearer $TOKEN"
```

## Appointment Features

### Date Validation

- Must be a valid date
- Past dates are allowed
- Times are in 30-minute intervals

### Duration

- Minimum: 60 minutes (1 hour)
- Maximum: 360 minutes (6 hours)
- Typical increments: 60, 90, 120, 180 minutes

### Timezone Handling

Times are stored in ISO 8601 format (UTC). The UI converts to local timezone for display.

## Appointment States

Appointments are always in one of these states:

- **Upcoming**: Future appointments
- **In Progress**: Currently happening
- **Past**: Previous appointments

The UI may show different styling or options based on state.

## Filtering Appointments

Currently, appointments are displayed in chronological order by date.

Future enhancements:
- Filter by date range
- Filter by status (upcoming, past, etc.)
- Search by title
- Sort options

## Appointment Permissions

### Who Can View

- Users in the same club can view all appointments
- Users not in the club cannot view appointments

### Who Can Create

- Any user in the club can create appointments

### Who Can Edit

- Users can edit appointments they created
- Admin users can edit any appointment

### Who Can Delete

- Users can delete appointments they created
- Admin users can delete any appointment

## Best Practices

### 1. Use Clear Titles

```typescript
// ✓ Good
"Team Standup - Frontend"
"Client Meeting: Project Kickoff"
"Lunch Break"

// ✗ Avoid
"Meeting"
"Thing"
"FYI"
```

### 2. Set Appropriate Duration

```typescript
// ✓ Good
"Quick sync" = 30 minutes
"Team meeting" = 60 minutes
"Workshop" = 120-180 minutes

// ✗ Avoid
"Client call" = 15 minutes  // Too short
"Standup" = 480 minutes      // Too long
```

### 3. Use Descriptions for Details

```typescript
// ✓ Good - Description provides context
Title: "Client Presentation"
Description: "Q4 roadmap presentation for Acme Corp"
Location: "Video call - Teams link in email"

// ✗ Avoid - Title tries to say everything
Title: "Client Presentation for Acme Corp Q4 Roadmap in Video Call"
```

### 4. Group Related Appointments

If you have multiple related appointments:
- Use consistent naming convention
- Schedule them back-to-back when possible
- Use descriptions to link them

## Accessing Appointments

### As Regular User

Appointments are accessed via: `/club/:id/appointments`

This page is protected by ClubGuard and requires:
- User to be signed in
- User to be assigned to a club
- User to have access to the specific club

### As Admin

Admin users can view all club appointments in the admin panel.

## Appointment List Features

### Grouping by Date

Appointments are grouped by date:
```
October 24, 2025
  - 2:00 PM - Team Standup (30 min)
  - 3:00 PM - Client Call (60 min)

October 25, 2025
  - 10:00 AM - Planning Session (90 min)
```

### Inline Actions

Each appointment shows:
- Edit button (to modify details)
- Delete button (with confirmation)

## Appointment API Endpoints

See [API Endpoints](../api/endpoints.md) for complete API reference.

### List Appointments
```
GET /api/clubs/:clubId/appointments
```

### Get Single Appointment
```
GET /api/clubs/:clubId/appointments/:id
```

### Create Appointment
```
POST /api/clubs/:clubId/appointments
```

### Update Appointment
```
PUT /api/clubs/:clubId/appointments/:id
```

### Delete Appointment
```
DELETE /api/clubs/:clubId/appointments/:id
```

## Troubleshooting

### Can't see appointments

**Problem**: "Club Assignment Required" message

**Solution**: Contact your administrator to assign your account to a club.

### Time displays incorrectly

**Problem**: Times show in wrong timezone

**Solution**: Check your browser's timezone settings. The app uses your local timezone.

### Can't create appointment

**Problem**: "Create" button is disabled or greyed out

**Solution**:
1. Ensure you're in the correct route: `/club/:id/appointments/create`
2. Ensure all required fields are filled
3. Check browser console for errors

## Related Documentation

- [Club Management](./club-management.md) - Club organization
- [API Endpoints](../api/endpoints.md) - API reference
- [Troubleshooting](../troubleshooting/common-issues.md) - Common problems
