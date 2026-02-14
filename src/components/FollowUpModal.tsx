import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Phone, Mail, MessageSquare, Clock, Tag, CheckCircle2 } from 'lucide-react';
import type { FollowUpCategory, FollowUp } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadClientId?: string;
  followUp?: FollowUp | null;
}

const categories: { value: FollowUpCategory; label: string; icon: React.ElementType }[] = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: MessageSquare },
  { value: 'follow_up', label: 'Follow-up', icon: Clock },
  { value: 'other', label: 'Other', icon: Tag },
];

export function FollowUpModal({ isOpen, onClose, leadClientId, followUp }: FollowUpModalProps) {
  const { currentUser } = useAuth();
  const { addFollowUp, updateFollowUp, getLeadClientById } = useData();
  
  const [category, setCategory] = useState<FollowUpCategory>('call');
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);

  const leadClient = leadClientId ? getLeadClientById(leadClientId) : null;

  useEffect(() => {
    if (followUp) {
      setCategory(followUp.category);
      setDate(new Date(followUp.date));
      setNotes(followUp.notes);
      setCompleted(followUp.completed);
    } else {
      setCategory('call');
      setDate(new Date());
      setNotes('');
      setCompleted(false);
    }
  }, [followUp, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error('Please select a date');
      return;
    }

    const data = {
      category,
      date,
      notes: notes.trim(),
      completed,
    };

    try {
      if (followUp) {
        await updateFollowUp(followUp.id, data);
        toast.success('Follow-up updated');
      } else if (leadClientId) {
        await addFollowUp({
          leadClientId,
          ...data,
          createdBy: currentUser?.id || '',
        }, currentUser?.id, currentUser?.name);
        toast.success('Follow-up scheduled');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save follow-up');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {followUp ? 'Edit' : 'Add'} Follow-up
            {leadClient && ` for ${leadClient.name}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                      category === cat.value
                        ? 'border-[#7567F8] bg-[#7567F8]/10 text-[#7567F8]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this follow-up..."
              rows={3}
            />
          </div>

          {/* Completed (for edit mode) */}
          {followUp && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCompleted(!completed)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  completed
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 ${completed ? 'text-green-500' : 'text-gray-400'}`} />
                <span>Mark as completed</span>
              </button>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF] hover:from-[#6558E8] hover:to-[#8B8BEF]"
            >
              {followUp ? 'Save Changes' : 'Schedule Follow-up'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
