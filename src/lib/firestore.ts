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
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export class FirestoreService {
  // Sites
  static async getAllSites(): Promise<Site[]> {
    const sitesRef = collection(db, 'sites');
    const snapshot = await getDocs(query(sitesRef, orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
  }

  static async getSiteById(id: string): Promise<Site | null> {
    const siteRef = doc(db, 'sites', id);
    const snapshot = await getDoc(siteRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Site : null;
  }

  static async createSite(siteData: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const sitesRef = collection(db, 'sites');
    const docRef = await addDoc(sitesRef, {
      ...siteData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  static async updateSite(id: string, updates: Partial<Site>): Promise<void> {
    const siteRef = doc(db, 'sites', id);
    await updateDoc(siteRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  // Containers
  static async getContainersBySite(siteId: string): Promise<Container[]> {
    const containersRef = collection(db, 'containers');
    const snapshot = await getDocs(query(containersRef, where('siteId', '==', siteId), orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Container));
  }

  static async getContainerById(id: string): Promise<Container | null> {
    const containerRef = doc(db, 'containers', id);
    const snapshot = await getDoc(containerRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Container : null;
  }

  static async createContainer(containerData: Omit<Container, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const containersRef = collection(db, 'containers');
    const docRef = await addDoc(containersRef, {
      ...containerData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  static async updateContainer(id: string, updates: Partial<Container>): Promise<void> {
    const containerRef = doc(db, 'containers', id);
    await updateDoc(containerRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  // Racks
  static async getRacksByContainer(containerId: string): Promise<Rack[]> {
    const racksRef = collection(db, 'racks');
    const snapshot = await getDocs(query(racksRef, where('containerId', '==', containerId), orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rack));
  }

  static async getRackById(id: string): Promise<Rack | null> {
    const rackRef = doc(db, 'racks', id);
    const snapshot = await getDoc(rackRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Rack : null;
  }

  static async createRack(rackData: Omit<Rack, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const racksRef = collection(db, 'racks');
    const docRef = await addDoc(racksRef, {
      ...rackData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  static async updateRack(id: string, updates: Partial<Rack>): Promise<void> {
    const rackRef = doc(db, 'racks', id);
    await updateDoc(rackRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  // ASICs
  static async getASICsByRack(rackId: string): Promise<ASIC[]> {
    const asicsRef = collection(db, 'asics');
    const snapshot = await getDocs(query(asicsRef, where('rackId', '==', rackId), orderBy('position')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ASIC));
  }

  static async getASICById(id: string): Promise<ASIC | null> {
    const asicRef = doc(db, 'asics', id);
    const snapshot = await getDoc(asicRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as ASIC : null;
  }

  static async createASIC(asicData: Omit<ASIC, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const asicsRef = collection(db, 'asics');
    const docRef = await addDoc(asicsRef, {
      ...asicData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  static async updateASIC(id: string, updates: Partial<ASIC>): Promise<void> {
    const asicRef = doc(db, 'asics', id);
    await updateDoc(asicRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  static async getAllASICs(): Promise<ASIC[]> {
    const asicsRef = collection(db, 'asics');
    const snapshot = await getDocs(query(asicsRef, orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ASIC));
  }

  // Comments
  static async getCommentsByASIC(asicId: string): Promise<Comment[]> {
    const commentsRef = collection(db, 'comments');
    const snapshot = await getDocs(query(commentsRef, where('asicId', '==', asicId), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  }

  static async createComment(commentData: Omit<Comment, 'id' | 'createdAt'>): Promise<string> {
    const commentsRef = collection(db, 'comments');
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }

  // Costs
  static async getCostsByASIC(asicId: string): Promise<Cost[]> {
    const costsRef = collection(db, 'costs');
    const snapshot = await getDocs(query(costsRef, where('asicId', '==', asicId), orderBy('date', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cost));
  }

  static async createCost(costData: Omit<Cost, 'id' | 'createdAt'>): Promise<string> {
    const costsRef = collection(db, 'costs');
    const docRef = await addDoc(costsRef, {
      ...costData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }

  // Tickets
  static async getAllTickets(): Promise<Ticket[]> {
    const ticketsRef = collection(db, 'tickets');
    const snapshot = await getDocs(query(ticketsRef, orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  }

  static async getTicketById(id: string): Promise<Ticket | null> {
    const ticketRef = doc(db, 'tickets', id);
    const snapshot = await getDoc(ticketRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Ticket : null;
  }

  static async getTicketsByASIC(asicId: string): Promise<Ticket[]> {
    const ticketsRef = collection(db, 'tickets');
    const snapshot = await getDocs(query(ticketsRef, where('asicId', '==', asicId), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  }

  static async getNextTicketNumber(): Promise<number> {
    const ticketsRef = collection(db, 'tickets');
    const snapshot = await getDocs(query(ticketsRef, orderBy('ticketNumber', 'desc'), limit(1)));
    
    if (snapshot.empty) {
      return 1001; // Start from 1001
    }
    
    const lastTicket = snapshot.docs[0].data();
    return (lastTicket.ticketNumber || 1000) + 1;
  }

  static async createTicket(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'ticketNumber'>): Promise<string> {
    const ticketsRef = collection(db, 'tickets');
    const ticketNumber = await this.getNextTicketNumber();
    
    const docRef = await addDoc(ticketsRef, {
      ...ticketData,
      ticketNumber,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Create audit event if ticket has an associated ASIC
    if (ticketData.asicId) {
      await this.createAuditEvent({
        asicId: ticketData.asicId,
        eventType: 'ticket_created',
        description: `Ticket #${ticketNumber} created: ${ticketData.title}`,
        performedBy: ticketData.createdBy,
        metadata: { ticketId: docRef.id, ticketNumber }
      });
    }

    return docRef.id;
  }

  static async updateTicket(id: string, updates: Partial<Ticket>, performedBy: string): Promise<void> {
    const ticketRef = doc(db, 'tickets', id);
    const ticketDoc = await getDoc(ticketRef);
    
    if (!ticketDoc.exists()) {
      throw new Error('Ticket not found');
    }

    const ticketData = ticketDoc.data() as Ticket;
    
    await updateDoc(ticketRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });

    // Create audit event if ticket has an associated ASIC
    if (ticketData.asicId) {
      const changes = Object.keys(updates).map(key => `${key}: ${updates[key as keyof Ticket]}`).join(', ');
      await this.createAuditEvent({
        asicId: ticketData.asicId,
        eventType: 'ticket_updated',
        description: `Ticket #${ticketData.ticketNumber || 'N/A'} updated: ${changes}`,
        performedBy,
        metadata: { ticketId: id, ticketNumber: ticketData.ticketNumber, changes: updates }
      });
    }
  }

  static async deleteTicket(id: string, performedBy: string): Promise<void> {
    const ticketRef = doc(db, 'tickets', id);
    const ticketDoc = await getDoc(ticketRef);
    
    if (!ticketDoc.exists()) {
      throw new Error('Ticket not found');
    }

    const ticketData = ticketDoc.data() as Ticket;
    
    // Delete the ticket
    await deleteDoc(ticketRef);
    
    // Create audit event if ticket had an associated ASIC
    if (ticketData.asicId) {
      await this.createAuditEvent({
        asicId: ticketData.asicId,
        eventType: 'ticket_updated',
        description: `Ticket #${ticketData.ticketNumber || 'N/A'} deleted: ${ticketData.title}`,
        performedBy,
        metadata: { action: 'delete', ticketId, ticketNumber: ticketData.ticketNumber }
      });
    }
  }

  // Ticket Comments
  static async getCommentsByTicket(ticketId: string): Promise<TicketComment[]> {
    const commentsRef = collection(db, 'ticketComments');
    const snapshot = await getDocs(query(commentsRef, where('ticketId', '==', ticketId), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketComment));
  }

  static async createTicketComment(commentData: Omit<TicketComment, 'id' | 'createdAt'>): Promise<string> {
    const commentsRef = collection(db, 'ticketComments');
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }

  // Ticket Costs
  static async getCostsByTicket(ticketId: string): Promise<TicketCost[]> {
    const costsRef = collection(db, 'ticketCosts');
    const snapshot = await getDocs(query(costsRef, where('ticketId', '==', ticketId), orderBy('date', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketCost));
  }

  static async createTicketCost(costData: Omit<TicketCost, 'id' | 'createdAt'>): Promise<string> {
    const costsRef = collection(db, 'ticketCosts');
    const docRef = await addDoc(costsRef, {
      ...costData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }

  // Audit Events
  static async getAuditEventsByASIC(asicId: string): Promise<AuditEvent[]> {
    const eventsRef = collection(db, 'auditEvents');
    const snapshot = await getDocs(query(eventsRef, where('asicId', '==', asicId), orderBy('timestamp', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditEvent));
  }

  static async createAuditEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    const eventsRef = collection(db, 'auditEvents');
    const docRef = await addDoc(eventsRef, {
      ...eventData,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  }

  // Search
  static async searchASICs(searchTerm: string): Promise<ASIC[]> {
    const asicsRef = collection(db, 'asics');
    const snapshot = await getDocs(asicsRef);
    
    const searchLower = searchTerm.toLowerCase();
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as ASIC))
      .filter(asic => 
        asic.serialNumber?.toLowerCase().includes(searchLower) ||
        asic.model?.toLowerCase().includes(searchLower) ||
        asic.status?.toLowerCase().includes(searchLower)
      );
  }

  // User Profiles
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'userProfiles', uid);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as UserProfile : null;
  }

  static async createUserProfile(uid: string, profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const userRef = doc(db, 'userProfiles', uid);
    await updateDoc(userRef, {
      ...profileData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'userProfiles', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }
}