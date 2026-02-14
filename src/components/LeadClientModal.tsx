import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Calendar as CalendarIcon, 
  Flame,
  Thermometer,
  Snowflake,
  XCircle,
  CheckCircle2,
  PauseCircle
} from 'lucide-react';
import { format } from 'date-fns';
import type { Category, LeadStatus, ClientStatus, FollowUpCategory, LeadClient } from '@/types';
import { toast } from 'sonner';

interface LeadClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  editData?: LeadClient | null;
}

const leadStatuses: { value: LeadStatus; label: string; icon: React.ElementType }[] = [
  { value: 'hot', label: 'Hot Lead', icon: Flame },
  { value: 'warm', label: 'Warm Lead', icon: Thermometer },
  { value: 'cold', label: 'Cold Lead', icon: Snowflake },
  { value: 'dead', label: 'Dead Lead', icon: XCircle },
];

const clientStatuses: { value: ClientStatus; label: string; icon: React.ElementType }[] = [
  { value: 'active', label: 'Active Client', icon: CheckCircle2 },
  { value: 'inactive', label: 'Inactive Client', icon: PauseCircle },
  { value: 'dead', label: 'Dead Client', icon: XCircle },
];

const followUpCategories: { value: FollowUpCategory; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other', label: 'Other' },
];

export function LeadClientModal({ isOpen, onClose, workspaceId, editData }: LeadClientModalProps) {
  const { currentUser } = useAuth();
  const { addLeadClient, updateLeadClient, getTagsByWorkspace, getCustomFieldsByWorkspace, getLeadSourcesByWorkspace } = useData();
  
  const [category, setCategory] = useState<Category>('lead');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');
  const [subCategory, setSubCategory] = useState<LeadStatus | ClientStatus>('cold');
  const [followUpCategory, setFollowUpCategory] = useState<FollowUpCategory>('other');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date | null>(null);
  const [assignedTo, setAssignedTo] = useState(currentUser?.name || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [source, setSource] = useState('');

  const workspaceTags = getTagsByWorkspace(workspaceId);
  const workspaceCustomFields = getCustomFieldsByWorkspace(workspaceId);
  const workspaceSources = getLeadSourcesByWorkspace(workspaceId);

  useEffect(() => {
    if (editData) {
      setCategory(editData.category);
      setName(editData.name);
      setPhoneNumber(editData.phoneNumber);
      setEmail(editData.email);
      setCompanyName(editData.companyName);
      setNotes(editData.notes);
      setSubCategory(editData.subCategory);
      setFollowUpCategory(editData.followUpCategory);
      setNextFollowUpDate(editData.nextFollowUpDate);
      setAssignedTo(editData.assignedTo);
      setSelectedTags(editData.tags);
      setCustomFieldValues(editData.customFields);
      setSource(editData.source || '');
    } else {
      resetForm();
    }
  }, [editData, isOpen]);

  const resetForm = () => {
    setCategory('lead');
    setName('');
    setPhoneNumber('');
    setEmail('');
    setCompanyName('');
    setNotes('');
    setSubCategory('cold');
    setFollowUpCategory('other');
    setNextFollowUpDate(null);
    setAssignedTo(currentUser?.name || '');
    setSelectedTags([]);
    setCustomFieldValues({});
    setSource('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    const data = {
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      companyName: companyName.trim(),
      notes: notes.trim(),
      lastFollowUpDate: editData?.lastFollowUpDate || null,
      nextFollowUpDate,
      followUpCategory,
      category,
      subCategory,
      assignedTo,
      workspaceId,
      tags: selectedTags,
      customFields: customFieldValues,
      source: source && source !== 'none' ? source : undefined,
    };

    try {
      if (editData) {
        await updateLeadClient(editData.id, data, currentUser?.id, currentUser?.name);
        toast.success('Updated successfully');
      } else {
        await addLeadClient({ ...data, createdBy: currentUser?.id || '' });
        toast.success('Added successfully');
      }
      onClose();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const statuses = category === 'lead' ? leadStatuses : clientStatuses;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editData ? 'Edit' : 'Add New'} {category === 'lead' ? 'Lead' : 'Client'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={category === 'lead' ? 'default' : 'outline'}
              onClick={() => {
                setCategory('lead');
                setSubCategory('cold');
              }}
              className={category === 'lead' ? 'bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]' : ''}
            >
              Lead
            </Button>
            <Button
              type="button"
              variant={category === 'client' ? 'default' : 'outline'}
              onClick={() => {
                setCategory('client');
                setSubCategory('active');
              }}
              className={category === 'client' ? 'bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]' : ''}
            >
              Client
            </Button>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 555-0000"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company Inc."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status & Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={subCategory} onValueChange={(v) => setSubCategory(v as LeadStatus | ClientStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <status.icon className="w-4 h-4" />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {workspaceSources.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Enter name of assignee"
            />
          </div>

          {/* Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Follow-up Category</Label>
              <Select value={followUpCategory} onValueChange={(v) => setFollowUpCategory(v as FollowUpCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {followUpCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Next Follow-up Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextFollowUpDate ? format(nextFollowUpDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={nextFollowUpDate || undefined}
                    onSelect={(date) => setNextFollowUpDate(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {workspaceTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.name) ? 'default' : 'secondary'}
                  className={`cursor-pointer transition-all ${
                    selectedTags.includes(tag.name)
                      ? ''
                      : 'hover:bg-gray-200'
                  }`}
                  style={
                    selectedTags.includes(tag.name)
                      ? { backgroundColor: tag.color }
                      : {}
                  }
                  onClick={() => toggleTag(tag.name)}
                >
                  {tag.name}
                </Badge>
              ))}
              {workspaceTags.length === 0 && (
                <p className="text-sm text-gray-500">No tags available. Create tags in settings.</p>
              )}
            </div>
          </div>

          {/* Custom Fields */}
          {workspaceCustomFields.length > 0 && (
            <div className="space-y-4">
              <Label>Custom Fields</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspaceCustomFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-sm text-gray-600">{field.name}</Label>
                    {field.type === 'select' && field.options ? (
                      <Select
                        value={customFieldValues[field.name] || ''}
                        onValueChange={(v) => setCustomFieldValues(prev => ({ ...prev, [field.name]: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        value={customFieldValues[field.name] || ''}
                        onChange={(e) => setCustomFieldValues(prev => ({ 
                          ...prev, 
                          [field.name]: e.target.value 
                        }))}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={customFieldValues[field.name] || ''}
                        onChange={(e) => setCustomFieldValues(prev => ({ 
                          ...prev, 
                          [field.name]: e.target.value 
                        }))}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF] hover:from-[#6558E8] hover:to-[#8B8BEF]"
            >
              {editData ? 'Save Changes' : 'Add'} {category === 'lead' ? 'Lead' : 'Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
