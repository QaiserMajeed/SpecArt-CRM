import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
// Select components used via UI
import { Plus, X, UserCog, Edit2, Trash2, Type, Hash, Calendar, List, AlignLeft } from 'lucide-react';
import type { CustomField } from '@/types';
import { toast } from 'sonner';

interface ManageCustomFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

const fieldTypes = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Select (Dropdown)', icon: List },
  { value: 'textarea', label: 'Textarea', icon: AlignLeft },
];

export function ManageCustomFieldsModal({ isOpen, onClose, workspaceId }: ManageCustomFieldsModalProps) {
  const { addCustomField, updateCustomField, deleteCustomField, getCustomFieldsByWorkspace } = useData();
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'date' | 'select' | 'textarea'>('text');
  const [selectOptions, setSelectOptions] = useState<string[]>(['']);
  const [isRequired, setIsRequired] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  const workspaceFields = getCustomFieldsByWorkspace(workspaceId);

  const handleAddField = async () => {
    if (!fieldName.trim()) {
      toast.error('Field name is required');
      return;
    }

    if (workspaceFields.some(f => f.name.toLowerCase() === fieldName.trim().toLowerCase())) {
      toast.error('Field already exists');
      return;
    }

    const options = fieldType === 'select'
      ? selectOptions.filter(o => o.trim()).map(o => o.trim())
      : undefined;

    if (fieldType === 'select' && (!options || options.length === 0)) {
      toast.error('Select field needs at least one option');
      return;
    }

    await addCustomField({
      name: fieldName.trim(),
      type: fieldType,
      options,
      workspaceId,
      isRequired,
      order: workspaceFields.length + 1,
    });

    resetForm();
    toast.success('Custom field created');
  };

  const handleUpdateField = async () => {
    if (!editingField) return;

    if (!fieldName.trim()) {
      toast.error('Field name is required');
      return;
    }

    const options = fieldType === 'select'
      ? selectOptions.filter(o => o.trim()).map(o => o.trim())
      : undefined;

    await updateCustomField(editingField.id, {
      name: fieldName.trim(),
      type: fieldType,
      options,
      isRequired,
    });

    resetForm();
    toast.success('Custom field updated');
  };

  const handleDeleteField = async (id: string) => {
    if (confirm('Are you sure you want to delete this field? All data associated with this field will be lost.')) {
      await deleteCustomField(id);
      toast.success('Custom field deleted');
    }
  };

  const startEditing = (field: CustomField) => {
    setEditingField(field);
    setFieldName(field.name);
    setFieldType(field.type);
    setIsRequired(field.isRequired);
    if (field.options) {
      setSelectOptions(field.options.length > 0 ? field.options : ['']);
    } else {
      setSelectOptions(['']);
    }
  };

  const resetForm = () => {
    setEditingField(null);
    setFieldName('');
    setFieldType('text');
    setSelectOptions(['']);
    setIsRequired(false);
  };

  const addOption = () => {
    setSelectOptions([...selectOptions, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...selectOptions];
    newOptions[index] = value;
    setSelectOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setSelectOptions(selectOptions.filter((_, i) => i !== index));
  };

  const getTypeIcon = (type: string) => {
    const config = fieldTypes.find(t => t.value === type);
    const Icon = config?.icon || Type;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Manage Custom Fields
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add/Edit Field Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Field Name</Label>
              <Input
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g., LinkedIn URL, Project Budget..."
              />
            </div>

            <div className="space-y-2">
              <Label>Field Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {fieldTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFieldType(type.value as typeof fieldType)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                        fieldType === type.value
                          ? 'border-[#7567F8] bg-[#7567F8]/10 text-[#7567F8]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Options */}
            {fieldType === 'select' && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                  {selectOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {selectOptions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked as boolean)}
              />
              <label htmlFor="required" className="text-sm">
                Make this field required
              </label>
            </div>

            <div className="flex gap-2">
              {editingField ? (
                <>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateField}
                    className="flex-1 bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Update Field
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleAddField}
                  className="w-full bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              )}
            </div>
          </div>

          {/* Fields List */}
          <div className="space-y-2">
            <Label>Existing Fields ({workspaceFields.length})</Label>
            {workspaceFields.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No custom fields yet. Create your first field above.
              </p>
            ) : (
              <div className="space-y-2">
                {workspaceFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
                  >
                    <div className="flex items-center gap-3">
                      {getTypeIcon(field.type)}
                      <div>
                        <p className="font-medium text-sm">{field.name}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {field.type}
                          {field.options && ` • ${field.options.length} options`}
                          {field.isRequired && ' • Required'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(field)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteField(field.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
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
