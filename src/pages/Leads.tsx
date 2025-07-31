import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, User } from 'lucide-react';
import LeadsTable from '@/components/leads/LeadsTable';
import LeadDetailsView from '@/components/leads/LeadDetailsView';
import LeadExportDialog, { LeadExportOptions } from '@/components/leads/LeadExportDialog';
import { useLeadService } from '@/hooks/useLeadService';
import { downloadFile, generateExportFilename } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { Lead } from '@/integrations/supabase/lead-service';
import { useAuth } from '@/context/AuthContext';
import { useClient } from '@/context/ClientContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';


/**
 * Leads page component for displaying and managing leads
 * Shows a table of leads with filtering, sorting, and export functionality
 */
const Leads: React.FC = () => {
  const { user } = useAuth();
  const { selectedClientId } = useClient();
  
  const { 
    leads, 
    loading, 
    error, 
    forceRefresh,
    refetch,
    updateLeadStatus,
    addLeadNote,
    deleteLead,
    exportLeadsToCSV,
    exportLeadsToExcel
  } = useLeadService();
  
  // Refetch leads when selectedClientId changes
  useEffect(() => {
    refetch({ clientId: selectedClientId });
  }, [selectedClientId, refetch]);
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Handle view lead
  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  // Handle edit lead (placeholder for now)
  const handleEditLead = (lead: Lead) => {
    toast.info('Edit lead functionality coming soon');
  };

  // Handle delete lead
  const handleDeleteLead = async (lead: Lead) => {
    if (window.confirm(`Are you sure you want to delete the lead for ${lead.full_name}?`)) {
      try {
        await deleteLead(lead.id);
        toast.success('Lead deleted successfully');
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };

  // Handle status change
  const handleStatusChange = async (lead: Lead, status: Lead['status']) => {
    try {
      await updateLeadStatus(lead.id, status);
      toast.success(`Lead status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update lead status');
    }
  };

  // Handle add note
  const handleAddNote = async (lead: Lead, note: string) => {
    try {
      await addLeadNote(lead.id, note);
      toast.success('Note added successfully');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'excel', options: LeadExportOptions) => {
    try {
      if (format === 'csv') {
        const csvData = await exportLeadsToCSV(options);
        downloadFile(
          csvData, 
          generateExportFilename('leads', 'csv'), 
          'text/csv;charset=utf-8'
        );
        toast.success('Leads exported to CSV successfully');
      } else {
        const excelData = await exportLeadsToExcel(options);
        downloadFile(
          excelData, 
          generateExportFilename('leads', 'xlsx')
        );
        toast.success('Leads exported to Excel successfully');
      }
    } catch (error) {
      toast.error('Failed to export leads');
    }
  };

  // No need to adapt leads anymore since LeadsTable now accepts Supabase lead format directly

  return (
    <div className="space-y-4 pb-8">
      {/* Mobile-first compact header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">Manage and track leads generated from calls</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsExportOpen(true)}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:ml-2 sm:inline">Export</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:ml-2 sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Client selection is now handled by the global client selector in TopBar */}

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-0">
          {error ? (
            <div className="bg-destructive/10 text-destructive p-4 m-4 rounded-md">
              <p className="text-sm">Error loading leads: {typeof error === 'string' ? error : error.message || 'Unknown error'}</p>
            </div>
          ) : (
            <LeadsTable 
              leads={leads} 
              loading={loading} 
              onViewLead={handleViewLead}
              onEditLead={handleEditLead}
              onDeleteLead={handleDeleteLead}
              onStatusChange={handleStatusChange}
              onExportLeads={() => setIsExportOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      {/* Lead Details View */}
      <LeadDetailsView
        lead={selectedLead}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onStatusChange={handleStatusChange}
        onAddNote={handleAddNote}
      />

      {/* Lead Export Dialog */}
      <LeadExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        exportCount={leads.length}
      />
    </div>
  );
};

export default Leads;