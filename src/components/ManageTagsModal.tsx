import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, X, Tag, Edit2 } from 'lucide-react';
import type { Tag as TagType } from '@/types';
import { toast } from 'sonner';

interface ManageTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

const presetColors = [
  '#7567F8', // Purple
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export function ManageTagsModal({ isOpen, onClose, workspaceId }: ManageTagsModalProps) {
  const { addTag, updateTag, deleteTag, getTagsByWorkspace } = useData();
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(presetColors[0]);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);

  const workspaceTags = getTagsByWorkspace(workspaceId);

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    if (workspaceTags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      toast.error('Tag already exists');
      return;
    }

    await addTag({
      name: newTagName.trim(),
      color: selectedColor,
      workspaceId,
    });

    setNewTagName('');
    toast.success('Tag created');
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;

    if (!newTagName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    await updateTag(editingTag.id, {
      name: newTagName.trim(),
      color: selectedColor,
    });

    setEditingTag(null);
    setNewTagName('');
    toast.success('Tag updated');
  };

  const handleDeleteTag = async (id: string) => {
    if (confirm('Are you sure you want to delete this tag? It will be removed from all leads/clients.')) {
      await deleteTag(id);
      toast.success('Tag deleted');
    }
  };

  const startEditing = (tag: TagType) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setSelectedColor(tag.color);
  };

  const cancelEditing = () => {
    setEditingTag(null);
    setNewTagName('');
    setSelectedColor(presetColors[0]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Manage Tags
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add/Edit Tag Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tag Name</Label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    editingTag ? handleUpdateTag() : handleAddTag();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-[#7567F8] scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {editingTag ? (
                <>
                  <Button
                    variant="outline"
                    onClick={cancelEditing}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateTag}
                    className="flex-1 bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Update Tag
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleAddTag}
                  className="w-full bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tag
                </Button>
              )}
            </div>
          </div>

          {/* Tags List */}
          <div className="space-y-2">
            <Label>Existing Tags ({workspaceTags.length})</Label>
            {workspaceTags.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No tags yet. Create your first tag above.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {workspaceTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm flex items-center gap-2 group"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(tag)}
                        className="hover:opacity-70"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
