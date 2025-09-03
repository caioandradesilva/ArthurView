// Script to trigger Firestore index creation by running queries that need indexes
// Run this in your local development environment after deploying Firestore rules

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Your Firebase config - replace with your actual values
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function triggerIndexCreation() {
  console.log('🔥 Starting Firestore index creation triggers...\n');
  
  const testSiteId = 'test-site-id';
  const testAsicId = 'test-asic-id';
  const testTicketId = 'test-ticket-id';
  const testUserId = 'test-user-id';

  const queries = [
    {
      name: 'Tickets by site + status + createdAt',
      query: () => query(
        collection(db, 'tickets'),
        where('siteId', '==', testSiteId),
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
    },
    {
      name: 'Tickets by site + priority + createdAt', 
      query: () => query(
        collection(db, 'tickets'),
        where('siteId', '==', testSiteId),
        where('priority', '==', 'high'),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
    },
    {
      name: 'Tickets by assignedTo + status + updatedAt',
      query: () => query(
        collection(db, 'tickets'),
        where('assignedTo', 'array-contains', testUserId),
        where('status', '==', 'open'),
        orderBy('updatedAt', 'desc'),
        limit(1)
      )
    },
    {
      name: 'ASICs by site + status + macAddress',
      query: () => query(
        collection(db, 'asics'),
        where('siteId', '==', testSiteId),
        where('status', '==', 'online'),
        orderBy('macAddress', 'asc'),
        limit(1)
      )
    },
    {
      name: 'ASICs by rack + position.line + position.column',
      query: () => query(
        collection(db, 'asics'),
        where('rackId', '==', 'test-rack-id'),
        orderBy('position.line', 'asc'),
        orderBy('position.column', 'asc'),
        limit(1)
      )
    },
    {
      name: 'Costs by site + isVisible + createdAt',
      query: () => query(
        collection(db, 'costs'),
        where('siteId', '==', testSiteId),
        where('isVisible', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
    },
    {
      name: 'Costs by asic + createdAt',
      query: () => query(
        collection(db, 'costs'),
        where('asicId', '==', testAsicId),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
    },
    {
      name: 'Comments by ticket + createdAt',
      query: () => query(
        collection(db, 'comments'),
        where('ticketId', '==', testTicketId),
        orderBy('createdAt', 'asc'),
        limit(1)
      )
    },
    {
      name: 'Comments by asic + createdAt',
      query: () => query(
        collection(db, 'comments'),
        where('asicId', '==', testAsicId),
        orderBy('createdAt', 'asc'),
        limit(1)
      )
    },
    {
      name: 'Audit events by asic + createdAt',
      query: () => query(
        collection(db, 'auditEvents'),
        where('asicId', '==', testAsicId),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
    },
    {
      name: 'User site access by user + site',
      query: () => query(
        collection(db, 'userSiteAccess'),
        where('userId', '==', testUserId),
        where('siteId', '==', testSiteId),
        limit(1)
      )
    },
    {
      name: 'Containers by site',
      query: () => query(
        collection(db, 'containers'),
        where('siteId', '==', testSiteId),
        limit(1)
      )
    },
    {
      name: 'Racks by container',
      query: () => query(
        collection(db, 'racks'),
        where('containerId', '==', 'test-container-id'),
        limit(1)
      )
    }
  ];

  for (const { name, query: queryFn } of queries) {
    try {
      console.log(`⏳ Testing: ${name}`);
      await getDocs(queryFn());
      console.log(`✅ ${name} - Index exists or not needed`);
    } catch (error: any) {
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.log(`🔗 ${name} - INDEX NEEDED!`);
        console.log(`   ${error.message}\n`);
      } else {
        console.log(`❌ ${name} - Other error: ${error.message}\n`);
      }
    }
  }

  console.log('\n🎉 Index trigger test completed!');
  console.log('📋 Look for "INDEX NEEDED!" messages above with direct links to create indexes.');
  console.log('🔗 Click each link to automatically create the required composite indexes.');
}

// Run the script
triggerIndexCreation().catch(console.error);