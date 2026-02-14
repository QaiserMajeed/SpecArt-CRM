import type {
  Workspace,
  User,
  LeadClient,
  FollowUp,
  Tag,
  CustomField,
  LeadSource,
  Activity,
} from '@/types';

// ============================================
// PROFILE / USER
// ============================================

export function deserializeProfile(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    assignedWorkspaces: row.user_workspaces
      ? row.user_workspaces.map((uw: any) => uw.workspace_id)
      : [],
    createdAt: new Date(row.created_at),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
    isActive: row.is_active,
    phone: row.phone || undefined,
    avatar: row.avatar || undefined,
  };
}

export function serializeProfileUpdate(updates: Partial<User>): Record<string, any> {
  const result: Record<string, any> = {};
  if (updates.name !== undefined) result.name = updates.name;
  if (updates.email !== undefined) result.email = updates.email;
  if (updates.role !== undefined) result.role = updates.role;
  if (updates.isActive !== undefined) result.is_active = updates.isActive;
  if (updates.phone !== undefined) result.phone = updates.phone;
  if (updates.avatar !== undefined) result.avatar = updates.avatar;
  if (updates.lastLoginAt !== undefined) result.last_login_at = updates.lastLoginAt?.toISOString() ?? null;
  return result;
}

// ============================================
// WORKSPACE
// ============================================

export function deserializeWorkspace(row: any): Workspace {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    isActive: row.is_active,
  };
}

export function serializeWorkspace(ws: Partial<Workspace>): Record<string, any> {
  const result: Record<string, any> = {};
  if (ws.name !== undefined) result.name = ws.name;
  if (ws.description !== undefined) result.description = ws.description;
  if (ws.icon !== undefined) result.icon = ws.icon;
  if (ws.color !== undefined) result.color = ws.color;
  if (ws.createdBy !== undefined) result.created_by = ws.createdBy;
  if (ws.isActive !== undefined) result.is_active = ws.isActive;
  return result;
}

// ============================================
// LEAD CLIENT
// ============================================

export function deserializeLeadClient(row: any): LeadClient {
  return {
    id: row.id,
    name: row.name,
    phoneNumber: row.phone_number,
    email: row.email,
    companyName: row.company_name,
    notes: row.notes,
    lastFollowUpDate: row.last_follow_up_date ? new Date(row.last_follow_up_date) : null,
    nextFollowUpDate: row.next_follow_up_date ? new Date(row.next_follow_up_date) : null,
    followUpCategory: row.follow_up_category,
    category: row.category,
    subCategory: row.sub_category,
    assignedTo: row.assigned_to,
    workspaceId: row.workspace_id,
    tags: row.tags || [],
    customFields: row.custom_fields || {},
    source: row.source || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
  };
}

export function serializeLeadClient(lc: Partial<LeadClient>): Record<string, any> {
  const result: Record<string, any> = {};
  if (lc.name !== undefined) result.name = lc.name;
  if (lc.phoneNumber !== undefined) result.phone_number = lc.phoneNumber;
  if (lc.email !== undefined) result.email = lc.email;
  if (lc.companyName !== undefined) result.company_name = lc.companyName;
  if (lc.notes !== undefined) result.notes = lc.notes;
  if (lc.lastFollowUpDate !== undefined) result.last_follow_up_date = lc.lastFollowUpDate?.toISOString() ?? null;
  if (lc.nextFollowUpDate !== undefined) result.next_follow_up_date = lc.nextFollowUpDate?.toISOString() ?? null;
  if (lc.followUpCategory !== undefined) result.follow_up_category = lc.followUpCategory;
  if (lc.category !== undefined) result.category = lc.category;
  if (lc.subCategory !== undefined) result.sub_category = lc.subCategory;
  if (lc.assignedTo !== undefined) result.assigned_to = lc.assignedTo;
  if (lc.workspaceId !== undefined) result.workspace_id = lc.workspaceId;
  if (lc.tags !== undefined) result.tags = lc.tags;
  if (lc.customFields !== undefined) result.custom_fields = lc.customFields;
  if (lc.source !== undefined) result.source = lc.source;
  if (lc.createdBy !== undefined) result.created_by = lc.createdBy;
  return result;
}

