import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import type { Site, Container, Rack, ASIC, Ticket, User, Comment } from '../types';

export class FirestoreService {
  // Sites
  static async getAllSites(): Promise<Site[]> {
    const querySnapshot = await getDocs(collection(db, 'sites'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
  }

  static async getSiteById(id: string): Promise<Site | null> {
    const docRef = doc(db, 'sites', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Site : null;
  }

  static async createSite(site: Omit<Site, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'sites'), {
      ...site,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  static async updateSite(id: string, updates: Partial<Site>): Promise<void> {
    const docRef = doc(db, 'sites', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  static async deleteSite(id: string): Promise<void> {
    const docRef = doc(db, 'sites', id);
    await deleteDoc(docRef);
  }

  // Containers
  static async getContainersBySite(siteId: string): Promise<Container[]> {
    const q = query(collection(db, 'containers'), where('siteId', '==', siteId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Container));
  }

  static async getContainerById(id: string): Promise<Container | null> {
    const docRef = doc(db, 'containers', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Container : null;
  }

  static async createContainer(container: Omit<Container, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'containers'), {
      ...container,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  static async updateContainer(id: string, updates: Partial<Container>): Promise<void> {
    const docRef = doc(db, 'containers', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  static async deleteContainer(id: string): Promise<void> {
    const docRef = doc(db, 'containers', id);
    await deleteDoc(docRef);
  }

  // Racks
  static async getRacksByContainer(containerId: string): Promise<Rack[]> {
    const q = query(collection(db, 'racks'), where('containerId', '==', containerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rack));
  }

  static async getRackById(id: string): Promise<Rack | null> {
    const docRef = doc(db, 'racks', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Rack : null;
  }

  static async createRack(rack: Omit<Rack, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'racks'), {
      ...rack,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  static async updateRack(id: string, updates: Partial<Rack>): Promise<void> {
    const docRef = doc(db, 'racks', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  static async deleteRack(id: string): Promise<void> {
    const docRef = doc(db, 'racks', id);
    await deleteDoc(docRef);
  }

  // ASICs
  static async getASICsByRack(rackId: string): Promise<ASIC[]> {
    const q = query(collection(db, 'asics'), where('rackId', '==', rackId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ASIC));
  }

  static async getASICById(id: string): Promise<ASIC | null> {
    const docRef = doc(db, 'asics', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as ASIC : null;
  }

  static async createASIC(asic: Omit<ASIC, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'asics'), {
      ...asic,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  static async updateASIC(id: string, updates: Partial<ASIC>): Promise<void> {
    const docRef = doc(db, 'asics', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  static async deleteASIC(id: string): Promise<void> {
    const docRef = doc(db, 'asics', id);
    await deleteDoc(docRef);
  }

  static async getAllASICs(): Promise<ASIC[]> {
    const querySnapshot = await getDocs(collection(db, 'asics'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ASIC));
  }

  // Tickets
  static async getAllTickets(): Promise<Ticket[]> {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  }

  static async getTicketById(id: string): Promise<Ticket | null> {
    const docRef = doc(db, 'tickets', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Ticket : null;
  }

  static async createTicket(ticket: Omit<Ticket, 'id' | 'ticketNumber'>): Promise<string> {
    // Get the next ticket number
    const ticketNumber = await this.getNextTicketNumber();
    
    const docRef = await addDoc(collection(db, 'tickets'), {
      ...ticket,
      ticketNumber,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  static async updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
    const docRef = doc(db, 'tickets', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  static async deleteTicket(id: string): Promise<void> {
    const docRef = doc(db, 'tickets', id);
    await deleteDoc(docRef);
  }

  static async getTicketsByASIC(asicId: string): Promise<Ticket[]> {
    const q = query(
      collection(db, 'tickets'), 
      where('asicId', '==', asicId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  }

  // Comments
  static async getCommentsByTicket(ticketId: string): Promise<Comment[]> {
    const q = query(
      collection(db, 'comments'), 
      where('ticketId', '==', ticketId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  }

  static async addComment(comment: Omit<Comment, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'comments'), {
      ...comment,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }

  static async getCommentsByASIC(asicId: string): Promise<Comment[]> {
    const q = query(
      collection(db, 'comments'), 
      where('asicId', '==', asicId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  }

  // Users
  static async getUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
  }

  // Ticket numbering
  private static async getNextTicketNumber(): Promise<number> {
    const counterRef = doc(db, 'counters', 'tickets');
    const counterSnap = await getDoc(counterRef);
    
    if (!counterSnap.exists()) {
      // Initialize counter if it doesn't exist
      await updateDoc(counterRef, { count: 1 });
      return 1;
    }
    
    // Increment and return the new number
    await updateDoc(counterRef, { count: increment(1) });
    const updatedSnap = await getDoc(counterRef);
    return updatedSnap.data()?.count || 1;
  }
}