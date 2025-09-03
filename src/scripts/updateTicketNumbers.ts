// Script to update existing tickets with sequential ticket numbers
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';

// Firebase config - using the same fallback values as the main app
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

async function updateExistingTicketNumbers() {
  console.log('🎫 Starting ticket number update...\n');
  
  try {
    // Get all tickets ordered by creation date (oldest first)
    const ticketsQuery = query(
      collection(db, 'tickets'),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(ticketsQuery);
    const tickets = querySnapshot.docs;
    
    console.log(`Found ${tickets.length} tickets to update\n`);
    
    let ticketNumber = 1001; // Start from 1001
    
    for (const ticketDoc of tickets) {
      const ticketData = ticketDoc.data();
      
      // Only update if ticket doesn't have a number yet
      if (!ticketData.ticketNumber) {
        console.log(`Updating ticket "${ticketData.title}" -> #${ticketNumber}`);
        
        await updateDoc(doc(db, 'tickets', ticketDoc.id), {
          ticketNumber: ticketNumber
        });
        
        ticketNumber++;
      } else {
        console.log(`Ticket "${ticketData.title}" already has number #${ticketData.ticketNumber}`);
      }
    }
    
    console.log('\n✅ All tickets updated successfully!');
    console.log(`🎯 Next ticket will be #${ticketNumber}`);
    
  } catch (error) {
    console.error('❌ Error updating ticket numbers:', error);
  }
}

// Run the script
updateExistingTicketNumbers().catch(console.error);