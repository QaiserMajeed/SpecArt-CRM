import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  LeadClient,
  FollowUp,
  Tag,
  CustomField,
  Workspace,
  LeadSource,
  Activity,
  Category,
  DashboardStats
} from '@/types';
import { supabase } from '@/lib/supabase';
import {
  deserializeWorkspace, serializeWorkspace,
  deserializeLeadClient, serializeLeadClient,
  deserializeFollowUp, serializeFollowUp,
  deserializeTag, serializeTag,
  deserializeCustomField, serializeCustomField,
  deserializeLeadSource, serializeLeadSource,
  deserializeActivity, serializeActivity,
} from '@/lib/serialization';
import { useAuth } from './AuthContext';

interface DataContextType {
  // Workspaces
  workspaces: Workspace[];
  addWorkspace: (data: Omit<Workspace, 'id' | 'createdAt'>) => Promise<Workspace>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  getWorkspaceById: (id: string) => Workspace | undefined;
  getActiveWorkspaces: () => Workspace[];

  // Leads/Clients
  leadsClients: LeadClient[];
  addLeadClient: (data: Omit<LeadClient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<LeadClient>;
  updateLeadClient: (id: string, updates: Partial<LeadClient>, userId?: string, userName?: string) => Promise<void>;
  deleteLeadClient: (id: string, userId?: string, userName?: string) => Promise<void>;
  getLeadsClientsByWorkspace: (workspaceId: string) => LeadClient[];
  getLeadsClientsByCategory: (workspaceId: string, category: Category) => LeadClient[];
  getLeadClientById: (id: string) => LeadClient | undefined;
  getDashboardStats: (workspaceId: string) => DashboardStats;

  // Follow-ups
  followUps: FollowUp[];
  addFollowUp: (data: Omit<FollowUp, 'id' | 'createdAt'>, userId?: string, userName?: string) => Promise<FollowUp>;
  updateFollowUp: (id: string, updates: Partial<FollowUp>) => Promise<void>;
  deleteFollowUp: (id: string) => Promise<void>;
  getFollowUpsByLeadClient: (leadClientId: string) => FollowUp[];
  getUpcomingFollowUps: (workspaceId: string, days: number) => FollowUp[];
  getOverdueFollowUps: (workspaceId: string) => FollowUp[];
  completeFollowUp: (id: string, userId: string, userName: string) => Promise<void>;

  // Tags
  tags: Tag[];
  addTag: (data: Omit<Tag, 'id'>) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  getTagsByWorkspace: (workspaceId: string) => Tag[];

  // Custom Fields
  customFields: CustomField[];
  addCustomField: (data: Omit<CustomField, 'id'>) => Promise<CustomField>;
  updateCustomField: (id: string, updates: Partial<CustomField>) => Promise<void>;
  deleteCustomField: (id: string) => Promise<void>;
  getCustomFieldsByWorkspace: (workspaceId: string) => CustomField[];

  // Lead Sources
  leadSources: LeadSource[];
  addLeadSource: (data: Omit<LeadSource, 'id'>) => Promise<LeadSource>;
  deleteLeadSource: (id: string) => Promise<void>;
  getLeadSourcesByWorkspace: (workspaceId: string) => LeadSource[];

  // Activities
  activities: Activity[];
  addActivity: (data: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  getActivitiesByWorkspace: (workspaceId: string, limit?: number) => Activity[];
  getActivitiesByUser: (userId: string, limit?: number) => Activity[];

  // Import/Export
  importLeadsClients: (data: Partial<LeadClient>[], workspaceId: string, userId: string, userName: string) => Promise<number>;
  exportLeadsClients: (workspaceId: string, filters?: any) => Partial<LeadClient>[];

  // Loading
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [leadsClients, setLeadsClients] = useState<LeadClient[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data when authenticated
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setWorkspaces([]);
      setLeadsClients([]);
      setFollowUps([]);
      setTags([]);
      setCustomFields([]);
      setLeadSources([]);
      setActivities([]);
      setIsLoading(false);
      return;
    }

    fetchAllData();
  }, [isAuthenticated, isAuthLoading]);

