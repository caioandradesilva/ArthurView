// Simple Node.js script to check Firestore database structure
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Firebase config - using environment variables or defaults
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:123456789:web:demo'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDatabase() {
  console.log('🔍 Checking Firestore database structure...\n');
  
  const testTicketId = 'FpBJtbhds4ceMtLatwtn'; // The actual ticket ID from the error
  const testSiteId = 'DZX19gYmYBqdIBrN582V'; // The actual site ID from the error

  try {
    // 1. Check if costs collection exists and has documents
    console.log('📊 Checking costs collection...');
    const allCostsQuery = query(collection(db, 'costs'), limit(10));
    const allCosts = await getDocs(allCostsQuery);
    console.log(`Found ${allCosts.docs.length} total cost documents\n`);
    
    if (allCosts.docs.length > 0) {
      console.log('Recent cost documents:');
      allCosts.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Cost ${doc.id}:`);
        console.log(`   Description: ${data.description}`);
        console.log(`   Amount: ${data.currency} ${data.amount}`);
        console.log(`   TicketId: ${data.ticketId || 'none'}`);
        console.log(`   AsicId: ${data.asicId || 'none'}`);
        console.log(`   SiteId: ${data.siteId || 'none'}`);
        console.log(`   CreatedBy: ${data.createdBy}`);
        console.log(`   CreatedAt: ${data.createdAt?.toDate?.() || data.createdAt}`);
        console.log('');
      });
    }

    // 2. Check for costs with the specific ticket ID
    console.log(`🎫 Checking costs for ticket ${testTicketId}...`);
    try {
      const ticketCostsQuery = query(
        collection(db, 'costs'),
        where('ticketId', '==', testTicketId)
      );
      const ticketCosts = await getDocs(ticketCostsQuery);
      console.log(`Found ${ticketCosts.docs.length} costs for this ticket\n`);
      
      if (ticketCosts.docs.length > 0) {
        ticketCosts.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`${index + 1}. Ticket Cost ${doc.id}:`);
          console.log(`   Description: ${data.description}`);
          console.log(`   Amount: ${data.currency} ${data.amount}`);
          console.log(`   Category: ${data.category}`);
          console.log(`   CreatedBy: ${data.createdBy}`);
          console.log(`   CreatedAt: ${data.createdAt?.toDate?.() || data.createdAt}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(`❌ Error querying costs by ticketId: ${error.message}`);
      if (error.message.includes('index')) {
        console.log('🔗 This might be due to a missing index. The error should contain a link to create it.');
      }
      console.log('');
    }

    // 3. Check for costs with the specific site ID
    console.log(`🏢 Checking costs for site ${testSiteId}...`);
    try {
      const siteCostsQuery = query(
        collection(db, 'costs'),
        where('siteId', '==', testSiteId)
      );
      const siteCosts = await getDocs(siteCostsQuery);
      console.log(`Found ${siteCosts.docs.length} costs for this site\n`);
    } catch (error) {
      console.log(`❌ Error querying costs by siteId: ${error.message}\n`);
    }

    // 4. Test the exact query used in the app
    console.log('🔍 Testing the exact query used in TicketDetailsPage...');
    try {
      // This is the query from getCostsByTicket in the original code
      const appQuery = query(
        collection(db, 'costs'),
        where('ticketId', '==', testTicketId),
        orderBy('createdAt', 'desc')
      );
      const appResults = await getDocs(appQuery);
      console.log(`✅ App query successful: Found ${appResults.docs.length} results`);
      
      appResults.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ${data.description} - ${data.currency} ${data.amount}`);
      });
    } catch (error) {
      console.log(`❌ App query failed: ${error.message}`);
      if (error.message.includes('index')) {
        console.log('🔗 Missing index detected! The error should contain a link to create it.');
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }

  console.log('\n🎉 Database check completed!');
}

// Run the check
checkDatabase().catch(console.error);