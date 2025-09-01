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
  static async getTicketsByASIC(asicId: string): Promise<Ticket[]> {
    const q = query(collection(db, 'tickets'), where('asicId', '==', asicId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  }

  static async createTicket(ticket: Omit<Ticket, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'tickets'), {
      ...ticket,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Create audit event
    await this.createAuditEvent({
      asicId: ticket.asicId,
      eventType: 'ticket_created',
      description: `Ticket created: ${ticket.title}`,
      performedBy: ticket.createdBy,
      metadata: { ticketId: docRef.id, priority: ticket.priority }
    });
    
    return docRef.id;
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
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CostRecord));
  }

  static async createCostRecord(cost: Omit<CostRecord, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'costs'), {
      ...cost,
      createdAt: serverTimestamp()
    });
    
    // Create audit event
    await this.createAuditEvent({
      asicId: cost.asicId,
      eventType: 'cost_added',
      description: `Cost added: ${cost.description} - ${cost.currency} ${cost.amount}`,
      performedBy: cost.createdBy,
      metadata: { costId: docRef.id, amount: cost.amount, category: cost.category }
    });
    
    return docRef.id;
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

  // Search functionality
  static async searchASICs(searchTerm: string): Promise<ASIC[]> {
    // This is a basic implementation. In production, you might want to use Algolia or similar
    const queries = [
      query(collection(db, 'asics'), where('serialNumber', '>=', searchTerm), where('serialNumber', '<=', searchTerm + '\uf8ff')),
      query(collection(db, 'asics'), where('ipAddress', '>=', searchTerm), where('ipAddress', '<=', searchTerm + '\uf8ff')),
      query(collection(db, 'asics'), where('location', '>=', searchTerm), where('location', '<=', searchTerm + '\uf8ff'))
    ];

    const results: ASIC[] = [];
    for (const q of queries) {
      const querySnapshot = await getDocs(q);
      querySnapshot.docs.forEach(doc => {
        const asic = { id: doc.id, ...doc.data() } as ASIC;
        if (!results.find(r => r.id === asic.id)) {
          results.push(asic);
        }
      });
    }

    return results;
  }
}