// Script to update existing tickets with sequential ticket numbers
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';

// Your Firebase config - this will use the same config as your app
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