import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  Tag,
  Flame,
  Thermometer,
  Snowflake,
  XCircle,
  CheckCircle2,
  PauseCircle,
  Clock,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  History
} from 'lucide-react';
import { LeadClientModal } from '@/components/LeadClientModal';
import { FollowUpModal } from '@/components/FollowUpModal';
import type { LeadClient, FollowUp } from '@/types';
import { format, isPast, isToday } from 'date-fns';
import { toast } from 'sonner';

interface LeadClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadClient: LeadClient;
  canDelete: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  hot: { label: 'Hot Lead', icon: Flame, color: 'text-red-500 bg-red-50' },
  warm: { label: 'Warm Lead', icon: Thermometer, color: 'text-orange-500 bg-orange-50' },
  cold: { label: 'Cold Lead', icon: Snowflake, color: 'text-blue-500 bg-blue-50' },
  dead: { label: 'Dead', icon: XCircle, color: 'text-gray-500 bg-gray-50' },
  active: { label: 'Active Client', icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
  inactive: { label: 'Inactive Client', icon: PauseCircle, color: 'text-yellow-500 bg-yellow-50' },
};

const followUpConfig: Record<string, { label: string; icon: React.ElementType }> = {
  call: { label: 'Call', icon: Phone },
  email: { label: 'Email', icon: Mail },
  meeting: { label: 'Meeting', icon: Calendar },
  follow_up: { label: 'Follow-up', icon: Clock },
  other: { label: 'Other', icon: Tag },
};

export function LeadClientDetailsModal({ isOpen, onClose, leadClient, canDelete }: LeadClientDetailsModalProps) {
  const { currentUser } = useAuth();
  const { 
    getTagsByWorkspace, 
    getFollowUpsByLeadClient,
    deleteLeadClient,
    completeFollowUp
  } = useData();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);

  const workspaceTags = getTagsByWorkspace(leadClient.workspaceId);
  const followUps = getFollowUpsByLeadClient(leadClient.id);

  const status = statusConfig[leadClient.subCategory];
  const StatusIcon = status?.icon || User;

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      await deleteLeadClient(leadClient.id, currentUser?.id, currentUser?.name);
      toast.success('Deleted successfully');
      onClose();
    }
  };

  const handleCompleteFollowUp = async (followUp: FollowUp) => {
    if (followUp.completed) return;
    await completeFollowUp(followUp.id, currentUser?.id || '', currentUser?.name || '');
    toast.success('Follow-up completed!');
  };

  const getTagColor = (tagName: string) => {
    const tag = workspaceTags.find(t => t.name === tagName);
    return tag?.color || '#6b7280';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7567F8] to-[#9B9BFF] flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {leadClient.name.charAt(0)}
                </span>
              </div>
              <div>
                <DialogTitle className="text-2xl">{leadClient.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={status?.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status?.label}
                  </Badge>
                  <Badge variant="outline" className="text-gray-500">
                    {leadClient.category === 'lead' ? 'Lead' : 'Client'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="followups">
              Follow-ups
              {followUps.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-[#7567F8] text-white">
                  {followUps.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{leadClient.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{leadClient.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{leadClient.companyName || 'Not provided'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Follow-up Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Follow-up Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Category: {followUpConfig[leadClient.followUpCategory]?.label || leadClient.followUpCategory}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Last Follow-up: {leadClient.lastFollowUpDate 
                      ? format(new Date(leadClient.lastFollowUpDate), 'MMM d, yyyy')
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Next Follow-up: {leadClient.nextFollowUpDate 
                      ? format(new Date(leadClient.nextFollowUpDate), 'MMM d, yyyy')
                      : 'Not scheduled'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Assigned to: {leadClient.assignedTo}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {leadClient.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {leadClient.tags.map((tagName) => (
                      <Badge
                        key={tagName}
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${getTagColor(tagName)}20`,
                          color: getTagColor(tagName)
                        }}
                      >
                        {tagName}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Custom Fields */}
            {Object.keys(leadClient.customFields).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Custom Fields
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(leadClient.customFields).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-1">
                      <span className="text-gray-500">{key}</span>
                      <span className="text-gray-800 font-medium">{value || '-'}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {leadClient.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 whitespace-pre-wrap">{leadClient.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="followups" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Follow-ups</h3>
              <Button
                size="sm"
                onClick={() => setIsAddingFollowUp(true)}
                className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Follow-up
              </Button>
            </div>

            {followUps.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No follow-ups scheduled</p>
                </CardContent>
              </Card>
            ) : (
              followUps.map((followUp) => {
                const isOverdue = !followUp.completed && isPast(new Date(followUp.date)) && !isToday(new Date(followUp.date));
                const config = followUpConfig[followUp.category];
                const CategoryIcon = config?.icon || Tag;

                return (
                  <Card 
                    key={followUp.id}
                    className={`${followUp.completed ? 'opacity-60' : ''} ${isOverdue ? 'border-red-200 bg-red-50/50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleCompleteFollowUp(followUp)}
                          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            followUp.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-[#7567F8]'
                          }`}
                        >
                          {followUp.completed && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CategoryIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{config?.label || followUp.category}</span>
                            {isOverdue && (
                              <Badge variant="secondary" className="bg-red-100 text-red-600">
                                Overdue
                              </Badge>
                            )}
                            {followUp.completed && (
                              <Badge variant="secondary" className="bg-green-100 text-green-600">
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {format(new Date(followUp.date), 'MMM d, yyyy')} • {followUp.createdBy}
                          </p>
                          {followUp.notes && (
                            <p className="mt-2 text-sm text-gray-600">{followUp.notes}</p>
                          )}
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFollowUp(followUp)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(leadClient.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                
                {leadClient.lastFollowUpDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Follow-up</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(leadClient.lastFollowUpDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <History className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(leadClient.updatedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        {isEditing && (
          <LeadClientModal
            isOpen={isEditing}
            onClose={() => setIsEditing(false)}
            workspaceId={leadClient.workspaceId}
            editData={leadClient}
          />
        )}

        {/* Add Follow-up Modal */}
        {isAddingFollowUp && (
          <FollowUpModal
            isOpen={isAddingFollowUp}
            onClose={() => setIsAddingFollowUp(false)}
            leadClientId={leadClient.id}
          />
        )}

        {/* Edit Follow-up Modal */}
        {editingFollowUp && (
          <FollowUpModal
            isOpen={!!editingFollowUp}
            onClose={() => setEditingFollowUp(null)}
            followUp={editingFollowUp}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