// ============================================
// FOLLOW UP
// ============================================

export function deserializeFollowUp(row: any): FollowUp {
  return {
    id: row.id,
    leadClientId: row.lead_client_id,
    date: new Date(row.date),
    category: row.category,
    notes: row.notes,
    completed: row.completed,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    completedBy: row.completed_by || undefined,
  };
}

export function serializeFollowUp(fu: Partial<FollowUp>): Record<string, any> {
  const result: Record<string, any> = {};
  if (fu.leadClientId !== undefined) result.lead_client_id = fu.leadClientId;
  if (fu.date !== undefined) result.date = fu.date instanceof Date ? fu.date.toISOString() : fu.date;
  if (fu.category !== undefined) result.category = fu.category;
  if (fu.notes !== undefined) result.notes = fu.notes;
  if (fu.completed !== undefined) result.completed = fu.completed;
  if (fu.createdBy !== undefined) result.created_by = fu.createdBy;
  if (fu.completedAt !== undefined) result.completed_at = fu.completedAt?.toISOString() ?? null;
  if (fu.completedBy !== undefined) result.completed_by = fu.completedBy;
  return result;
}

// ============================================
// TAG
// ============================================

export function deserializeTag(row: any): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    workspaceId: row.workspace_id,
  };
}

export function serializeTag(tag: Partial<Tag>): Record<string, any> {
  const result: Record<string, any> = {};
  if (tag.name !== undefined) result.name = tag.name;
  if (tag.color !== undefined) result.color = tag.color;
  if (tag.workspaceId !== undefined) result.workspace_id = tag.workspaceId;
  return result;
}

// ============================================
// CUSTOM FIELD
// ============================================

export function deserializeCustomField(row: any): CustomField {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    options: row.options || undefined,
    workspaceId: row.workspace_id,
    isRequired: row.is_required,
    order: row.order,
  };
}

export function serializeCustomField(cf: Partial<CustomField>): Record<string, any> {
  const result: Record<string, any> = {};
  if (cf.name !== undefined) result.name = cf.name;
  if (cf.type !== undefined) result.type = cf.type;
  if (cf.options !== undefined) result.options = cf.options;
  if (cf.workspaceId !== undefined) result.workspace_id = cf.workspaceId;
  if (cf.isRequired !== undefined) result.is_required = cf.isRequired;
  if (cf.order !== undefined) result.order = cf.order;
  return result;
}

// ============================================
// LEAD SOURCE
// ============================================

export function deserializeLeadSource(row: any): LeadSource {
  return {
    id: row.id,
    name: row.name,
    workspaceId: row.workspace_id,
  };
}

export function serializeLeadSource(ls: Partial<LeadSource>): Record<string, any> {
  const result: Record<string, any> = {};
  if (ls.name !== undefined) result.name = ls.name;
  if (ls.workspaceId !== undefined) result.workspace_id = ls.workspaceId;
  return result;
}

// ============================================
// ACTIVITY
// ============================================

export function deserializeActivity(row: any): Activity {
  return {
    id: row.id,
    type: row.type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    userName: row.user_name,
    description: row.description,
    metadata: row.metadata || undefined,
    createdAt: new Date(row.created_at),
  };
}

export function serializeActivity(act: Partial<Activity>): Record<string, any> {
  const result: Record<string, any> = {};
  if (act.type !== undefined) result.type = act.type;
  if (act.entityType !== undefined) result.entity_type = act.entityType;
  if (act.entityId !== undefined) result.entity_id = act.entityId;
  if (act.workspaceId !== undefined) result.workspace_id = act.workspaceId;
  if (act.userId !== undefined) result.user_id = act.userId;
  if (act.userName !== undefined) result.user_name = act.userName;
  if (act.description !== undefined) result.description = act.description;
  if (act.metadata !== undefined) result.metadata = act.metadata;
  return result;
}