  async function fetchAllData() {
    setIsLoading(true);
    const [wsRes, lcRes, fuRes, tagRes, cfRes, lsRes, actRes] = await Promise.all([
      supabase.from('workspaces').select('*').order('created_at'),
      supabase.from('lead_clients').select('*').order('created_at', { ascending: false }),
      supabase.from('follow_ups').select('*').order('date'),
      supabase.from('tags').select('*').order('name'),
      supabase.from('custom_fields').select('*').order('order'),
      supabase.from('lead_sources').select('*').order('name'),
      supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(1000),
    ]);

    if (wsRes.data) setWorkspaces(wsRes.data.map(deserializeWorkspace));
    if (lcRes.data) setLeadsClients(lcRes.data.map(deserializeLeadClient));
    if (fuRes.data) setFollowUps(fuRes.data.map(deserializeFollowUp));
    if (tagRes.data) setTags(tagRes.data.map(deserializeTag));
    if (cfRes.data) setCustomFields(cfRes.data.map(deserializeCustomField));
    if (lsRes.data) setLeadSources(lsRes.data.map(deserializeLeadSource));
    if (actRes.data) setActivities(actRes.data.map(deserializeActivity));
    setIsLoading(false);
  }

  // ==================== WORKSPACES ====================

  const addWorkspace = useCallback(async (data: Omit<Workspace, 'id' | 'createdAt'>): Promise<Workspace> => {
    const { data: row, error } = await supabase
      .from('workspaces')
      .insert(serializeWorkspace(data))
      .select()
      .single();
    if (error || !row) throw new Error(error?.message || 'Failed to create workspace');
    const ws = deserializeWorkspace(row);
    setWorkspaces(prev => [...prev, ws]);
    return ws;
  }, []);

