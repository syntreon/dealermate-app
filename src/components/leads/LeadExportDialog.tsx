import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';

interface LeadExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel', options: LeadExportOptions) => Promise<void>;
  exportCount: number;
}

export interface LeadExportOptions {
  includeNotes: boolean;
  includeClientId: boolean;
  includeCallId: boolean;
  includeTimestamps: boolean;
}

const LeadExportDialog: React.FC<LeadExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  exportCount,
}) => {
  const { user } = useAuth();
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<LeadExportOptions>({
    includeNotes: true,
    includeClientId: canViewSensitiveInfo(user), // Only include client ID for admins by default
    includeCallId: true,
    includeTimestamps: true,
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await onExport(format, options);
      onClose();
    } catch (error) {
      console.error('Error exporting leads:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOptionChange = (option: keyof LeadExportOptions, value: boolean) => {
    setOptions(prev => ({
      ...prev,
      [option]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Leads
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Export {exportCount} lead{exportCount !== 1 ? 's' : ''} to CSV or Excel format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label>Export Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as 'csv' | 'excel')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label>Export Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeNotes"
                  checked={options.includeNotes}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeNotes', checked === true)
                  }
                />
                <Label htmlFor="includeNotes" className="cursor-pointer">
                  Include notes
                </Label>
              </div>
              
              {/* Only show client ID option to admins */}
              {canViewSensitiveInfo(user) && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeClientId"
                    checked={options.includeClientId}
                    onCheckedChange={(checked) => 
                      handleOptionChange('includeClientId', checked === true)
                    }
                  />
                  <Label htmlFor="includeClientId" className="cursor-pointer">
                    Include client ID
                  </Label>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCallId"
                  checked={options.includeCallId}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeCallId', checked === true)
                  }
                />
                <Label htmlFor="includeCallId" className="cursor-pointer">
                  Include call ID
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTimestamps"
                  checked={options.includeTimestamps}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeTimestamps', checked === true)
                  }
                />
                <Label htmlFor="includeTimestamps" className="cursor-pointer">
                  Include timestamps
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeadExportDialog;