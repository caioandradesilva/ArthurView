# Quick Start Guide - Maintenance System

## Before You Begin

The maintenance management system has been integrated into your ADAM platform. Before you can use it, you need to set up the Firebase database collections.

---

## Step 1: Set Up Firebase Collections

### Option A: Manual Creation (Recommended for understanding)

1. Open Firebase Console: https://console.firebase.google.com
2. Navigate to your project
3. Go to **Firestore Database**
4. Click **"+ Start collection"** for each of the following:

#### Create These Collections:

1. **maintenanceTickets**
   - Click "+ Start collection"
   - Collection ID: `maintenanceTickets`
   - Add a test document with auto-generated ID
   - Delete the test document after creation

2. **maintenanceAttachments**
   - Collection ID: `maintenanceAttachments`
   - Add and delete a test document

3. **maintenanceSchedules**
   - Collection ID: `maintenanceSchedules`
   - Add and delete a test document

4. **maintenanceParts**
   - Collection ID: `maintenanceParts`
   - Add and delete a test document

5. **maintenanceComments**
   - Collection ID: `maintenanceComments`
   - Add and delete a test document

6. **maintenanceAuditEvents**
   - Collection ID: `maintenanceAuditEvents`
   - Add and delete a test document

### Create Counter Document

1. Navigate to your `counters` collection (create it if it doesn't exist)
2. Click "+ Add document"
3. Document ID: `maintenanceTicket`
4. Add field:
   - Field: `lastTicketNumber`
   - Type: `number`
   - Value: `5000`
5. Click "Save"

---

## Step 2: Update Firestore Security Rules

1. In Firebase Console, go to **Firestore Database** > **Rules**
2. Add these rules to your existing rules file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Existing rules...

    // Maintenance Tickets
    match /maintenanceTickets/{ticketId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Maintenance Attachments
    match /maintenanceAttachments/{attachmentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Maintenance Schedules
    match /maintenanceSchedules/{scheduleId} {
      allow read: if request.auth != null;
      allow create, update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'operator'];
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Maintenance Parts
    match /maintenanceParts/{partId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'operator'];
    }

    // Maintenance Comments
    match /maintenanceComments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Maintenance Audit Events
    match /maintenanceAuditEvents/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Counters
    match /counters/{counterId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

---

## Step 3: Test the System

### 3.1 Start Your Application

```bash
npm run dev
```

### 3.2 Navigate to Maintenance

1. Log in to your application
2. Look for the **"Maintenance"** menu item in the sidebar (🔧 icon)
3. Click on it to open the maintenance dashboard

### 3.3 Create Your First Maintenance Request

1. Click the **"+ New Request"** button
2. Search for an asset (ASIC, Rack, Container, or Site)
3. Select an asset from the search results
4. Fill in the form:
   - **Title**: e.g., "Monthly preventive maintenance"
   - **Description**: Describe the work needed
   - **Type**: Select "Preventive"
   - **Priority**: Select "Medium"
   - **Scheduled Date**: (optional) Pick a date
   - **Estimated Duration**: (optional) Enter hours
   - **Assign To**: (optional) Select operators
5. Click **"Create Request"**

### 3.4 Verify Creation

- You should see your new maintenance request in the list
- It should have a ticket number starting at #5001
- It should show "Pending Approval" status
- Statistics should update (Scheduled count should increase)

### 3.5 Check Admin View (Admin Users Only)

1. If you're logged in as an admin, click the **"Admin"** menu item
2. You should see the admin analytics dashboard
3. Verify statistics are displaying correctly

---

## Step 4: Troubleshooting

### Issue: "Missing or insufficient permissions" error

**Solution**: Check that:
1. You're logged in
2. Your user document in Firestore has a valid `role` field
3. Security rules are published correctly

### Issue: Maintenance menu item doesn't appear

**Solution**:
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser console for errors
3. Verify the build completed successfully

### Issue: Ticket number doesn't increment

**Solution**:
1. Check that the `counters/maintenanceTicket` document exists
2. Verify it has the `lastTicketNumber` field
3. Check the value is a number type, not a string

### Issue: Cannot create maintenance request

**Solution**:
1. Check Firebase Console for error messages
2. Verify all collections are created
3. Check that assets exist in your database
4. Verify counter document is set up correctly

### Issue: Admin menu doesn't appear

**Solution**:
1. Verify your user's `role` field in Firestore is set to `'admin'`
2. Hard refresh the browser
3. Check browser console for errors

---

## Step 5: What's Next?

Now that the basic system is working, you can:

1. **Create test data**: Create several maintenance requests with different types and priorities
2. **Test filtering**: Use the filters to find specific maintenance requests
3. **Review the schema**: Read `FIREBASE-MAINTENANCE-SCHEMA.md` for complete database structure
4. **Review implementation summary**: Read `IMPLEMENTATION-SUMMARY.md` for details on what's implemented and what's next

---

## Key Features Currently Available

✅ Create maintenance requests for any asset type
✅ 5 maintenance types (Preventive, Corrective, Predictive, Inspection, Upgrade)
✅ 4 priority levels (Low, Medium, High, Urgent)
✅ Search and filter maintenance requests
✅ View maintenance statistics
✅ Admin analytics dashboard
✅ Operator assignment
✅ Scheduled date/time
✅ Urgent/emergency flagging

---

## Features Coming Soon

- Detailed maintenance work order view
- Start/Complete work workflow
- File attachments (photos, documents)
- Parts tracking
- Work logs and comments
- Calendar view
- Preventive maintenance scheduling
- Client portal
- Advanced reporting

---

## Quick Reference

### Maintenance Status Workflow

```
Scheduled → Pending Approval → Approved → Dispatched → In Progress
                                                           ↓
                              Awaiting Parts ←------------+
                                   ↓
                              In Progress → Completed → Verified → Closed
```

### Maintenance Types

1. **Preventive** - Regular scheduled maintenance
2. **Corrective** - Fix problems and issues
3. **Predictive** - Based on monitoring/predictions
4. **Inspection** - Regular checks and inspections
5. **Upgrade** - Equipment improvements

### Priority Levels

1. **Low** - Minor, can wait
2. **Medium** - Normal priority
3. **High** - Important, needs attention
4. **Urgent** - Critical, immediate action required

---

## Need Help?

Refer to:
- `FIREBASE-MAINTENANCE-SCHEMA.md` - Database structure and setup
- `IMPLEMENTATION-SUMMARY.md` - Detailed implementation information
- Firebase Console - Check for error messages and logs

---

## Database Indexes

As you use the system, Firebase may prompt you to create indexes. This is normal. When you see an error about a missing index:

1. Look for the error in your browser console
2. Click the provided link to create the index
3. Wait for the index to build (usually a few minutes)
4. Refresh and try again

Common indexes you'll need:
- `maintenanceTickets` by `siteId`, `status`, `createdAt`
- `maintenanceTickets` by `assignedTo` (array), `status`, `createdAt`
- `maintenanceComments` by `maintenanceTicketId`, `createdAt`
- `maintenanceAuditEvents` by `maintenanceTicketId`, `createdAt`

Firebase will automatically provide links to create these when needed.

---

## Success Checklist

- [ ] All 6 collections created in Firebase
- [ ] Counter document created with lastTicketNumber = 5000
- [ ] Security rules updated and published
- [ ] Application running (npm run dev)
- [ ] Maintenance menu item visible in sidebar
- [ ] Successfully created first maintenance request
- [ ] Ticket number shows as #5001
- [ ] Statistics displaying correctly
- [ ] Admin menu visible (if admin user)
- [ ] Filters working correctly

Once all items are checked, your maintenance system is ready to use!

---

## Tips for Daily Use

1. **Use descriptive titles** - Makes searching easier later
2. **Assign operators immediately** - Helps with workload planning
3. **Mark urgent items** - They'll stand out visually
4. **Use filters** - Don't scroll through everything
5. **Check statistics** - Monitor maintenance workload
6. **Review as admin** - Use admin dashboard for insights

---

Congratulations! Your maintenance management system is now operational.
