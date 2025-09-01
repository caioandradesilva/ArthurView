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
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  asicId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'waiting_parts' | 'resolved' | 'closed';
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
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
  description: string;
  amount: number;
  currency: 'USD' | 'BRL';
  category: 'parts' | 'labor' | 'other';
  createdBy: string;
  createdAt: Date;
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
  isActive: boolean;
  createdAt: Date;
}