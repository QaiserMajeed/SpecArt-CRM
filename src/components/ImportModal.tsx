import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import type { Category, LeadStatus, ClientStatus } from '@/types';
import { toast } from 'sonner';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

const crmFields = [
  { value: 'name', label: 'Name *', required: true },
  { value: 'phoneNumber', label: 'Phone Number' },
  { value: 'email', label: 'Email' },
  { value: 'companyName', label: 'Company Name' },
  { value: 'notes', label: 'Notes' },
  { value: 'category', label: 'Category (lead/client)' },
  { value: 'subCategory', label: 'Status (hot/warm/cold/active/inactive)' },
  { value: 'assignedTo', label: 'Assigned To' },
  { value: 'nextFollowUpDate', label: 'Next Follow-up Date (YYYY-MM-DD)' },
  { value: 'followUpCategory', label: 'Follow-up Category (call/email/meeting/follow_up/other)' },
  { value: 'source', label: 'Source' },
  { value: 'tags', label: 'Tags (comma-separated)' },
];

export function ImportModal({ isOpen, onClose, workspaceId }: ImportModalProps) {
  const { currentUser } = useAuth();
  const { importLeadsClients } = useData();
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'complete'>('upload');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [defaultCategory, setDefaultCategory] = useState<Category>('lead');
  const [defaultStatus, setDefaultStatus] = useState<LeadStatus | ClientStatus>('cold');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must have at least a header row and one data row');
        return;
      }

      const parsed = lines.map(line => 
        line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
      );

      setHeaders(parsed[0]);
      setCsvData(parsed.slice(1));
      
      const autoMapping: Record<string, string> = {};
      parsed[0].forEach((header) => {
        const lowerHeader = header.toLowerCase();
        const matchedField = crmFields.find(field => 
          lowerHeader.includes(field.value.toLowerCase()) ||
          lowerHeader === field.label.toLowerCase() ||
          (field.value === 'name' && (lowerHeader === 'name' || lowerHeader === 'full name')) ||
          (field.value === 'phoneNumber' && (lowerHeader.includes('phone') || lowerHeader.includes('mobile'))) ||
          (field.value === 'email' && lowerHeader.includes('email')) ||
          (field.value === 'companyName' && (lowerHeader.includes('company') || lowerHeader.includes('organization')))
        );
        if (matchedField) {
          autoMapping[header] = matchedField.value;
        }
      });
      setMapping(autoMapping);
      setStep('map');
      toast.success(`Loaded ${parsed.length - 1} rows from CSV`);
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (csvColumn: string, crmField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvColumn]: crmField
    }));
  };

  const generatePreview = () => {
    const nameColumn = Object.entries(mapping).find(([_, value]) => value === 'name')?.[0];
    if (!nameColumn) {
      toast.error('Please map the Name field');
      return;
    }

    const preview = csvData.slice(0, 5).map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        const crmField = mapping[header];
        if (crmField) {
          obj[crmField] = row[index] || '';
        }
      });
      obj.category = obj.category || defaultCategory;
      obj.subCategory = obj.subCategory || defaultStatus;
      return obj;
    });

    setPreviewData(preview);
    setStep('preview');
  };

  const handleImport = async () => {
    const nameColumn = Object.entries(mapping).find(([_, value]) => value === 'name')?.[0];
    if (!nameColumn) {
      toast.error('Name field is required');
      return;
    }

    const dataToImport = csvData.map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        const crmField = mapping[header];
        if (crmField) {
          obj[crmField] = row[index] || '';
        }
      });

      // Process category and status
      obj.category = (obj.category as Category) || defaultCategory;
      obj.subCategory = obj.subCategory || defaultStatus;

      // Process next follow-up date
      if (obj.nextFollowUpDate) {
        const date = new Date(obj.nextFollowUpDate);
        obj.nextFollowUpDate = isNaN(date.getTime()) ? null : date;
      } else {
        obj.nextFollowUpDate = null;
      }

      // Process follow-up category
      const validCategories = ['call', 'email', 'meeting', 'follow_up', 'other'];
      obj.followUpCategory = validCategories.includes(obj.followUpCategory)
        ? obj.followUpCategory
        : 'other';

      // Process tags (comma-separated)
      if (obj.tags) {
        obj.tags = obj.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      } else {
        obj.tags = [];
      }

      // Set defaults
      obj.workspaceId = workspaceId;
      obj.customFields = {};

      return obj;
    }).filter(item => item.name);

    try {
      const count = await importLeadsClients(dataToImport, workspaceId, currentUser?.id || '', currentUser?.name || '');
      setStep('complete');
      toast.success(`Successfully imported ${count} records`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to import records');
    }
  };

  const reset = () => {
    setStep('upload');
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    setPreviewData([]);
  };

  const downloadTemplate = () => {
    const template = 'name,phoneNumber,email,companyName,notes,category,subCategory,assignedTo,nextFollowUpDate,followUpCategory,source,tags\n' +
      'John Doe,+1 555-0000,john@example.com,Acme Inc,Looking for video editing,lead,hot,Admin,2024-12-25,call,Referral,"video-editing,high-budget"\n' +
      'Jane Smith,+1 555-0001,jane@example.com,Media Co,Motion graphics project,client,active,Admin,2024-12-30,email,Website,"motion-graphics"';
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'specart_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload a CSV file with your leads or clients data
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <Button
                onClick={() => document.getElementById('csv-upload')?.click()}
                className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Select CSV File
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Need a template?</h4>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Download our CSV template to ensure your data is formatted correctly.
              </p>
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  Map your CSV columns to CRM fields. At minimum, the <strong>Name</strong> field is required.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Values</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Category</Label>
                  <Select value={defaultCategory} onValueChange={(v) => setDefaultCategory(v as Category)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Select 
                    value={defaultStatus} 
                    onValueChange={(v) => setDefaultStatus(v as LeadStatus | ClientStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultCategory === 'lead' ? (
                        <>
                          <SelectItem value="hot">Hot</SelectItem>
                          <SelectItem value="warm">Warm</SelectItem>
                          <SelectItem value="cold">Cold</SelectItem>
                          <SelectItem value="dead">Dead</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="dead">Dead</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">CSV Column</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">CRM Field</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Sample Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {headers.map((header) => (
                    <tr key={header}>
                      <td className="px-4 py-2 text-sm">{header}</td>
                      <td className="px-4 py-2">
                        <Select
                          value={mapping[header] || ''}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="-- Not mapped --" />
                          </SelectTrigger>
                          <SelectContent>
                            {crmFields.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 truncate max-w-xs">
                        {csvData[0]?.[headers.indexOf(header)] || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={reset}>
                Back
              </Button>
              <Button 
                onClick={generatePreview}
                className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
              >
                Preview Import
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm text-green-800">
                  Preview of the first 5 records. Total records to import: <strong>{csvData.length}</strong>
                </p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Phone</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Company</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2 text-gray-500">{row.phoneNumber || '-'}</td>
                      <td className="px-3 py-2 text-gray-500">{row.email || '-'}</td>
                      <td className="px-3 py-2 text-gray-500">{row.companyName || '-'}</td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary" className={row.category === 'lead' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                          {row.category}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('map')}>
                Back
              </Button>
              <Button 
                onClick={handleImport}
                className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
              >
                Import {csvData.length} Records
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Import Complete!</h3>
            <p className="text-gray-500 mb-6">
              Successfully imported {csvData.length} records.
            </p>
            <Button 
              onClick={() => {
                reset();
                onClose();
              }}
              className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
