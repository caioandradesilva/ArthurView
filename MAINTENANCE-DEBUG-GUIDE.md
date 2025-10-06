# Maintenance System Debugging Guide

## Issue: Recurring maintenance not showing in calendar & tickets not found

I've added extensive console logging to help debug the issue. Here's what to check:

## Step 1: Check if maintenance tickets are being created

1. Open your browser console (F12)
2. Go to the Maintenance page (`/maintenance`)
3. Look for console output: `MaintenancePage loaded tickets: [...]`
   - If the array is empty, tickets are not being created in Firestore
   - If tickets exist, they should show in the list

## Step 2: Check if recurring schedules are being created

1. Go to the Maintenance Calendar page (`/maintenance/calendar`)
2. Look for console output:
   - `Loaded tickets: X` - Regular maintenance tickets count
   - `Loaded schedules: X` - Recurring schedules count
   - `Processing schedule: {...}` - Each schedule being processed
   - `Generating occurrences from [date] to [date]` - Date range
   - `Generated X occurrences` - How many instances were created
   - `Total tickets (including recurring): X` - Final count

## Step 3: Verify Firestore collections exist

Make sure these collections are created in your Firebase Console:
- `maintenanceTickets` - Regular maintenance tickets
- `maintenanceSchedules` - Recurring maintenance schedules
- `counters` - For auto-incrementing ticket numbers

## Step 4: Check Firestore indexes

The following composite indexes are required:

### maintenanceSchedules
- Fields: `isActive` (ASC), `nextScheduledDate` (ASC)
- This index is critical for loading recurring schedules

### maintenanceComments
- Fields: `maintenanceTicketId` (ASC), `createdAt` (ASC)

### maintenanceAuditEvents
- Fields: `maintenanceTicketId` (ASC), `createdAt` (DESC)

If these indexes don't exist, Firebase will show an error in the console with a link to create them.

## Common Issues & Solutions

### Issue 1: "Ticket not found" when clicking

**Cause**: The ticket ID might be a recurring placeholder (`recurring-xxx`)

**Solution**: Recurring tickets are virtual and don't exist in the database yet. The details page should show a message explaining this. Check console for:
- `Schedule missing nextScheduledDate` - Schedule data is incomplete
- `Error generating recurring occurrences` - Problem with date generation

### Issue 2: Calendar shows no maintenance

**Possible causes**:
1. No maintenance tickets created
2. No recurring schedules created
3. Firestore index not created (check console for index errors)
4. Date parsing issues with Firestore timestamps

**Check console for**:
- `Loaded schedules: 0` - No recurring schedules exist
- `Generated 0 occurrences` - Schedule exists but no dates generated
- Index creation error messages from Firebase

### Issue 3: Recurring maintenance creates but doesn't show

**Cause**: When you create a recurring maintenance:
- It creates a regular ticket (shows in Maintenance list)
- It creates a schedule (should generate calendar occurrences)

**Verify**:
1. Check if the schedule was created by looking for: `Loaded schedules: 1` or more
2. Check if the schedule has proper dates: Look for `Processing schedule` output
3. Verify `nextScheduledDate` exists in the schedule

## How Recurring Maintenance Works

1. User creates recurring maintenance with:
   - Frequency (daily, weekly, monthly, quarterly, yearly)
   - Frequency value (every X days/weeks/etc)
   - Start date
   - Optional end date (defaults to 1 year from start)

2. System creates:
   - One regular maintenance ticket (for the first occurrence)
   - One maintenance schedule document

3. Calendar loads:
   - All regular tickets
   - All active schedules
   - Generates up to 50 virtual occurrences per schedule
   - Displays them all in calendar views

4. Virtual occurrences have:
   - ID format: `recurring-{scheduleId}-{timestamp}`
   - Ticket numbers: 9000+
   - All schedule details populated

## Testing Steps

1. **Create a simple maintenance**:
   - Go to Maintenance → New Request
   - Fill in required fields
   - Do NOT check "Recurring"
   - Submit
   - Check console for "MaintenancePage loaded tickets"
   - Verify it shows in the list

2. **Create a recurring maintenance**:
   - Go to Maintenance → New Request
   - Fill in required fields
   - Check "Recurring"
   - Set frequency to "Weekly"
   - Set interval to 1
   - Pick a start date (today or future)
   - Submit
   - Check console for both ticket and schedule creation

3. **View calendar**:
   - Go to Maintenance → Calendar
   - Check console logs for schedule loading
   - Look for the generated occurrences
   - They should appear on the calendar dates

## Next Steps

After checking the console logs, report back with:
1. What you see in the console when loading the Maintenance page
2. What you see when loading the Calendar page
3. Any Firebase errors in the console
4. Whether the Firestore collections exist in Firebase Console

This will help identify exactly where the issue is occurring.