  const updateWorkspace = useCallback(async (id: string, updates: Partial<Workspace>) => {
    const { error } = await supabase
      .from('workspaces')
      .update(serializeWorkspace(updates))
      .eq('id', id);
    if (error) throw new Error(error.message);
    setWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, ...updates } : ws));
  }, []);

  const deleteWorkspace = useCallback(async (id: string) => {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setWorkspaces(prev => prev.filter(ws => ws.id !== id));
    setLeadsClients(prev => prev.filter(lc => lc.workspaceId !== id));
    setTags(prev => prev.filter(t => t.workspaceId !== id));
    setCustomFields(prev => prev.filter(cf => cf.workspaceId !== id));
    setLeadSources(prev => prev.filter(ls => ls.workspaceId !== id));
  }, []);

  const getWorkspaceById = useCallback((id: string) => {
    return workspaces.find(ws => ws.id === id);
  }, [workspaces]);

  const getActiveWorkspaces = useCallback(() => {
    return workspaces.filter(ws => ws.isActive);
  }, [workspaces]);

  // ==================== LEAD CLIENTS ====================

  const addLeadClient = useCallback(async (data: Omit<LeadClient, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeadClient> => {
    const { data: row, error } = await supabase
      .from('lead_clients')
      .insert(serializeLeadClient(data))
      .select()
      .single();
    if (error || !row) throw new Error(error?.message || 'Failed to create lead/client');
    const lc = deserializeLeadClient(row);
    setLeadsClients(prev => [...prev, lc]);

    // Add activity
    await addActivity({
      type: 'created',
      entityType: data.category,
      entityId: lc.id,
      workspaceId: data.workspaceId,
      userId: data.createdBy,
      userName: '',
      description: `Created new ${data.category}: ${data.name}`,
    });

    return lc;
  }, []);

  const updateLeadClient = useCallback(async (id: string, updates: Partial<LeadClient>, userId?: string, userName?: string) => {
    const { error } = await supabase
      .from('lead_clients')
      .update(serializeLeadClient(updates))
      .eq('id', id);
    if (error) throw new Error(error.message);

    const oldData = leadsClients.find(lc => lc.id === id);
    setLeadsClients(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
    ));

    if (userId && oldData) {
      const changes: string[] = [];
      if (updates.name && updates.name !== oldData.name) changes.push('name');
      if (updates.subCategory && updates.subCategory !== oldData.subCategory) changes.push('status');
      if (updates.assignedTo && updates.assignedTo !== oldData.assignedTo) changes.push('assignment');

      if (changes.length > 0) {
        await addActivity({
          type: 'updated',
          entityType: oldData.category,
          entityId: id,
          workspaceId: oldData.workspaceId,
          userId,
          userName: userName || '',
          description: `Updated ${oldData.category}: ${updates.name || oldData.name} (${changes.join(', ')})`,
        });
      }
    }
  }, [leadsClients]);

  const deleteLeadClient = useCallback(async (id: string, userId?: string, userName?: string) => {
    const leadClient = leadsClients.find(lc => lc.id === id);
    const { error } = await supabase.from('lead_clients').delete().eq('id', id);
    if (error) throw new Error(error.message);

    setLeadsClients(prev => prev.filter(item => item.id !== id));
    setFollowUps(prev => prev.filter(fu => fu.leadClientId !== id));

    if (userId && leadClient) {
      await addActivity({
        type: 'deleted',
        entityType: leadClient.category,
        entityId: id,
        workspaceId: leadClient.workspaceId,
        userId,
        userName: userName || '',
        description: `Deleted ${leadClient.category}: ${leadClient.name}`,
      });
    }
  }, [leadsClients]);

  const getLeadsClientsByWorkspace = useCallback((workspaceId: string) => {
    return leadsClients.filter(item => item.workspaceId === workspaceId);
  }, [leadsClients]);

  const getLeadsClientsByCategory = useCallback((workspaceId: string, category: Category) => {
    return leadsClients.filter(item => item.workspaceId === workspaceId && item.category === category);
  }, [leadsClients]);

  const getLeadClientById = useCallback((id: string) => {
    return leadsClients.find(item => item.id === id);
  }, [leadsClients]);

  const getDashboardStats = useCallback((workspaceId: string): DashboardStats => {
    const workspaceData = leadsClients.filter(lc => lc.workspaceId === workspaceId);
    const leads = workspaceData.filter(lc => lc.category === 'lead');
    const clients = workspaceData.filter(lc => lc.category === 'client');
    const workspaceFollowUps = followUps.filter(fu => {
      const lc = leadsClients.find(l => l.id === fu.leadClientId);
      return lc?.workspaceId === workspaceId;
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      totalLeads: leads.length,
      totalClients: clients.length,
      hotLeads: leads.filter(l => l.subCategory === 'hot').length,
      warmLeads: leads.filter(l => l.subCategory === 'warm').length,
      coldLeads: leads.filter(l => l.subCategory === 'cold').length,
      activeClients: clients.filter(c => c.subCategory === 'active').length,
      inactiveClients: clients.filter(c => c.subCategory === 'inactive').length,
      overdueFollowUps: workspaceFollowUps.filter(fu =>
        !fu.completed && new Date(fu.date) < today
      ).length,
      todayFollowUps: workspaceFollowUps.filter(fu =>
        !fu.completed && new Date(fu.date).toDateString() === today.toDateString()
      ).length,
      upcomingFollowUps: workspaceFollowUps.filter(fu =>
        !fu.completed && new Date(fu.date) > today
      ).length,
      conversionRate: leads.length > 0 ? Math.round((clients.length / (leads.length + clients.length)) * 100) : 0,
    };
  }, [leadsClients, followUps]);

  // ==================== FOLLOW-UPS ====================

  const addFollowUp = useCallback(async (data: Omit<FollowUp, 'id' | 'createdAt'>, userId?: string, userName?: string): Promise<FollowUp> => {
    const { data: row, error } = await supabase
      .from('follow_ups')
      .insert(serializeFollowUp(data))
      .select()
      .single();
    if (error || !row) throw new Error(error?.message || 'Failed to create follow-up');
    const fu = deserializeFollowUp(row);
    setFollowUps(prev => [...prev, fu]);

    const leadClient = leadsClients.find(lc => lc.id === data.leadClientId);
    if (userId && leadClient) {
      await addActivity({
        type: 'follow_up_added',
        entityType: leadClient.category,
        entityId: data.leadClientId,
        workspaceId: leadClient.workspaceId,
        userId,
        userName: userName || '',
        description: `Scheduled ${data.category} follow-up for ${leadClient.name}`,
      });
    }

    return fu;
  }, [leadsClients]);

  const updateFollowUp = useCallback(async (id: string, updates: Partial<FollowUp>) => {
    const { error } = await supabase
      .from('follow_ups')
      .update(serializeFollowUp(updates))
      .eq('id', id);
    if (error) throw new Error(error.message);
    setFollowUps(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const deleteFollowUp = useCallback(async (id: string) => {
    const { error } = await supabase.from('follow_ups').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setFollowUps(prev => prev.filter(item => item.id !== id));
  }, []);

  const getFollowUpsByLeadClient = useCallback((leadClientId: string) => {
    return followUps.filter(item => item.leadClientId === leadClientId);
  }, [followUps]);

  const getUpcomingFollowUps = useCallback((workspaceId: string, days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return followUps.filter(fu => {
      const leadClient = leadsClients.find(lc => lc.id === fu.leadClientId);
      return leadClient?.workspaceId === workspaceId &&
             !fu.completed &&
             new Date(fu.date) <= cutoffDate &&
             new Date(fu.date) >= new Date();
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [followUps, leadsClients]);

  const getOverdueFollowUps = useCallback((workspaceId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return followUps.filter(fu => {
      const leadClient = leadsClients.find(lc => lc.id === fu.leadClientId);
      return leadClient?.workspaceId === workspaceId &&
             !fu.completed &&
             new Date(fu.date) < today;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [followUps, leadsClients]);

  const completeFollowUp = useCallback(async (id: string, userId: string, userName: string) => {
    const followUp = followUps.find(fu => fu.id === id);
    if (!followUp) return;

    const updates = {
      completed: true,
      completedAt: new Date(),
      completedBy: userId,
    };

    const { error } = await supabase
      .from('follow_ups')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: userId,
      })
      .eq('id', id);
    if (error) throw new Error(error.message);

    setFollowUps(prev => prev.map(fu =>
      fu.id === id ? { ...fu, ...updates } : fu
    ));

    const leadClient = leadsClients.find(lc => lc.id === followUp.leadClientId);
    if (leadClient) {
      await addActivity({
        type: 'follow_up_completed',
        entityType: leadClient.category,
        entityId: followUp.leadClientId,
        workspaceId: leadClient.workspaceId,
        userId,
        userName,
        description: `Completed ${followUp.category} follow-up for ${leadClient.name}`,
      });
    }
  }, [followUps, leadsClients]);

  // ==================== TAGS ====================

  const addTag = useCallback(async (data: Omit<Tag, 'id'>): Promise<Tag> => {
    const { data: row, error } = await supabase
      .from('tags')
      .insert(serializeTag(data))
      .select()
      .single();
    if (error || !row) throw new Error(error?.message || 'Failed to create tag');
    const tag = deserializeTag(row);
    setTags(prev => [...prev, tag]);
    return tag;
  }, []);

  const updateTag = useCallback(async (id: string, updates: Partial<Tag>) => {
    const { error } = await supabase
      .from('tags')
      .update(serializeTag(updates))
      .eq('id', id);
    if (error) throw new Error(error.message);
    setTags(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const deleteTag = useCallback(async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setTags(prev => prev.filter(item => item.id !== id));
    setLeadsClients(prev => prev.map(lc => ({
      ...lc,
      tags: lc.tags.filter(t => t !== id)
    })));
  }, []);

  const getTagsByWorkspace = useCallback((workspaceId: string) => {
    return tags.filter(item => item.workspaceId === workspaceId);
  }, [tags]);

  // ==================== CUSTOM FIELDS ====================

  const addCustomField = useCallback(async (data: Omit<CustomField, 'id'>): Promise<CustomField> => {
    const { data: row, error } = await supabase
      .from('custom_fields')
      .insert(serializeCustomField(data))
      .select()
      .single();
    if (error || !row) throw new Error(error?.message || 'Failed to create custom field');
    const cf = deserializeCustomField(row);
    setCustomFields(prev => [...prev, cf]);
    return cf;
  }, []);

  const updateCustomField = useCallback(async (id: string, updates: Partial<CustomField>) => {
    const { error } = await supabase
      .from('custom_fields')
      .update(serializeCustomField(updates))
      .eq('id', id);
    if (error) throw new Error(error.message);
    setCustomFields(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const deleteCustomField = useCallback(async (id: string) => {
    const { error } = await supabase.from('custom_fields').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setCustomFields(prev => prev.filter(item => item.id !== id));
  }, []);

  const getCustomFieldsByWorkspace = useCallback((workspaceId: string) => {
    return customFields.filter(item => item.workspaceId === workspaceId);
  }, [customFields]);

  // ==================== LEAD SOURCES ====================

  const addLeadSource = useCallback(async (data: Omit<LeadSource, 'id'>): Promise<LeadSource> => {
    const { data: row, error } = await supabase
      .from('lead_sources')
      .insert(serializeLeadSource(data))
      .select()
      .single();
    if (error || !row) throw new Error(error?.message || 'Failed to create lead source');
    const ls = deserializeLeadSource(row);
    setLeadSources(prev => [...prev, ls]);
    return ls;
  }, []);

  const deleteLeadSource = useCallback(async (id: string) => {
    const { error } = await supabase.from('lead_sources').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setLeadSources(prev => prev.filter(item => item.id !== id));
  }, []);

  const getLeadSourcesByWorkspace = useCallback((workspaceId: string) => {
    return leadSources.filter(item => item.workspaceId === workspaceId);
  }, [leadSources]);

  // ==================== ACTIVITIES ====================

  const addActivity = useCallback(async (data: Omit<Activity, 'id' | 'createdAt'>) => {
    const { data: row, error } = await supabase
      .from('activities')
      .insert(serializeActivity(data))
      .select()
      .single();
    if (error) {
      console.error('Failed to log activity:', error.message);
      return;
    }
    if (row) {
      const act = deserializeActivity(row);
      setActivities(prev => [act, ...prev].slice(0, 1000));
    }
  }, []);

  const getActivitiesByWorkspace = useCallback((workspaceId: string, limit = 50) => {
    return activities
      .filter(act => act.workspaceId === workspaceId)
      .slice(0, limit);
  }, [activities]);

  const getActivitiesByUser = useCallback((userId: string, limit = 50) => {
    return activities
      .filter(act => act.userId === userId)
      .slice(0, limit);
  }, [activities]);

  // ==================== IMPORT/EXPORT ====================

  const importLeadsClients = useCallback(async (data: Partial<LeadClient>[], workspaceId: string, userId: string, userName: string): Promise<number> => {
    const rows = data.map(item => ({
      name: item.name || 'Unknown',
      phone_number: item.phoneNumber || '',
      email: item.email || '',
      company_name: item.companyName || '',
      notes: item.notes || '',
      last_follow_up_date: item.lastFollowUpDate ? new Date(item.lastFollowUpDate).toISOString() : null,
      next_follow_up_date: item.nextFollowUpDate ? new Date(item.nextFollowUpDate).toISOString() : null,
      follow_up_category: item.followUpCategory || 'other',
      category: item.category || 'lead',
      sub_category: item.subCategory || 'cold',
      assigned_to: item.assignedTo || userId,
      workspace_id: workspaceId,
      tags: item.tags || [],
      custom_fields: item.customFields || {},
      source: item.source || null,
      created_by: userId,
    }));

    const { data: inserted, error } = await supabase
      .from('lead_clients')
      .insert(rows)
      .select();

    if (error) throw new Error(error.message);
    if (inserted) {
      const newItems = inserted.map(deserializeLeadClient);
      setLeadsClients(prev => [...prev, ...newItems]);

      await addActivity({
        type: 'created',
        entityType: 'lead',
        entityId: 'bulk',
        workspaceId,
        userId,
        userName,
        description: `Imported ${newItems.length} records`,
      });

      return newItems.length;
    }
    return 0;
  }, []);

  const exportLeadsClients = useCallback((workspaceId: string, filters?: any): Partial<LeadClient>[] => {
    let data = leadsClients.filter(lc => lc.workspaceId === workspaceId);

    if (filters?.category && filters.category !== 'all') {
      data = data.filter(lc => lc.category === filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      data = data.filter(lc => lc.subCategory === filters.status);
    }
    if (filters?.assignedTo && filters.assignedTo !== 'all') {
      data = data.filter(lc => lc.assignedTo === filters.assignedTo);
    }

    return data.map(({ id, createdAt, updatedAt, ...rest }) => rest);
  }, [leadsClients]);

  return (
    <DataContext.Provider value={{
      workspaces,
      addWorkspace,
      updateWorkspace,
      deleteWorkspace,
      getWorkspaceById,
      getActiveWorkspaces,
      leadsClients,
      addLeadClient,
      updateLeadClient,
      deleteLeadClient,
      getLeadsClientsByWorkspace,
      getLeadsClientsByCategory,
      getLeadClientById,
      getDashboardStats,
      followUps,
      addFollowUp,
      updateFollowUp,
      deleteFollowUp,
      getFollowUpsByLeadClient,
      getUpcomingFollowUps,
      getOverdueFollowUps,
      completeFollowUp,
      tags,
      addTag,
      updateTag,
      deleteTag,
      getTagsByWorkspace,
      customFields,
      addCustomField,
      updateCustomField,
      deleteCustomField,
      getCustomFieldsByWorkspace,
      leadSources,
      addLeadSource,
      deleteLeadSource,
      getLeadSourcesByWorkspace,
      activities,
      addActivity,
      getActivitiesByWorkspace,
      getActivitiesByUser,
      importLeadsClients,
      exportLeadsClients,
      isLoading,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
