# Firebase Setup Instructions

## 1. Firestore Security Rules
Copy the contents of `firestore.rules` to your Firebase Console:
1. Go to Firebase Console → Firestore Database → Rules
2. Replace the existing rules with the content from `firestore.rules`
3. Click "Publish"

## 2. Firestore Indexes
Copy the contents of `firestore.indexes.json` to set up composite indexes:
1. Go to Firebase Console → Firestore Database → Indexes
2. Use Firebase CLI: `firebase deploy --only firestore:indexes`
3. Or manually create the indexes listed in the JSON file

## 3. Environment Variables
Make sure your `.env` file contains:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 4. User Management
After authentication, you need to create user documents in Firestore:

### Admin User Setup
```javascript
// Create in Firestore users collection
{
  email: "admin@yourcompany.com",
  name: "Administrator",
  role: "admin",
  siteIds: ["all-site-ids"],
  canViewAllSites: true,
  canViewCosts: true,
  isActive: true
}
```

### Operator User Setup
```javascript
{
  email: "operator@yourcompany.com", 
  name: "Site Operator",
  role: "operator",
  siteIds: ["site-id-1", "site-id-2"],
  canViewAllSites: false, // Admin can change this
  canViewCosts: true, // Admin can change this
  isActive: true
}
```

### Client User Setup
```javascript
{
  email: "client@example.com",
  name: "Mining Client", 
  role: "client",
  siteIds: ["site-id-1"],
  canViewAllSites: false,
  canViewCosts: false, // Admin controls this
  isActive: true
}
```

## 5. Sample Data
Run the `firebase-sample-data.js` script to populate initial data:
1. Install Firebase Admin SDK: `npm install firebase-admin`
2. Download service account key from Firebase Console
3. Update the path in the script
4. Run: `node firebase-sample-data.js`

## 6. Key Security Features
- **Site-based access control**: Users can only see data from their assigned sites
- **Role-based permissions**: Different capabilities for admin/operator/client
- **Cost visibility control**: Admin can hide costs from specific users
- **Cross-site access approval**: Admin must approve operators to see other sites
- **Client data isolation**: Clients only see their own ASICs and related tickets

## 7. Admin Dashboard Features
The system supports:
- Ticket aging analysis
- Cross-site ticket management  
- Operator performance tracking
- Cost estimate vs actual reporting
- User permission management
- Bulk ASIC operations