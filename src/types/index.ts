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