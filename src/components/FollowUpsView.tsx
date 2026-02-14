import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  Phone, 
  Mail, 
  MessageSquare, 
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  User,
  Building2
} from 'lucide-react';
import { FollowUpModal } from '@/components/FollowUpModal';
import type { Category, FollowUp } from '@/types';
import { format, isPast, isToday, isTomorrow, addDays, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

interface FollowUpsViewProps {
  workspaceId: string;
  canDelete: boolean;
}

const followUpCategories = [
  { value: 'call', label: 'Call', icon: Phone, color: 'text-blue-500 bg-blue-50' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-green-500 bg-green-50' },
  { value: 'meeting', label: 'Meeting', icon: MessageSquare, color: 'text-purple-500 bg-purple-50' },
  { value: 'follow_up', label: 'Follow-up', icon: Clock, color: 'text-orange-500 bg-orange-50' },
  { value: 'other', label: 'Other', icon: Tag, color: 'text-gray-500 bg-gray-50' },
];

export function FollowUpsView({ workspaceId, canDelete }: FollowUpsViewProps) {
  const { currentUser } = useAuth();
  const {
    getLeadsClientsByWorkspace,
    followUps,
    completeFollowUp,
    deleteFollowUp,
    getLeadClientById
  } = useData();
  const [selectedCategory, setSelectedCategory] = useState<Category>('lead');
  const [timeFilter, setTimeFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);

  const workspaceLeadsClients = getLeadsClientsByWorkspace(workspaceId);
  const workspaceLeadClientIds = new Set(workspaceLeadsClients.map(lc => lc.id));

  const filteredFollowUps = useMemo(() => {
    let filtered = followUps.filter(fu => {
      const leadClient = getLeadClientById(fu.leadClientId);
      return leadClient && 
             workspaceLeadClientIds.has(fu.leadClientId) &&
             leadClient.category === selectedCategory;
    });

    const now = new Date();

    switch (timeFilter) {
      case 'overdue':
        filtered = filtered.filter(fu => !fu.completed && isPast(new Date(fu.date)) && !isToday(new Date(fu.date)));
        break;
      case 'today':
        filtered = filtered.filter(fu => isToday(new Date(fu.date)));
        break;
      case 'upcoming':
        filtered = filtered.filter(fu => {
          const date = new Date(fu.date);
          return isTomorrow(date) || isWithinInterval(date, { start: addDays(now, 2), end: addDays(now, 7) });
        });
        break;
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [followUps, workspaceLeadClientIds, getLeadClientById, selectedCategory, timeFilter]);

  const getLeadClient = (id: string) => {
    return getLeadClientById(id);
  };

  const getCategoryDisplay = (category: string) => {
    const config = followUpCategories.find(c => c.value === category);
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getDateStatus = (date: Date, completed: boolean) => {
    if (completed) return { label: 'Completed', color: 'text-green-600 bg-green-50' };
    if (isToday(date)) return { label: 'Today', color: 'text-blue-600 bg-blue-50' };
    if (isTomorrow(date)) return { label: 'Tomorrow', color: 'text-purple-600 bg-purple-50' };
    if (isPast(date)) return { label: 'Overdue', color: 'text-red-600 bg-red-50' };
    return { label: 'Upcoming', color: 'text-gray-600 bg-gray-50' };
  };

  const handleComplete = async (followUp: FollowUp) => {
    if (followUp.completed) {
      toast.info('Follow-up already completed');
      return;
    }
    await completeFollowUp(followUp.id, currentUser?.id || '', currentUser?.name || '');
    toast.success('Follow-up completed!');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this follow-up?')) {
      await deleteFollowUp(id);
      toast.success('Follow-up deleted');
    }
  };

  const stats = useMemo(() => {
    const all = followUps.filter(fu => workspaceLeadClientIds.has(fu.leadClientId));
    return {
      total: all.length,
      completed: all.filter(fu => fu.completed).length,
      overdue: all.filter(fu => !fu.completed && isPast(new Date(fu.date)) && !isToday(new Date(fu.date))).length,
      today: all.filter(fu => isToday(new Date(fu.date))).length,
    };
  }, [followUps, workspaceLeadClientIds]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#7567F8]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#7567F8]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#333333]">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Follow-ups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#333333]">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#333333]">{stats.overdue}</p>
                <p className="text-xs text-gray-500">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#333333]">{stats.today}</p>
                <p className="text-xs text-gray-500">Due Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Category)}>
          <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200">
            <TabsTrigger 
              value="lead"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7567F8] data-[state=active]:to-[#9B9BFF] data-[state=active]:text-white"
            >
              Lead Follow-ups
            </TabsTrigger>
            <TabsTrigger 
              value="client"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7567F8] data-[state=active]:to-[#9B9BFF] data-[state=active]:text-white"
            >
              Client Follow-ups
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as typeof timeFilter)}>
          <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              All
            </TabsTrigger>
            <TabsTrigger value="overdue" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Overdue
            </TabsTrigger>
            <TabsTrigger value="today" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Today
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Upcoming
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Follow-ups List */}
      <div className="space-y-3">
        {filteredFollowUps.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-500">No follow-ups found</p>
              <p className="text-sm text-gray-400">Schedule follow-ups from the database view</p>
            </CardContent>
          </Card>
        ) : (
          filteredFollowUps.map((followUp) => {
            const leadClient = getLeadClient(followUp.leadClientId);
            if (!leadClient) return null;

            const dateStatus = getDateStatus(new Date(followUp.date), followUp.completed);

            return (
              <Card 
                key={followUp.id} 
                className={`border-0 shadow-md bg-white/90 backdrop-blur-sm transition-all hover:shadow-lg ${
                  followUp.completed ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={followUp.completed}
                      onCheckedChange={() => handleComplete(followUp)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7567F8] to-[#9B9BFF] flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {leadClient.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className={`font-medium ${followUp.completed ? 'line-through text-gray-400' : 'text-[#333333]'}`}>
                              {leadClient.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Building2 className="w-3 h-3" />
                              {leadClient.companyName}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getCategoryDisplay(followUp.category)}
                          <Badge variant="secondary" className={dateStatus.color}>
                            {dateStatus.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(followUp.date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {followUp.createdBy}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingFollowUp(followUp)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(followUp.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {followUp.notes && (
                        <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                          {followUp.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {editingFollowUp && (
        <FollowUpModal
          isOpen={!!editingFollowUp}
          onClose={() => setEditingFollowUp(null)}
          followUp={editingFollowUp}
        />
      )}
    </div>
  );
}
