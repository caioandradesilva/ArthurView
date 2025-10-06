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
  serverTimestamp,
  startAfter,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { FirestoreService } from './firestore';
import type {
  MaintenanceTicket,
  MaintenanceAttachment,
  MaintenanceSchedule,
  MaintenancePart,
  MaintenanceComment,
  MaintenanceAuditEvent
} from '../types';

export class MaintenanceFirestoreService {
  static generateVirtualTicketNumber(scheduleId: string): number {
    let hash = 0;
    for (let i = 0; i < scheduleId.length; i++) {
      const char = scheduleId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 9000 + Math.abs(hash % 1000);
  }

  static async getNextMaintenanceTicketNumber(): Promise<number> {
    try {
      const counterRef = doc(db, 'counters', 'maintenanceTicket');
      const counterDoc = await getDoc(counterRef);

      if (!counterDoc.exists()) {
        await updateDoc(counterRef, { lastTicketNumber: 5001 });
        return 5001;
      }

      const currentNumber = counterDoc.data().lastTicketNumber || 5000;
      const nextNumber = currentNumber + 1;

      await updateDoc(counterRef, { lastTicketNumber: nextNumber });
      return nextNumber;
    } catch (error) {
      console.error('Error getting next maintenance ticket number:', error);
      return Math.floor(Date.now() / 1000);
    }
  }

  static async createMaintenanceTicket(ticket: Omit<MaintenanceTicket, 'id' | 'ticketNumber'>): Promise<string> {
    const ticketNumber = await this.getNextMaintenanceTicketNumber();

    const docRef = await addDoc(collection(db, 'maintenanceTickets'), {
      ...ticket,
      ticketNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await this.createMaintenanceAuditEvent({
      maintenanceTicketId: docRef.id,
      eventType: 'created',
      description: `Maintenance ticket #${ticketNumber} created: ${ticket.title}`,
      performedBy: ticket.createdBy,
      performedByRole: ticket.createdByRole,
      metadata: { ticketNumber, maintenanceType: ticket.maintenanceType, priority: ticket.priority }
    });

    return docRef.id;
  }

  static async getAllMaintenanceTickets(): Promise<MaintenanceTicket[]> {
    const q = query(collection(db, 'maintenanceTickets'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
        approvedAt: data.approvedAt?.toDate?.() || data.approvedAt,
        workStartedAt: data.workStartedAt?.toDate?.() || data.workStartedAt,
        workCompletedAt: data.workCompletedAt?.toDate?.() || data.workCompletedAt,
        verifiedAt: data.verifiedAt?.toDate?.() || data.verifiedAt,
        closedAt: data.closedAt?.toDate?.() || data.closedAt
      } as MaintenanceTicket;
    });
  }

  static async getMaintenanceTicketsPaginated(pageSize: number = 20, lastTicket?: MaintenanceTicket): Promise<MaintenanceTicket[]> {
    try {
      let q = query(
        collection(db, 'maintenanceTickets'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastTicket && lastTicket.createdAt) {
        q = query(
          collection(db, 'maintenanceTickets'),
          orderBy('createdAt', 'desc'),
          startAfter(lastTicket.createdAt),
          limit(pageSize)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
          approvedAt: data.approvedAt?.toDate?.() || data.approvedAt,
          workStartedAt: data.workStartedAt?.toDate?.() || data.workStartedAt,
          workCompletedAt: data.workCompletedAt?.toDate?.() || data.workCompletedAt,
          verifiedAt: data.verifiedAt?.toDate?.() || data.verifiedAt,
          closedAt: data.closedAt?.toDate?.() || data.closedAt
        } as MaintenanceTicket;
      });
    } catch (error) {
      console.error('Error fetching paginated maintenance tickets:', error);
      return [];
    }
  }

  static async getMaintenanceTicketById(ticketId: string): Promise<MaintenanceTicket | null> {
    const docRef = doc(db, 'maintenanceTickets', ticketId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
        approvedAt: data.approvedAt?.toDate?.() || data.approvedAt,
        workStartedAt: data.workStartedAt?.toDate?.() || data.workStartedAt,
        workCompletedAt: data.workCompletedAt?.toDate?.() || data.workCompletedAt,
        verifiedAt: data.verifiedAt?.toDate?.() || data.verifiedAt,
        closedAt: data.closedAt?.toDate?.() || data.closedAt
      } as MaintenanceTicket;
    }
    return null;
  }

  static async getMaintenanceTicketsBySite(siteId: string): Promise<MaintenanceTicket[]> {
    const q = query(
      collection(db, 'maintenanceTickets'),
      where('siteId', '==', siteId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
        approvedAt: data.approvedAt?.toDate?.() || data.approvedAt,
        workStartedAt: data.workStartedAt?.toDate?.() || data.workStartedAt,
        workCompletedAt: data.workCompletedAt?.toDate?.() || data.workCompletedAt,
        verifiedAt: data.verifiedAt?.toDate?.() || data.verifiedAt,
        closedAt: data.closedAt?.toDate?.() || data.closedAt
      } as MaintenanceTicket;
    });
  }

