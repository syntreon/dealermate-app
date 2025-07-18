/**
 * Custom hook for interacting with lead data
 * Provides loading state, error handling, and data fetching capabilities
 * 
 * CRITICAL: This hook enforces client data isolation for compliance and privacy
 */
import { useState, useEffect, useCallback } from 'react';
import { leadService, Lead, LeadFilters } from '@/integrations/supabase/lead-service';
import { useAuth } from '@/context/AuthContext';
import { getClientIdFilter, canViewSensitiveInfo } from '@/utils/clientDataIsolation';

interface ExportOptions {
  includeNotes?: boolean;
  includeClientId?: boolean;
  includeCallId?: boolean;
  includeTimestamps?: boolean;
}

interface UseLeadServiceReturn {
  leads: Lead[];
  loading: boolean;
  error: Error | null;
  refetch: (filters?: LeadFilters) => Promise<void>;
  forceRefresh: () => Promise<void>;
  lastRefreshed: Date | null;
  createLead: (lead: Omit<Lead, 'id' | 'created_at'>) => Promise<Lead>;
  updateLead: (id: string, lead: Partial<Lead>) => Promise<Lead>;
  updateLeadStatus: (id: string, status: Lead['status']) => Promise<Lead>;
  addLeadNote: (id: string, note: string) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;
  exportLeadsToCSV: (options?: ExportOptions) => Promise<string>;
  exportLeadsToExcel: (options?: ExportOptions) => Promise<Blob>;
}

/**
 * Hook for fetching and managing lead data
 * 
 * Features:
 * - Uses caching for better performance
 * - Supports manual refresh and filtering
 * - Provides loading and error states
 * - Handles network errors gracefully
 * - Includes CRUD operations for leads
 * - Enforces client data isolation
 * 
 * @param autoLoad Whether to automatically load data on mount
 * @param initialFilters Optional initial filters to apply
 * @returns Object containing leads, loading state, error state, and functions
 */
export function useLeadService(
  autoLoad = true,
  initialFilters?: LeadFilters
): UseLeadServiceReturn {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [filters, setFilters] = useState<LeadFilters | undefined>(initialFilters);

  // Function to fetch leads with optional force refresh
  const fetchLeads = useCallback(async (newFilters?: LeadFilters, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Update filters if provided
      if (newFilters) {
        setFilters(newFilters);
      }
      
      // Get client ID filter based on user role
      const clientIdFilter = getClientIdFilter(user);
      
      // Merge filters with client ID filter for data isolation
      const filtersToUse: LeadFilters = {
        ...(newFilters || filters || {}),
        // Only add clientId if it's not already specified and we have a filter to apply
        ...(clientIdFilter && !(newFilters?.clientId || filters?.clientId) ? { clientId: clientIdFilter } : {})
      };
      
      const data = await leadService.getLeads(filtersToUse, forceRefresh);
      
      setLeads(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error in useLeadService hook:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching leads'));
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  // Force refresh function that bypasses cache
  const forceRefresh = useCallback(() => {
    return fetchLeads(undefined, true);
  }, [fetchLeads]);
  
  // Create a new lead
  const createLead = useCallback(async (lead: Omit<Lead, 'id' | 'created_at'>) => {
    try {
      // CRITICAL: Always set client_id based on user's client_id for data isolation
      const clientId = getClientIdFilter(user);
      if (clientId && !lead.client_id) {
        lead.client_id = clientId;
      }
      
      const newLead = await leadService.createLead(lead);
      // Refresh the list after creating
      fetchLeads();
      return newLead;
    } catch (err) {
      console.error('Error creating lead:', err);
      throw err;
    }
  }, [fetchLeads, user]);
  
  // Update an existing lead
  const updateLead = useCallback(async (id: string, lead: Partial<Lead>) => {
    try {
      const updatedLead = await leadService.updateLead(id, lead);
      // Refresh the list after updating
      fetchLeads();
      return updatedLead;
    } catch (err) {
      console.error('Error updating lead:', err);
      throw err;
    }
  }, [fetchLeads]);
  
  // Update lead status
  const updateLeadStatus = useCallback(async (id: string, status: Lead['status']) => {
    try {
      const updatedLead = await leadService.updateLeadStatus(id, status);
      // Refresh the list after updating
      fetchLeads();
      return updatedLead;
    } catch (err) {
      console.error('Error updating lead status:', err);
      throw err;
    }
  }, [fetchLeads]);
  
  // Add a note to a lead
  const addLeadNote = useCallback(async (id: string, note: string) => {
    try {
      const updatedLead = await leadService.addLeadNote(id, note);
      // Refresh the list after updating
      fetchLeads();
      return updatedLead;
    } catch (err) {
      console.error('Error adding lead note:', err);
      throw err;
    }
  }, [fetchLeads]);
  
  // Delete a lead
  const deleteLead = useCallback(async (id: string) => {
    try {
      await leadService.deleteLead(id);
      // Refresh the list after deleting
      fetchLeads();
    } catch (err) {
      console.error('Error deleting lead:', err);
      throw err;
    }
  }, [fetchLeads]);
  
  // Export leads to CSV
  const exportLeadsToCSV = useCallback(async (options?: {
    includeNotes?: boolean;
    includeClientId?: boolean;
    includeCallId?: boolean;
    includeTimestamps?: boolean;
  }) => {
    try {
      // Get client ID filter based on user role
      const clientIdFilter = getClientIdFilter(user);
      
      // Merge filters with client ID filter for data isolation
      const filtersToUse: LeadFilters = {
        ...(filters || {}),
        // Only add clientId if it's not already specified and we have a filter to apply
        ...(clientIdFilter && !filters?.clientId ? { clientId: clientIdFilter } : {})
      };
      
      // If user is not an admin, force includeClientId to false for privacy
      const exportOptions = {
        ...options,
        includeClientId: canViewSensitiveInfo(user) ? options?.includeClientId : false
      };
      
      return await leadService.exportLeadsToCSV(filtersToUse, exportOptions);
    } catch (err) {
      console.error('Error exporting leads to CSV:', err);
      throw err;
    }
  }, [filters, user]);
  
  // Export leads to Excel
  const exportLeadsToExcel = useCallback(async (options?: {
    includeNotes?: boolean;
    includeClientId?: boolean;
    includeCallId?: boolean;
    includeTimestamps?: boolean;
  }) => {
    try {
      // Get client ID filter based on user role
      const clientIdFilter = getClientIdFilter(user);
      
      // Merge filters with client ID filter for data isolation
      const filtersToUse: LeadFilters = {
        ...(filters || {}),
        // Only add clientId if it's not already specified and we have a filter to apply
        ...(clientIdFilter && !filters?.clientId ? { clientId: clientIdFilter } : {})
      };
      
      // If user is not an admin, force includeClientId to false for privacy
      const exportOptions = {
        ...options,
        includeClientId: canViewSensitiveInfo(user) ? options?.includeClientId : false
      };
      
      return await leadService.exportLeadsToExcel(filtersToUse, exportOptions);
    } catch (err) {
      console.error('Error exporting leads to Excel:', err);
      throw err;
    }
  }, [filters, user]);

  // Initial fetch on component mount
  useEffect(() => {
    if (autoLoad) {
      fetchLeads();
    }
  }, [autoLoad, fetchLeads]);

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
    forceRefresh,
    lastRefreshed,
    createLead,
    updateLead,
    updateLeadStatus,
    addLeadNote,
    deleteLead,
    exportLeadsToCSV,
    exportLeadsToExcel
  };
}