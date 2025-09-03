// Sample data to populate your Firestore collections
// Run this script after setting up your Firebase project

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to add your service account key)
const serviceAccount = require('./path-to-your-service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function populateSampleData() {
  try {
    // Sample Sites
    const site1Ref = await db.collection('sites').add({
      name: 'OHIO',
      location: 'Ohio, United States',
      country: 'US',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const site2Ref = await db.collection('sites').add({
      name: 'TOCANTINS', 
      location: 'Tocantins, Brazil',
      country: 'BR',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Sample Users
    const adminUser = await db.collection('users').doc('admin-user-id').set({
      email: 'admin@arthurview.com',
      name: 'System Administrator',
      role: 'admin',
      siteIds: [site1Ref.id, site2Ref.id],
      canViewAllSites: true,
      canViewCosts: true,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const operatorUser = await db.collection('users').doc('operator-user-id').set({
      email: 'operator@arthurview.com',
      name: 'Site Operator',
      role: 'operator',
      siteIds: [site1Ref.id],
      canViewAllSites: false,
      canViewCosts: true,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const clientUser = await db.collection('users').doc('client-user-id').set({
      email: 'client@example.com',
      name: 'Mining Client',
      role: 'client',
      siteIds: [site1Ref.id],
      canViewAllSites: false,
      canViewCosts: false,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Sample Containers
    const container1Ref = await db.collection('containers').add({
      name: 'DC_11',
      siteId: site1Ref.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Sample Racks
    const rack1Ref = await db.collection('racks').add({
      name: 'Rack 01',
      containerId: container1Ref.id,
      siteId: site1Ref.id,
      capacity: 24,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Sample ASICs
    const asic1Ref = await db.collection('asics').add({
      rackId: rack1Ref.id,
      siteId: site1Ref.id,
      clientId: 'client-user-id',
      model: 'Antminer S19 Pro',
      ipAddress: '192.168.1.100',
      macAddress: '00:1B:44:11:3A:B7',
      serialNumber: 'S19PRO123456',
      hashRate: 110.0,
      position: { line: 1, column: 1 },
      location: 'MDC-11-01 (1,1)',
      status: 'online',
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Sample Tickets
    const ticket1Ref = await db.collection('tickets').add({
      asicId: asic1Ref.id,
      siteId: site1Ref.id,
      title: 'ASIC overheating issue',
      description: 'Temperature readings above normal range. Fan noise increased.',
      priority: 'high',
      status: 'open',
      assignedTo: ['operator-user-id'],
      createdBy: 'operator-user-id',
      createdBySiteId: site1Ref.id,
      estimatedCost: 150.00,
      costCurrency: 'USD',
      isUrgent: false,
      clientVisible: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Sample Comments
    await db.collection('comments').add({
      ticketId: ticket1Ref.id,
      message: 'Initial inspection completed. Suspect fan failure.',
      author: 'operator-user-id',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Sample Costs
    await db.collection('costs').add({
      ticketId: ticket1Ref.id,
      asicId: asic1Ref.id,
      siteId: site1Ref.id,
      description: 'Replacement cooling fan',
      amount: 45.00,
      currency: 'USD',
      category: 'parts',
      isEstimate: true,
      estimatedBy: 'operator-user-id',
      createdBy: 'operator-user-id',
      isVisible: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Sample data populated successfully!');
    console.log('Site 1 ID:', site1Ref.id);
    console.log('Site 2 ID:', site2Ref.id);
    console.log('ASIC 1 ID:', asic1Ref.id);
    console.log('Ticket 1 ID:', ticket1Ref.id);

  } catch (error) {
    console.error('Error populating sample data:', error);
  }
}

populateSampleData();