  static async getMaintenanceTicketsByAsset(assetId: string): Promise<MaintenanceTicket[]> {
    const q = query(
      collection(db, 'maintenanceTickets'),
      where('assetId', '==', assetId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
        approvedAt: data.approvedAt?.toDate?.() || data.approvedAt,
        workStartedAt: data.workStartedAt?.toDate?.() || data.workStartedAt,
        workCompletedAt: data.workCompletedAt?.toDate?.() || data.workCompletedAt,
        verifiedAt: data.verifiedAt?.toDate?.() || data.verifiedAt,
        closedAt: data.closedAt?.toDate?.() || data.closedAt
      } as MaintenanceTicket;
    });
  }

  static async updateMaintenanceTicket(
    id: string,
    updates: Partial<MaintenanceTicket>,
    performedBy: string,
    performedByRole: 'operator' | 'admin' | 'client'
  ): Promise<void> {
    const ticketRef = doc(db, 'maintenanceTickets', id);
    const ticketDoc = await getDoc(ticketRef);
    const currentTicket = ticketDoc.data() as MaintenanceTicket;

    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    await updateDoc(ticketRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp()
    });

    if (updates.status && updates.status !== currentTicket.status) {
      await this.createMaintenanceAuditEvent({
        maintenanceTicketId: id,
        eventType: 'status_changed',
        description: `Status changed from ${currentTicket.status} to ${updates.status}`,
        performedBy,
        performedByRole,
        previousValue: currentTicket.status,
        newValue: updates.status,
        metadata: { updates }
      });
    } else {
      await this.createMaintenanceAuditEvent({
        maintenanceTicketId: id,
        eventType: 'status_changed',
        description: 'Maintenance ticket updated',
        performedBy,
        performedByRole,
        metadata: { updates }
      });
    }
  }

  static async approveMaintenanceTicket(
    id: string,
    approvedBy: string,
    performedByRole: 'operator' | 'admin'
  ): Promise<void> {
    await updateDoc(doc(db, 'maintenanceTickets', id), {
      status: 'approved',
      approvedBy,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await this.createMaintenanceAuditEvent({
      maintenanceTicketId: id,
      eventType: 'approved',
      description: `Maintenance approved by ${approvedBy}`,
      performedBy: approvedBy,
      performedByRole,
      metadata: { action: 'approve' }
    });
  }

  static async startMaintenanceWork(
    id: string,
    startedBy: string,
    performedByRole: 'operator' | 'admin'
  ): Promise<void> {
    await updateDoc(doc(db, 'maintenanceTickets', id), {
      status: 'in_progress',
      workStartedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await this.createMaintenanceAuditEvent({
      maintenanceTicketId: id,
      eventType: 'started',
      description: `Maintenance work started by ${startedBy}`,
      performedBy: startedBy,
      performedByRole,
      metadata: { action: 'start_work' }
    });
  }

  static async completeMaintenanceWork(
    id: string,
    completedBy: string,
    performedByRole: 'operator' | 'admin',
    workPerformed: string,
    laborHours: number
  ): Promise<void> {
    await updateDoc(doc(db, 'maintenanceTickets', id), {
      status: 'completed',
      workCompletedAt: serverTimestamp(),
      workPerformed,
      laborHours,
      updatedAt: serverTimestamp()
    });

    await this.createMaintenanceAuditEvent({
      maintenanceTicketId: id,
      eventType: 'completed',
      description: `Maintenance work completed by ${completedBy}`,
      performedBy: completedBy,
      performedByRole,
      metadata: { action: 'complete_work', laborHours }
    });
  }

  static async verifyMaintenanceTicket(
    id: string,
    verifiedBy: string,
    verificationNotes: string
  ): Promise<void> {
    const maintenanceDoc = await getDoc(doc(db, 'maintenanceTickets', id));
    const maintenanceData = maintenanceDoc.data();

    await updateDoc(doc(db, 'maintenanceTickets', id), {
      status: 'verified',
      verifiedBy,
      verifiedAt: serverTimestamp(),
      verificationNotes,
      updatedAt: serverTimestamp()
    });

    await this.createMaintenanceAuditEvent({
      maintenanceTicketId: id,
      eventType: 'verified',
      description: `Maintenance verified by ${verifiedBy}`,
      performedBy: verifiedBy,
      performedByRole: 'admin',
      metadata: { action: 'verify', verificationNotes }
    });

    // If this maintenance was created from a ticket, auto-close that ticket
    if (maintenanceData?.originatingTicketId) {
      await FirestoreService.updateTicket(maintenanceData.originatingTicketId, {
        status: 'closed',
        resolvedAt: new Date()
      });
    }
  }

  static async createMaintenanceAttachment(attachment: Omit<MaintenanceAttachment, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'maintenanceAttachments'), {
      ...attachment,
      uploadedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    await this.createMaintenanceAuditEvent({
      maintenanceTicketId: attachment.maintenanceTicketId,
      eventType: 'attachment_added',
      description: `Attachment added: ${attachment.fileName}`,
      performedBy: attachment.uploadedBy,
      performedByRole: 'operator',
      metadata: { attachmentId: docRef.id, category: attachment.category }
    });

    return docRef.id;
  }

  static async getMaintenanceAttachments(ticketId: string): Promise<MaintenanceAttachment[]> {
    const q = query(
      collection(db, 'maintenanceAttachments'),
      where('maintenanceTicketId', '==', ticketId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      } as MaintenanceAttachment;
    });
  }

  static async deleteMaintenanceAttachment(attachmentId: string): Promise<void> {
    await deleteDoc(doc(db, 'maintenanceAttachments', attachmentId));
  }

  static async createMaintenanceComment(comment: Omit<MaintenanceComment, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'maintenanceComments'), {
      ...comment,
      createdAt: serverTimestamp()
    });

    await this.createMaintenanceAuditEvent({
      maintenanceTicketId: comment.maintenanceTicketId,
      eventType: 'comment_added',
      description: `Comment added by ${comment.author}`,
      performedBy: comment.author,
      performedByRole: comment.authorRole,
      metadata: { commentId: docRef.id, commentType: comment.commentType }
    });

    return docRef.id;
  }

  static async getMaintenanceComments(ticketId: string): Promise<MaintenanceComment[]> {
    const q = query(
      collection(db, 'maintenanceComments'),
      where('maintenanceTicketId', '==', ticketId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      } as MaintenanceComment;
    });
  }

  static async createMaintenanceSchedule(schedule: Omit<MaintenanceSchedule, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'maintenanceSchedules'), {
      ...schedule,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async getAllMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    const q = query(collection(db, 'maintenanceSchedules'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate?.() || data.startDate,
        endDate: data.endDate?.toDate?.() || data.endDate,
        nextScheduledDate: data.nextScheduledDate?.toDate?.() || data.nextScheduledDate,
        lastGeneratedDate: data.lastGeneratedDate?.toDate?.() || data.lastGeneratedDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      } as MaintenanceSchedule;
    });
  }

  static async getMaintenanceScheduleById(scheduleId: string): Promise<MaintenanceSchedule | null> {
    const docRef = doc(db, 'maintenanceSchedules', scheduleId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      startDate: data.startDate?.toDate?.() || data.startDate,
      endDate: data.endDate?.toDate?.() || data.endDate,
      nextScheduledDate: data.nextScheduledDate?.toDate?.() || data.nextScheduledDate,
      lastGeneratedDate: data.lastGeneratedDate?.toDate?.() || data.lastGeneratedDate,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
    } as MaintenanceSchedule;
  }

  static async getActiveMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    const q = query(
      collection(db, 'maintenanceSchedules'),
      where('isActive', '==', true),
      orderBy('nextScheduledDate', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate?.() || data.startDate,
        endDate: data.endDate?.toDate?.() || data.endDate,
        nextScheduledDate: data.nextScheduledDate?.toDate?.() || data.nextScheduledDate,
        lastGeneratedDate: data.lastGeneratedDate?.toDate?.() || data.lastGeneratedDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      } as MaintenanceSchedule;
    });
  }

  static async updateMaintenanceSchedule(id: string, updates: Partial<MaintenanceSchedule>): Promise<void> {
    await updateDoc(doc(db, 'maintenanceSchedules', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  static async deleteMaintenanceSchedule(scheduleId: string): Promise<void> {
    await deleteDoc(doc(db, 'maintenanceSchedules', scheduleId));
  }

  static async createMaintenancePart(part: Omit<MaintenancePart, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'maintenanceParts'), {
      ...part,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async getAllMaintenanceParts(): Promise<MaintenancePart[]> {
    const q = query(collection(db, 'maintenanceParts'), orderBy('partName', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      } as MaintenancePart;
    });
  }

  static async getMaintenancePartsBySite(siteId: string): Promise<MaintenancePart[]> {
    const q = query(
      collection(db, 'maintenanceParts'),
      where('siteId', '==', siteId),
      orderBy('partName', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      } as MaintenancePart;
    });
  }

  static async updateMaintenancePart(id: string, updates: Partial<MaintenancePart>): Promise<void> {
    await updateDoc(doc(db, 'maintenanceParts', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  static async deleteMaintenancePart(partId: string): Promise<void> {
    await deleteDoc(doc(db, 'maintenanceParts', partId));
  }

  static async reserveMaintenancePart(partId: string, quantity: number): Promise<void> {
    await updateDoc(doc(db, 'maintenanceParts', partId), {
      quantityReserved: increment(quantity),
      updatedAt: serverTimestamp()
    });
  }

  static async consumeMaintenancePart(partId: string, quantity: number): Promise<void> {
    await updateDoc(doc(db, 'maintenanceParts', partId), {
      quantityAvailable: increment(-quantity),
      quantityReserved: increment(-quantity),
      updatedAt: serverTimestamp()
    });
  }

  static async createMaintenanceAuditEvent(event: Omit<MaintenanceAuditEvent, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'maintenanceAuditEvents'), {
      ...event,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  static async getMaintenanceAuditEvents(ticketId: string): Promise<MaintenanceAuditEvent[]> {
    const q = query(
      collection(db, 'maintenanceAuditEvents'),
      where('maintenanceTicketId', '==', ticketId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      } as MaintenanceAuditEvent;
    });
  }

  static async getMaintenanceStats(): Promise<{
    totalMaintenance: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    awaitingParts: number;
    byType: Record<string, number>;
  }> {
    try {
      const querySnapshot = await getDocs(collection(db, 'maintenanceTickets'));
      const schedulesSnapshot = await getDocs(
        query(
          collection(db, 'maintenanceSchedules'),
          where('isActive', '==', true)
        )
      );

      let scheduled = 0;
      let inProgress = 0;
      let completed = 0;
      let awaitingParts = 0;
      const byType: Record<string, number> = {
        preventive: 0,
        corrective: 0,
        predictive: 0,
        inspection: 0,
        upgrade: 0
      };

      querySnapshot.docs.forEach(doc => {
        const ticket = doc.data();
        switch (ticket.status) {
          case 'scheduled':
          case 'pending_approval':
          case 'approved':
            scheduled++;
            break;
          case 'in_progress':
          case 'dispatched':
            inProgress++;
            break;
          case 'completed':
          case 'verified':
          case 'closed':
            completed++;
            break;
          case 'awaiting_parts':
            awaitingParts++;
            break;
        }

        if (ticket.maintenanceType && byType.hasOwnProperty(ticket.maintenanceType)) {
          byType[ticket.maintenanceType]++;
        }
      });

      schedulesSnapshot.docs.forEach(doc => {
        const schedule = doc.data();
        scheduled++;
        if (schedule.maintenanceType && byType.hasOwnProperty(schedule.maintenanceType)) {
          byType[schedule.maintenanceType]++;
        }
      });

      return {
        totalMaintenance: querySnapshot.size + schedulesSnapshot.size,
        scheduled,
        inProgress,
        completed,
        awaitingParts,
        byType
      };
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      return {
        totalMaintenance: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        awaitingParts: 0,
        byType: { preventive: 0, corrective: 0, predictive: 0, inspection: 0, upgrade: 0 }
      };
    }
  }
}
