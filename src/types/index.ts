// SpecArt Follow Up System - Types

export type UserRole = 'admin' | 'manager' | 'user';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export type Category = 'lead' | 'client';

export type LeadStatus = 'hot' | 'warm' | 'cold' | 'dead';

export type ClientStatus = 'active' | 'inactive' | 'dead';

export type FollowUpCategory = 'call' | 'email' | 'meeting' | 'follow_up' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedWorkspaces: string[];
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  phone?: string;
  avatar?: string;
}

export interface UserCredentials {
  userId: string;
  passwordHash: string;
  passwordChangedAt?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

export interface LeadClient {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  companyName: string;
  notes: string;
  lastFollowUpDate: Date | null;
  nextFollowUpDate: Date | null;
  followUpCategory: FollowUpCategory;
  category: Category;
  subCategory: LeadStatus | ClientStatus;
  assignedTo: string;
  workspaceId: string;
  tags: string[];
  customFields: Record<string, string>;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface FollowUp {
  id: string;
  leadClientId: string;
  date: Date;
  category: FollowUpCategory;
  notes: string;
  completed: boolean;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  completedBy?: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[];
  workspaceId: string;
  isRequired: boolean;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  workspaceId: string;
}

export interface LeadSource {
  id: string;
  name: string;
  workspaceId: string;
}

export interface Activity {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'follow_up_added' | 'follow_up_completed' | 'status_changed' | 'assigned_changed';
  entityType: 'lead' | 'client' | 'follow_up' | 'user' | 'workspace';
  entityId: string;
  workspaceId: string;
  userId: string;
  userName: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface FilterState {
  category: Category | 'all';
  status: string | 'all';
  assignedTo: string | 'all';
  followUpCategory: FollowUpCategory | 'all';
  dateRange: { from: Date | null; to: Date | null };
  search: string;
  tags: string[];
  source: string | 'all';
}

export interface DashboardStats {
  totalLeads: number;
  totalClients: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  activeClients: number;
  inactiveClients: number;
  overdueFollowUps: number;
  todayFollowUps: number;
  upcomingFollowUps: number;
  conversionRate: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}
