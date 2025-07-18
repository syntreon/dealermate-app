import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Download } from 'lucide-react';
import { useLeads, Lead } from '@/context/LeadContext';
import LeadsTable from '@/components/leads/LeadsTable';
import LeadDetailsView from '@/components/leads/LeadDetailsView';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

/**
 * Leads page component for displaying and managing leads
 */
const Leads: React.FC = () => {
  const { leads, updateLeadStatus, addLeadNote } = useLeads();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate refresh delay
    setTimeout(() => {
      setLoading(false);
      toast.success('Leads refreshed successfully');
    }, 1000);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    // For now, just show a toast. In the next task, we'll implement the lead edit form
    toast.info(`Editing lead: ${lead.fullName}`);
  };

  const handleDeleteLead = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteLead = () => {
    if (!leadToDelete) return;
    
    // For now, just show a toast. In the next task, we'll implement the delete functionality
    toast.success(`Lead deleted: ${leadToDelete.fullName}`);
    setDeleteDialogOpen(false);
    setLeadToDelete(null);
  };

  const handleStatusChange = async (lead: Lead, status: Lead['status']) => {
    try {
      const success = await updateLeadStatus(lead.id, status);
      if (success) {
        toast.success(`Lead status updated to ${status}`);
      } else {
        toast.error('Failed to update lead status');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('An error occurred while updating lead status');
    }
  };

  const handleExportLeads = () => {
    // For now, just show a toast. In the next task, we'll implement the export functionality
    toast.success('Leads exported successfully');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Responsive header layout */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          </div>
          <p className="text-muted-foreground">View and manage your leads</p>
        </div>
        
        <div className="flex gap-2 self-start">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LeadsTable 
            leads={leads}
            loading={loading}
            onViewLead={handleViewLead}
            onEditLead={handleEditLead}
            onDeleteLead={handleDeleteLead}
            onStatusChange={handleStatusChange}
            onExportLeads={handleExportLeads}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lead{' '}
              <strong>{leadToDelete?.fullName}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLead}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lead Details View */}
      <LeadDetailsView
        lead={selectedLead}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onStatusChange={handleStatusChange}
        onAddNote={async (lead, note) => {
          const success = await addLeadNote(lead.id, note);
          if (!success) {
            throw new Error('Failed to add note');
          }
          // Update the selected lead with the latest data after adding a note
          const updatedLead = leads.find(l => l.id === lead.id);
          if (updatedLead) {
            setSelectedLead(updatedLead);
          }
        }}
      />
    </div>
  );
};

export default Leads;