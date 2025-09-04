// Firestore service functions for data operations
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
  onSnapshot,
  serverTimestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import type { Site, Container, Rack, ASIC, Ticket, Comment, CostRecord, AuditEvent } from '../types';

// Generic Firestore operations
export class FirestoreService {
  // Sites
  static async getSites(): Promise<Site[]> {
    const querySnapshot = await getDocs(collection(db, 'sites'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
  }

  static async createSite(site: Omit<Site, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'sites'), {
      ...site,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  // Containers
  static async getContainersBySite(siteId: string): Promise<Container[]> {
    const q = query(collection(db, 'containers'), where('siteId', '==', siteId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Container));
  }

  static async createContainer(container: Omit<Container, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'containers'), {
      ...container,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  // Racks
  static async getRacksByContainer(containerId: string): Promise<Rack[]> {
    const q = query(collection(db, 'racks'), where('containerId', '==', containerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rack));
  }

  static async createRack(rack: Omit<Rack, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'racks'), {
      ...rack,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  // ASICs
  static async getASICsByRack(rackId: string): Promise<ASIC[]> {
    const q = query(collection(db, 'asics'), where('rackId', '==', rackId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ASIC));
  }

  static async getASICBySerial(serialNumber: string): Promise<ASIC | null> {
    const q = query(collection(db, 'asics'), where('serialNumber', '==', serialNumber), limit(1));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as ASIC;
  }

  static async getASICByMAC(macAddress: string): Promise<ASIC | null> {
    const q = query(collection(db, 'asics'), where('macAddress', '==', macAddress), limit(1));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as ASIC;
  }
  static async createASIC(asic: Omit<ASIC, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'asics'), {
      ...asic,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Create audit event
    await this.createAuditEvent({
      asicId: docRef.id,
      eventType: 'asic_updated',
      description: 'ASIC created',
      performedBy: 'system',
      metadata: { action: 'create' }
    });
    
    return docRef.id;
  }

  static async updateASIC(id: string, updates: Partial<ASIC>, performedBy: string): Promise<void> {
    await updateDoc(doc(db, 'asics', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    // Create audit event
    await this.createAuditEvent({
      asicId: id,
      eventType: 'asic_updated',
      description: 'ASIC updated',
      performedBy,
      metadata: { updates }
    });
  }

  // Tickets
  static async getAllTickets(): Promise<Ticket[]> {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  }

  static async getTicketsBySite(siteId: string): Promise<Ticket[]> {
    const q = query(
      collection(db, 'tickets'), 
      where('siteId', '==', siteId), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  }

  static async getTicketsByUser(userId: string): Promise<Ticket[]> {
    const q = query(
      collection(db, 'tickets'), 
      where('createdBy', '==', userId), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  }

  static async getTicketsByUserName(userName: string): Promise<Ticket[]> {
    const q = query(
      collection(db, 'tickets'), 
      where('createdBy', '==', userName), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  }

  static async getTicketsByASIC(asicId: string): Promise<Ticket[]> {
    const q = query(collection(db, 'tickets'), where('asicId', '==', asicId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  }

  static async getTicketById(ticketId: string): Promise<Ticket | null> {
    const docRef = doc(db, 'tickets', ticketId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Ticket : null;
  }

  static async getASICById(asicId: string): Promise<ASIC | null> {
    const docRef = doc(db, 'asics', asicId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        lastSeen: data.lastSeen?.toDate?.() || data.lastSeen,
        maintenanceSchedule: data.maintenanceSchedule?.toDate?.() || data.maintenanceSchedule
      } as ASIC;
    }
    return null;
  }

  static async createTicket(ticket: Omit<Ticket, 'id'>): Promise<string> {
    // Get the next ticket number
    const ticketNumber = await this.getNextTicketNumber();
    
    const docRef = await addDoc(collection(db, 'tickets'), {
      ...ticket,
      ticketNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Create audit event
    await this.createAuditEvent({
      asicId: ticket.asicId,
      eventType: 'ticket_created',
      description: `Ticket #${ticketNumber} created: ${ticket.title}`,
      performedBy: ticket.createdBy,
      metadata: { ticketId: docRef.id, ticketNumber, priority: ticket.priority }
    });
    
    return docRef.id;
  }

  // Get next sequential ticket number
  static async getNextTicketNumber(): Promise<number> {
    try {
      // Get the highest ticket number
      const q = query(collection(db, 'tickets'), orderBy('ticketNumber', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return 1001; // Start from 1001 for better looking ticket numbers
      }
      
      const lastTicket = querySnapshot.docs[0].data();
      return (lastTicket.ticketNumber || 1000) + 1;
    } catch (error) {
      console.error('Error getting next ticket number:', error);
      // Fallback to timestamp-based number if query fails
      return Math.floor(Date.now() / 1000);
    }
  }

  static async updateTicket(id: string, updates: Partial<Ticket>, performedBy: string): Promise<void> {
    const ticketRef = doc(db, 'tickets', id);
    const ticketDoc = await getDoc(ticketRef);
    const currentTicket = ticketDoc.data() as Ticket;
    
    await updateDoc(ticketRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    // Create audit event
    await this.createAuditEvent({
      asicId: currentTicket.asicId,
      eventType: 'ticket_updated',
      description: `Ticket updated: ${currentTicket.title}`,
      performedBy,
      metadata: { ticketId: id, updates }
    });
  }

  // Comments
  static async getCommentsByTicket(ticketId: string): Promise<Comment[]> {
    const q = query(collection(db, 'comments'), where('ticketId', '==', ticketId), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  }

  static async getCommentsByASIC(asicId: string): Promise<Comment[]> {
    const q = query(collection(db, 'comments'), where('asicId', '==', asicId), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  }

  static async createComment(comment: Omit<Comment, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'comments'), {
      ...comment,
      createdAt: serverTimestamp()
    });
    
    // Create audit event if comment is on an ASIC
    if (comment.asicId) {
      await this.createAuditEvent({
        asicId: comment.asicId,
        eventType: 'comment_added',
        description: 'Comment added',
        performedBy: comment.author,
        metadata: { commentId: docRef.id }
      });
    }
    
    return docRef.id;
  }

  // Cost Records
  static async getCostsByASIC(asicId: string): Promise<CostRecord[]> {
    const q = query(collection(db, 'costs'), where('asicId', '==', asicId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      } as CostRecord;
    });
  }

  static async getCostsByTicket(ticketId: string): Promise<CostRecord[]> {
    const q = query(collection(db, 'costs'), where('ticketId', '==', ticketId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      } as CostRecord;
    });
  }
  static async createCostRecord(cost: Omit<CostRecord, 'id'>): Promise<string> {
    // If ticketId is provided but asicId/siteId are missing, get them from the ticket
    let finalCost = { ...cost };
    
    if (cost.ticketId && (!cost.asicId || !cost.siteId)) {
      const ticket = await this.getTicketById(cost.ticketId);
      if (ticket) {
        finalCost.asicId = ticket.asicId || '';
        finalCost.siteId = ticket.siteId;
      }
    }
    
    const docRef = await addDoc(collection(db, 'costs'), {
      ...finalCost,
      createdAt: serverTimestamp()
    });
    
    // Create audit event
    if (finalCost.asicId) {
      await this.createAuditEvent({
        asicId: finalCost.asicId,
        eventType: 'cost_added',
        description: `Cost added: ${finalCost.description} - ${finalCost.currency} ${finalCost.amount}`,
        performedBy: finalCost.createdBy,
        metadata: { costId: docRef.id, amount: finalCost.amount, category: finalCost.category, ticketId: finalCost.ticketId }
      });
    }
    
    return docRef.id;
  }

  static async deleteCostRecord(costId: string): Promise<void> {
    await deleteDoc(doc(db, 'costs', costId));
  }

  // Audit Events
  static async getAuditEventsByASIC(asicId: string): Promise<AuditEvent[]> {
    const q = query(collection(db, 'auditEvents'), where('asicId', '==', asicId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditEvent));
  }

  static async createAuditEvent(event: Omit<AuditEvent, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'auditEvents'), {
      ...event,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  // Client Management
  static async getAllClients(): Promise<Client[]> {
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        clientSince: data.clientSince?.toDate?.() || data.clientSince,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      } as Client;
    });
  }

  static async getClientById(clientId: string): Promise<Client | null> {
    const docRef = doc(db, 'clients', clientId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        clientSince: data.clientSince?.toDate?.() || data.clientSince,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      } as Client;
    }
    return null;
  }

  static async createClient(client: Omit<Client, 'id' | 'platformId'>, performedBy: string): Promise<string> {
    // Generate platform ID
    const platformId = await this.generateClientPlatformId();
    
    const docRef = await addDoc(collection(db, 'clients'), {
      ...client,
      platformId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Create audit event
    await this.createClientAuditEvent({
      clientId: docRef.id,
      eventType: 'client_created',
      description: `Client created: ${client.name}`,
      performedBy,
      metadata: { platformId }
    });
    
    return docRef.id;
  }

  static async updateClient(id: string, updates: Partial<Client>, performedBy: string): Promise<void> {
    await updateDoc(doc(db, 'clients', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    // Create audit event
    await this.createClientAuditEvent({
      clientId: id,
      eventType: 'client_updated',
      description: 'Client information updated',
      performedBy,
      metadata: { updates }
    });
  }

  // Generate unique platform ID for clients
  static async generateClientPlatformId(): Promise<string> {
    try {
      // Get the highest platform ID number
      const q = query(collection(db, 'clients'), orderBy('platformId', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return 'CLT-001'; // Start from CLT-001
      }
      
      const lastClient = querySnapshot.docs[0].data();
      const lastId = lastClient.platformId || 'CLT-000';
      const lastNumber = parseInt(lastId.split('-')[1]) || 0;
      const nextNumber = lastNumber + 1;
      
      return `CLT-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating platform ID:', error);
      // Fallback to timestamp-based ID
      const timestamp = Date.now().toString().slice(-6);
      return `CLT-${timestamp}`;
    }
  }

  // Client Comments
  static async getCommentsByClient(clientId: string): Promise<ClientComment[]> {
    const q = query(collection(db, 'clientComments'), where('clientId', '==', clientId), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientComment));
  }

  static async createClientComment(comment: Omit<ClientComment, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'clientComments'), {
      ...comment,
      createdAt: serverTimestamp()
    });
    
    // Create audit event
    await this.createClientAuditEvent({
      clientId: comment.clientId,
      eventType: 'comment_added',
      description: 'Comment added',
      performedBy: comment.author,
      metadata: { commentId: docRef.id }
    });
    
    return docRef.id;
  }

  // Client Audit Events
  static async getAuditEventsByClient(clientId: string): Promise<ClientAuditEvent[]> {
    const q = query(collection(db, 'clientAuditEvents'), where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientAuditEvent));
  }

  static async createClientAuditEvent(event: Omit<ClientAuditEvent, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'clientAuditEvents'), {
      ...event,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  // ASIC-Client Relations
  static async getASICsByClient(clientId: string): Promise<ASIC[]> {
    const q = query(collection(db, 'asics'), where('clientId', '==', clientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        lastSeen: data.lastSeen?.toDate?.() || data.lastSeen,
        maintenanceSchedule: data.maintenanceSchedule?.toDate?.() || data.maintenanceSchedule
      } as ASIC;
    });
  }

  static async getUnassignedASICs(): Promise<ASIC[]> {
    const q = query(collection(db, 'asics'), where('clientId', '==', null));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        lastSeen: data.lastSeen?.toDate?.() || data.lastSeen,
        maintenanceSchedule: data.maintenanceSchedule?.toDate?.() || data.maintenanceSchedule
      } as ASIC;
    });
  }

  static async assignASICToClient(asicId: string, clientId: string, performedBy: string): Promise<void> {
    await updateDoc(doc(db, 'asics', asicId), {
      clientId,
      updatedAt: serverTimestamp()
    });
    
    // Update client's ASIC count and capacity
    await this.updateClientStats(clientId);
    
    // Create audit events
    await this.createAuditEvent({
      asicId,
      eventType: 'asic_updated',
      description: 'ASIC assigned to client',
      performedBy,
      metadata: { clientId, action: 'assign' }
    });
    
    await this.createClientAuditEvent({
      clientId,
      eventType: 'asic_assigned',
      description: 'ASIC assigned to client',
      performedBy,
      metadata: { asicId }
    });
  }

  static async unassignASICFromClient(asicId: string, performedBy: string): Promise<void> {
    const asicDoc = await getDoc(doc(db, 'asics', asicId));
    const asicData = asicDoc.data() as ASIC;
    const clientId = asicData.clientId;
    
    await updateDoc(doc(db, 'asics', asicId), {
      clientId: null,
      updatedAt: serverTimestamp()
    });
    
    // Update client's ASIC count and capacity
    if (clientId) {
      await this.updateClientStats(clientId);
      
      // Create audit events
      await this.createClientAuditEvent({
        clientId,
        eventType: 'asic_removed',
        description: 'ASIC removed from client',
        performedBy,
        metadata: { asicId }
      });
    }
    
    await this.createAuditEvent({
      asicId,
      eventType: 'asic_updated',
      description: 'ASIC unassigned from client',
      performedBy,
      metadata: { clientId, action: 'unassign' }
    });
  }

  // Update client statistics (ASIC count and mining capacity)
  static async updateClientStats(clientId: string): Promise<void> {
    const asics = await this.getASICsByClient(clientId);
    const numberOfASICs = asics.length;
    const miningCapacity = asics.reduce((sum, asic) => sum + asic.hashRate, 0);
    
    await updateDoc(doc(db, 'clients', clientId), {
      numberOfASICs,
      miningCapacity,
      updatedAt: serverTimestamp()
    });
  }

  // Test queries to trigger automatic index creation
  // Run these in development to get Firebase index creation links
  static async triggerIndexCreation() {
    console.log('🔥 Running test queries to trigger index creation...');
    
    try {
      // This will trigger index creation for tickets by site + status + createdAt
      const testSiteId = 'test-site-id';
      const ticketsBySiteAndStatus = query(
        collection(db, 'tickets'),
        where('siteId', '==', testSiteId),
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      await getDocs(ticketsBySiteAndStatus);
      console.log('✅ Tickets by site + status + createdAt query executed');

      // This will trigger index creation for tickets by site + priority + createdAt
      const ticketsBySiteAndPriority = query(
        collection(db, 'tickets'),
        where('siteId', '==', testSiteId),
        where('priority', '==', 'high'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      await getDocs(ticketsBySiteAndPriority);
      console.log('✅ Tickets by site + priority + createdAt query executed');

      // This will trigger index creation for ASICs by site + status
      const asicsBySiteAndStatus = query(
        collection(db, 'asics'),
        where('siteId', '==', testSiteId),
        where('status', '==', 'online'),
        orderBy('macAddress', 'asc'),
        limit(1)
      );
      await getDocs(asicsBySiteAndStatus);
      console.log('✅ ASICs by site + status + macAddress query executed');

      // This will trigger index creation for costs by site + visibility + createdAt
      const costsBySiteAndVisibility = query(
        collection(db, 'costs'),
        where('siteId', '==', testSiteId),
        where('isVisible', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      await getDocs(costsBySiteAndVisibility);
      console.log('✅ Costs by site + visibility + createdAt query executed');

      // This will trigger index creation for comments by ticketId + createdAt
      const commentsByTicket = query(
        collection(db, 'comments'),
        where('ticketId', '==', 'test-ticket-id'),
        orderBy('createdAt', 'asc'),
        limit(1)
      );
      await getDocs(commentsByTicket);
      console.log('✅ Comments by ticket + createdAt query executed');

      // This will trigger index creation for audit events by asicId + createdAt
      const auditEventsByAsic = query(
        collection(db, 'auditEvents'),
        where('asicId', '==', 'test-asic-id'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      await getDocs(auditEventsByAsic);
      console.log('✅ Audit events by ASIC + createdAt query executed');

      console.log('🎉 All test queries completed! Check browser console for index creation links.');
      
    } catch (error: any) {
      console.log('🔗 Index creation needed! Check the error messages for direct links:');
      console.error(error);
    }
  }

  // Search functionality
  static async searchASICs(searchTerm: string): Promise<ASIC[]> {
    // Enhanced search implementation with case-insensitive and partial matching
    const results: ASIC[] = [];
    const searchLower = searchTerm.toLowerCase();
    const searchUpper = searchTerm.toUpperCase();
    
    // If search term is 4 characters or less, also search for it as last 4 digits of MAC
    const isShortSearch = searchTerm.length <= 4;

    try {
      // Get all ASICs and perform client-side filtering for better search capabilities
      // Note: In production with large datasets, consider implementing server-side search
      const allASICsQuery = query(collection(db, 'asics'), limit(1000));
      const allASICsSnapshot = await getDocs(allASICsQuery);
      
      allASICsSnapshot.docs.forEach(doc => {
        const asic = { id: doc.id, ...doc.data() } as ASIC;
        let isMatch = false;
        
        // Helper function to check if a field matches the search term
        const fieldMatches = (field: string | undefined) => {
          if (!field) return false;
          const fieldLower = field.toLowerCase();
          const fieldUpper = field.toUpperCase();
          
          // Check for exact matches (case-insensitive)
          if (fieldLower.includes(searchLower)) return true;
          if (fieldUpper.includes(searchUpper)) return true;
          
          // For MAC addresses, also check last 4 characters if search is short
          if (isShortSearch && field.length >= 4) {
            const last4 = field.slice(-4).toLowerCase();
            if (last4 === searchLower) return true;
            
            // Also check last 4 characters without separators for MAC addresses
            const cleanField = field.replace(/[:-]/g, '');
            if (cleanField.length >= 4) {
              const cleanLast4 = cleanField.slice(-4).toLowerCase();
              if (cleanLast4 === searchLower) return true;
            }
          }
          
          return false;
        };
        
        // Search in MAC address
        if (fieldMatches(asic.macAddress)) {
          isMatch = true;
        }
        
        // Search in serial number
        if (fieldMatches(asic.serialNumber)) {
          isMatch = true;
        }
        
        // Search in IP address
        if (fieldMatches(asic.ipAddress)) {
          isMatch = true;
        }
        
        // Search in location
        if (fieldMatches(asic.location)) {
          isMatch = true;
        }
        
        // Search in model
        if (fieldMatches(asic.model)) {
          isMatch = true;
        }
        
        // Search in position (line,column format)
        const positionString = `${asic.position?.line || ''},${asic.position?.column || ''}`;
        if (fieldMatches(positionString)) {
          isMatch = true;
        }
        
        // Search in individual position components
        if (asic.position) {
          if (fieldMatches(asic.position.line?.toString())) {
            isMatch = true;
          }
          if (fieldMatches(asic.position.column?.toString())) {
            isMatch = true;
          }
        }
        
        if (isMatch && !results.find(r => r.id === asic.id)) {
          results.push(asic);
        }
      });
    } catch (error) {
      console.error('Error searching ASICs:', error);
    }

    // Sort results by relevance (exact matches first, then partial matches)
    const sortedResults = results.sort((a, b) => {
      const aScore = this.calculateSearchScore(a, searchTerm);
      const bScore = this.calculateSearchScore(b, searchTerm);
      return bScore - aScore; // Higher score first
    });

    return sortedResults.slice(0, 50); // Limit to 50 results
  }
  
  // Helper method to calculate search relevance score
  private static calculateSearchScore(asic: ASIC, searchTerm: string): number {
    let score = 0;
    const searchLower = searchTerm.toLowerCase();
    
    // Exact matches get higher scores
    if (asic.macAddress?.toLowerCase() === searchLower) score += 100;
    if (asic.serialNumber?.toLowerCase() === searchLower) score += 100;
    if (asic.ipAddress?.toLowerCase() === searchLower) score += 100;
    
    // Partial matches get medium scores
    if (asic.macAddress?.toLowerCase().includes(searchLower)) score += 50;
    if (asic.serialNumber?.toLowerCase().includes(searchLower)) score += 50;
    if (asic.ipAddress?.toLowerCase().includes(searchLower)) score += 50;
    if (asic.location?.toLowerCase().includes(searchLower)) score += 30;
    if (asic.model?.toLowerCase().includes(searchLower)) score += 20;
    
    // Last 4 digits of MAC address get special scoring
    if (searchTerm.length <= 4 && asic.macAddress) {
      const cleanMac = asic.macAddress.replace(/[:-]/g, '');
      if (cleanMac.slice(-4).toLowerCase() === searchLower) score += 75;
    }
    
    return score;
  }

  static async updateSite(id: string, updates: Partial<Site>): Promise<void> {
    await updateDoc(doc(db, 'sites', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  static async updateRack(id: string, updates: Partial<Rack>): Promise<void> {
    await updateDoc(doc(db, 'racks', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  static async updateContainer(id: string, updates: Partial<Container>): Promise<void> {
    await updateDoc(doc(db, 'containers', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }
}