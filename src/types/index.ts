// Core type definitions for Arthur View platform

export interface Site {
  id: string;
  name: string;
  location: string;
  country: 'BR' | 'US';
  createdAt: Date;
  updatedAt: Date;
}

export interface Container {
  id: string;
  siteId: string;
  name: string; // Format: DC_XX
  createdAt: Date;
  updatedAt: Date;
}

export interface Rack {
  id: string;
  containerId: string;
  name: string; // Format: Rack XX
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ASIC {
  id: string;
  rackId: string;
  siteId: string; // For site-based access control
  clientId?: string; // If ASIC belongs to specific client
  model: string;
  ipAddress: string;
  macAddress: string;
  serialNumber: string;
  hashRate: number; // TH/s
  position: {
    line: number;
    column: number;
  };
  location: string; // Format: MDC-XX-YY (L,C)
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen?: Date; // Last time ASIC was online
  maintenanceSchedule?: Date; // Scheduled maintenance
  lastMaintenanceDate?: Date; // Last completed maintenance
  nextMaintenanceDate?: Date; // Next scheduled maintenance
  maintenanceScheduleId?: string; // Reference to active maintenance schedule
  totalMaintenanceHours?: number; // Lifetime maintenance hours
  maintenanceCount?: number; // Total number of maintenance performed
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  ticketNumber: number; // Sequential ticket number for easy identification
  asicId: string;
  siteId: string; // For site-based access control
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'waiting_parts' | 'resolved' | 'closed';
  assignedTo: string[]; // Multiple operators can be assigned
  createdBy: string;
  createdBySiteId: string; // Site of the creator
  createdAt: Date | any; // Allow Firestore timestamp
  updatedAt: Date | any; // Allow Firestore timestamp
  resolvedAt?: Date;
  estimatedCost?: number; // Operator estimate
  actualCost?: number; // Admin confirmed cost
  costCurrency: 'USD' | 'BRL';
  isUrgent: boolean; // Admin can mark as urgent
  clientVisible: boolean; // Admin control for client visibility
}

export interface Comment {
  id: string;
  ticketId?: string;
  asicId?: string;
  message: string;
  author: string;
  createdAt: Date;
}

export interface CostRecord {
  id: string;
  ticketId?: string;
  asicId: string;
  siteId: string;
  description: string;
  amount: number;
  currency: 'USD' | 'BRL';
  category: 'parts' | 'labor' | 'other';
  isEstimate: boolean; // true if operator estimate, false if admin confirmed
  estimatedBy?: string; // Operator who estimated
  confirmedBy?: string; // Admin who confirmed
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isVisible: boolean; // Admin control for visibility
}

export interface AuditEvent {
  id: string;
  asicId: string;
  eventType: 'ticket_created' | 'ticket_updated' | 'asic_updated' | 'comment_added' | 'cost_added';
  description: string;
  performedBy: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'operator' | 'admin' | 'client';
  siteIds: string[]; // Sites user has access to
  canViewAllSites: boolean; // Admin approval for cross-site access
  canViewCosts: boolean; // Admin control for cost visibility
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSiteAccess {
  id: string;
  userId: string;
  siteId: string;
  accessLevel: 'read' | 'write';
  approvedBy: string; // Admin who approved
  approvedAt: Date;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  location: string; // Where their ASICs are located
  numberOfASICs: number; // Calculated field
  miningCapacity: number; // Total TH/s - calculated field
  clientSince: Date; // When they became our client
  platformId: string; // Generated platform ID (e.g., CLT-001)
  email?: string;
  phone?: string;
  contractDetails?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientComment {
  id: string;
  clientId: string;
  message: string;
  author: string;
  createdAt: Date;
}

export interface ClientAuditEvent {
  id: string;
  clientId: string;
  eventType: 'client_created' | 'client_updated' | 'asic_assigned' | 'asic_removed' | 'comment_added' | 'contract_updated';
  description: string;
  performedBy: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: number;
  title: string;
  description: string;
  maintenanceType: 'preventive' | 'corrective' | 'predictive' | 'inspection' | 'upgrade';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'pending_approval' | 'approved' | 'dispatched' | 'in_progress' | 'awaiting_parts' | 'completed' | 'verified' | 'closed';
  assetType: 'site' | 'container' | 'rack' | 'asic';
  assetId: string;
  siteId: string;
  scheduledDate?: Date;
  estimatedDuration?: number;
  createdBy: string;
  createdByRole: 'operator' | 'admin' | 'client';
  assignedTo: string[];
  approvedBy?: string;
  approvedAt?: Date;
  workStartedAt?: Date;
  workCompletedAt?: Date;
  workPerformed?: string;
  laborHours?: number;
  partsUsed: PartUsed[];
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  estimatedCost?: number;
  actualCost?: number;
  costCurrency: 'USD' | 'BRL';
  isUrgent: boolean;
  isRecurring: boolean;
  recurringScheduleId?: string;
  clientVisible: boolean;
  createdAt: Date | any;
  updatedAt: Date | any;
  closedAt?: Date;
}

export interface PartUsed {
  partName: string;
  quantity: number;
  partNumber?: string;
  cost?: number;
}

export interface MaintenanceAttachment {
  id: string;
  maintenanceTicketId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'document' | 'video';
  fileSize: number;
  mimeType: string;
  category: 'before' | 'during' | 'after' | 'parts' | 'other';
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
  createdAt: Date;
}

export interface MaintenanceSchedule {
  id: string;
  name: string;
  description: string;
  assetType: 'site' | 'container' | 'rack' | 'asic';
  assetId: string;
  siteId: string;
  maintenanceType: 'preventive' | 'inspection';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  frequencyValue: number;
  startDate: Date;
  endDate?: Date;
  nextScheduledDate: Date;
  lastGeneratedDate?: Date;
  ticketTemplate: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedDuration: number;
    assignedTo: string[];
  };
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenancePart {
  id: string;
  partNumber: string;
  partName: string;
  description: string;
  category: 'power_supply' | 'fan' | 'board' | 'cable' | 'other';
  quantityAvailable: number;
  quantityReserved: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitCost: number;
  currency: 'USD' | 'BRL';
  siteId: string;
  location: string;
  supplierName?: string;
  supplierPartNumber?: string;
  leadTimeDays?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceComment {
  id: string;
  maintenanceTicketId: string;
  message: string;
  commentType: 'note' | 'status_update' | 'escalation' | 'verification';
  author: string;
  authorRole: 'operator' | 'admin' | 'client';
  hasAttachments: boolean;
  attachmentIds: string[];
  createdAt: Date;
}

export interface MaintenanceAuditEvent {
  id: string;
  maintenanceTicketId: string;
  eventType: 'created' | 'status_changed' | 'assigned' | 'approved' | 'started' | 'completed' | 'verified' | 'part_added' | 'attachment_added' | 'comment_added';
  description: string;
  performedBy: string;
  performedByRole: 'operator' | 'admin' | 'client';
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}