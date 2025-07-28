import React, { memo, useMemo, useCallback } from 'react';
import { Lead as SupabaseLead } from '@/integrations/supabase/lead-service';
import LeadsTable from '@/components/leads/LeadsTable';

interface MemoizedLeadsTableProps {
  leads: SupabaseLead[];
  loading: boolean;
  onViewLead: (lead: SupabaseLead) => void;
  onEditLead: (lead: SupabaseLead) => void;
  onDeleteLead: (lead: SupabaseLead) => void;
  onStatusChange: (lead: SupabaseLead, status: SupabaseLead['status']) => void;
  onExportLeads: () => void;
}

/**
 * Memoized version of LeadsTable that prevents unnecessary re-renders
 * when props haven't changed. This is especially important for large datasets.
 */
const MemoizedLeadsTable: React.FC<MemoizedLeadsTableProps> = memo(({
  leads,
  loading,
  onViewLead,
  onEditLead,
  onDeleteLead,
  onStatusChange,
  onExportLeads
}) => {
  // Memoize callback functions to prevent child re-renders
  const memoizedOnViewLead = useCallback((lead: SupabaseLead) => {
    onViewLead(lead);
  }, [onViewLead]);

  const memoizedOnEditLead = useCallback((lead: SupabaseLead) => {
    onEditLead(lead);
  }, [onEditLead]);

  const memoizedOnDeleteLead = useCallback((lead: SupabaseLead) => {
    onDeleteLead(lead);
  }, [onDeleteLead]);

  const memoizedOnStatusChange = useCallback((lead: SupabaseLead, status: SupabaseLead['status']) => {
    onStatusChange(lead, status);
  }, [onStatusChange]);

  const memoizedOnExportLeads = useCallback(() => {
    onExportLeads();
  }, [onExportLeads]);

  return (
    <LeadsTable
      leads={leads}
      loading={loading}
      onViewLead={memoizedOnViewLead}
      onEditLead={memoizedOnEditLead}
      onDeleteLead={memoizedOnDeleteLead}
      onStatusChange={memoizedOnStatusChange}
      onExportLeads={memoizedOnExportLeads}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  if (prevProps.loading !== nextProps.loading) return false;
  if (prevProps.leads.length !== nextProps.leads.length) return false;
  
  // Deep comparison of leads (only if lengths are the same)
  for (let i = 0; i < prevProps.leads.length; i++) {
    const prevLead = prevProps.leads[i];
    const nextLead = nextProps.leads[i];
    
    // Compare key fields that would affect rendering
    if (prevLead.id !== nextLead.id ||
        prevLead.full_name !== nextLead.full_name ||
        prevLead.status !== nextLead.status ||
        prevLead.phone_number !== nextLead.phone_number ||
        prevLead.created_at !== nextLead.created_at ||
        prevLead.client_name !== nextLead.client_name) {
      return false;
    }
  }
  
  return true;
});

MemoizedLeadsTable.displayName = 'MemoizedLeadsTable';

export default MemoizedLeadsTable;