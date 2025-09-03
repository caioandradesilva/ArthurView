// Script to check if required Firestore indexes exist
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Your Firebase config - replace with your actual values or use environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkIndexes() {
  console.log('🔍 Checking Firestore indexes...\n');
  
  const testTicketId = 'FpBJtbhds4ceMtLatwtn'; // Use the actual ticket ID from your error
  const testAsicId = 'test-asic-id';
  const testSiteId = 'DZX19gYmYBqdIBrN582V'; // Use the actual site ID from your error

  const indexChecks = [
    {
      name: 'Costs by ticketId + createdAt (DESC)',
      test: async () => {
        const q = query(
          collection(db, 'costs'),
          where('ticketId', '==', testTicketId),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        return await getDocs(q);
      }
    },
    {
      name: 'Costs by asicId + createdAt (DESC)',
      test: async () => {
        const q = query(
          collection(db, 'costs'),
          where('asicId', '==', testAsicId),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        return await getDocs(q);
      }
    },
    {
      name: 'Costs by siteId + isVisible + createdAt (DESC)',
      test: async () => {
        const q = query(
          collection(db, 'costs'),
          where('siteId', '==', testSiteId),
          where('isVisible', '==', true),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        return await getDocs(q);
      }
    },
    {
      name: 'Simple costs collection read',
      test: async () => {
        const q = query(collection(db, 'costs'), limit(5));
        return await getDocs(q);
      }
    }
  ];

  for (const check of indexChecks) {
    try {
      console.log(`⏳ Testing: ${check.name}`);
      const result = await check.test();
      console.log(`✅ ${check.name} - SUCCESS (${result.docs.length} documents)`);
      
      // Log the actual documents found
      result.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   Document ${doc.id}:`, {
          ticketId: data.ticketId,
          asicId: data.asicId,
          siteId: data.siteId,
          description: data.description,
          amount: data.amount,
          createdAt: data.createdAt
        });
      });
      
    } catch (error: any) {
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.log(`🔗 ${check.name} - INDEX NEEDED!`);
        console.log(`   ${error.message}\n`);
      } else {
        console.log(`❌ ${check.name} - ERROR: ${error.message}\n`);
      }
    }
  }

  // Check if costs collection exists and has documents
  try {
    console.log('\n📊 Checking costs collection...');
    const allCosts = await getDocs(collection(db, 'costs'));
    console.log(`Found ${allCosts.docs.length} total cost documents`);
    
    allCosts.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Cost ${doc.id}:`, {
        ticketId: data.ticketId || 'none',
        asicId: data.asicId || 'none',
        siteId: data.siteId || 'none',
        description: data.description,
        amount: data.amount,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      });
    });
    
  } catch (error) {
    console.error('Error reading costs collection:', error);
  }

  console.log('\n🎉 Index check completed!');
}

// Run the check
checkIndexes().catch(console.error);