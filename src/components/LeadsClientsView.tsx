import { useState, useMemo } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Filter, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  Building2, 
  Calendar,
  Tag,
  User,
  Edit,
  Trash2,
  Eye,
  Flame,
  Thermometer,
  Snowflake,
  XCircle,
  CheckCircle2,
  PauseCircle,
  Download
} from 'lucide-react';
import { LeadClientModal } from '@/components/LeadClientModal';
import { LeadClientDetailsModal } from '@/components/LeadClientDetailsModal';
import type { Category, LeadStatus, ClientStatus, LeadClient } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface LeadsClientsViewProps {
  workspaceId: string;
  searchQuery: string;
  canDelete: boolean;
}

const leadStatuses: { value: LeadStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'hot', label: 'Hot', icon: Flame, color: 'text-red-500 bg-red-50' },
  { value: 'warm', label: 'Warm', icon: Thermometer, color: 'text-orange-500 bg-orange-50' },
  { value: 'cold', label: 'Cold', icon: Snowflake, color: 'text-blue-500 bg-blue-50' },
  { value: 'dead', label: 'Dead', icon: XCircle, color: 'text-gray-500 bg-gray-50' },
];

const clientStatuses: { value: ClientStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'active', label: 'Active', icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
  { value: 'inactive', label: 'Inactive', icon: PauseCircle, color: 'text-yellow-500 bg-yellow-50' },
  { value: 'dead', label: 'Dead', icon: XCircle, color: 'text-gray-500 bg-gray-50' },
];

const followUpCategories = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Calendar },
  { value: 'follow_up', label: 'Follow-up', icon: Calendar },
  { value: 'other', label: 'Other', icon: Tag },
];

export function LeadsClientsView({ workspaceId, searchQuery, canDelete }: LeadsClientsViewProps) {
  const { getLeadsClientsByWorkspace, deleteLeadClient, getTagsByWorkspace, exportLeadsClients } = useData();
  const [selectedCategory, setSelectedCategory] = useState<Category>('lead');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<LeadClient | null>(null);
  const [viewingItem, setViewingItem] = useState<LeadClient | null>(null);

  const workspaceTags = getTagsByWorkspace(workspaceId);

  const data = useMemo(() => {
    let filtered = getLeadsClientsByWorkspace(workspaceId).filter(
      item => item.category === selectedCategory
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.subCategory === statusFilter);
    }

    if (assignedFilter !== 'all') {
      filtered = filtered.filter(item => item.assignedTo === assignedFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.companyName.toLowerCase().includes(query) ||
        item.phoneNumber.includes(query)
      );
    }

    return filtered;
  }, [getLeadsClientsByWorkspace, workspaceId, selectedCategory, statusFilter, assignedFilter, searchQuery]);

  const assignedUsers = useMemo(() => {
    const users = new Set<string>();
    getLeadsClientsByWorkspace(workspaceId).forEach(item => {
      if (item.assignedTo) users.add(item.assignedTo);
    });
    return Array.from(users);
  }, [getLeadsClientsByWorkspace, workspaceId]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      await deleteLeadClient(id);
      toast.success('Item deleted successfully');
    }
  };

  const handleExport = () => {
    const exportData = exportLeadsClients(workspaceId, {
      category: selectedCategory,
      status: statusFilter,
      assignedTo: assignedFilter,
    });
    
    const csv = convertToCSV(exportData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${workspaceId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(h => JSON.stringify(obj[h] || '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const getStatusDisplay = (status: LeadStatus | ClientStatus, category: Category) => {
    const statuses = category === 'lead' ? leadStatuses : clientStatuses;
    const statusConfig = statuses.find(s => s.value === status);
    if (!statusConfig) return null;
    const Icon = statusConfig.icon;
    return (
      <Badge variant="secondary" className={`${statusConfig.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getFollowUpDisplay = (category: string) => {
    const config = followUpCategories.find(c => c.value === category);
    if (!config) return category;
    const Icon = config.icon;
    return (
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Icon className="w-3 h-3" />
        {config.label}
      </div>
    );
  };

  const getTagDisplay = (tagName: string) => {
    const tag = workspaceTags.find(t => t.name === tagName);
    return (
      <Badge 
        key={tagName} 
        variant="secondary" 
        className="text-xs"
        style={{ 
          backgroundColor: tag ? `${tag.color}20` : '#f3f4f6',
          color: tag?.color || '#6b7280',
        }}
      >
        {tagName}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Category)}>
          <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200">
            <TabsTrigger 
              value="lead"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7567F8] data-[state=active]:to-[#9B9BFF] data-[state=active]:text-white"
            >
              Leads
            </TabsTrigger>
            <TabsTrigger 
              value="client"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7567F8] data-[state=active]:to-[#9B9BFF] data-[state=active]:text-white"
            >
              Clients
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-gray-200">
                <Filter className="w-4 h-4 mr-2" />
                Status
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="ml-2 bg-[#7567F8] text-white">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Statuses
              </DropdownMenuItem>
              {(selectedCategory === 'lead' ? leadStatuses : clientStatuses).map((status) => (
                <DropdownMenuItem key={status.value} onClick={() => setStatusFilter(status.value)}>
                  <status.icon className={`w-4 h-4 mr-2 ${status.color.split(' ')[0]}`} />
                  {status.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Assigned To Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-gray-200">
                <User className="w-4 h-4 mr-2" />
                Assigned
                {assignedFilter !== 'all' && (
                  <Badge variant="secondary" className="ml-2 bg-[#7567F8] text-white">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setAssignedFilter('all')}>
                All Users
              </DropdownMenuItem>
              {assignedUsers.map((user) => (
                <DropdownMenuItem key={user} onClick={() => setAssignedFilter(user)}>
                  <User className="w-4 h-4 mr-2" />
                  {user}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {(statusFilter !== 'all' || assignedFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setAssignedFilter('all');
              }}
              className="text-gray-500"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-medium text-gray-600">Name</TableHead>
                  <TableHead className="font-medium text-gray-600">Contact</TableHead>
                  <TableHead className="font-medium text-gray-600">Company</TableHead>
                  <TableHead className="font-medium text-gray-600">Status</TableHead>
                  <TableHead className="font-medium text-gray-600">Follow-up</TableHead>
                  <TableHead className="font-medium text-gray-600">Assigned</TableHead>
                  <TableHead className="font-medium text-gray-600">Tags</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center text-gray-400">
                        <Filter className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-lg font-medium">No items found</p>
                        <p className="text-sm">Try adjusting your filters or add new items</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className="group hover:bg-[#7567F8]/5 transition-colors cursor-pointer"
                      onClick={() => setViewingItem(item)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7567F8] to-[#9B9BFF] flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {item.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#333333]">{item.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            {item.phoneNumber}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            {item.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Building2 className="w-3 h-3" />
                          {item.companyName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusDisplay(item.subCategory, item.category)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getFollowUpDisplay(item.followUpCategory)}
                          {item.nextFollowUpDate && (
                            <p className="text-xs text-gray-500">
                              {format(new Date(item.nextFollowUpDate), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User className="w-3 h-3" />
                          {item.assignedTo}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 2).map(getTagDisplay)}
                          {item.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setViewingItem(item);
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(item);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {canDelete && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item.id);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingItem && (
        <LeadClientModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          workspaceId={workspaceId}
          editData={editingItem}
        />
      )}

      {/* View Details Modal */}
      {viewingItem && (
        <LeadClientDetailsModal
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          leadClient={viewingItem}
          canDelete={canDelete}
        />
      )}
    </div>
  );
}
