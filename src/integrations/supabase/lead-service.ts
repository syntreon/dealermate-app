/**
 * Lead Management Service
 * Handles all interactions with leads in Supabase
 * 
 * CRITICAL: This service enforces client data isolation for compliance and privacy
 */
import { supabase } from './client';
import type { Database } from './types';
import { format } from 'date-fns';

// Type for leads from database
export type Lead = {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  lead_status: string; // Changed from status to lead_status to match DB schema
  status?: string; // Alias for lead_status for backward compatibility
  source: 'website' | 'direct_call' | 'referral' | 'social_media' | 'other' | 'ai_agent';
  call_id: string;
  client_id: string;
  created_at: string;
  notes?: string;
  // New fields
  from_phone_number?: string;
  call_time?: string;
  custom_lead_data?: any;
  sent_to?: string;
  client_name?: string; // For admin view
};

// Interface for lead filters
export interface LeadFilters {
  status?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  clientId?: string;
}

/**
 * Service for managing leads in Supabase
 */
class LeadService {
  private static instance: LeadService;
  private cache: {
    data: Lead[] | null;
    timestamp: number;
    expiresIn: number; // milliseconds
  };
  
  private constructor() {
    // Initialize cache
    this.cache = {
      data: null,
      timestamp: 0,
      expiresIn: 5 * 60 * 1000 // 5 minutes cache expiration
    };
  }
  
  /**
   * Get singleton instance of the service
   */
  public static getInstance(): LeadService {
    if (!LeadService.instance) {
      LeadService.instance = new LeadService();
    }
    return LeadService.instance;
  }
  
  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache.data) return false;
    const now = Date.now();
    return now - this.cache.timestamp < this.cache.expiresIn;
  }
  
  /**
   * Update the cache with new data
   */
  private updateCache(data: Lead[]): void {
    this.cache = {
      data,
      timestamp: Date.now(),
      expiresIn: this.cache.expiresIn
    };
  }
  
  /**
   * Get all leads with optional filtering
   * 
   * CRITICAL: This method enforces client data isolation by filtering by client_id
   */
  public async getLeads(filters?: LeadFilters, forceRefresh = false): Promise<Lead[]> {
    // Check cache first if not forcing refresh and no filters
    if (!forceRefresh && !filters && this.isCacheValid()) {
      console.log('Using cached leads data');
      return this.cache.data!;
    }
    
    try {
      // Start building the query
      let query = supabase
        .from('leads')
        .select(`
          *,
          clients(name)
        `);
      
      // Apply filters if provided
      if (filters) {
        // CRITICAL: Always filter by client_id if provided for data isolation
        if (filters.clientId) {
          query = query.eq('client_id', filters.clientId);
        }
        
        if (filters.status) {
          query = query.eq('lead_status', filters.status);
        }
        
        if (filters.source) {
          query = query.eq('source', filters.source);
        }
        
        if (filters.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        
        if (filters.endDate) {
          query = query.lte('created_at', filters.endDate);
        }
        
        if (filters.search) {
          query = query.or(`full_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }
      }
      
      // Order by most recent first
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching leads:', error);
        throw new Error(`Failed to fetch leads: ${error.message}`);
      }
      
      // Process the data to extract client name and fetch call times
      const processedData = data.map(lead => ({
        ...lead,
        client_name: lead.clients?.name || null,
        // Add status field as an alias for lead_status for backward compatibility
        status: lead.lead_status,
        // Hardcode source as "AI Agent" for now until we add it to the database
        source: 'ai_agent',
        clients: undefined // Remove the clients object
      }));
      
      // Fetch call times for all leads
      const enhancedLeads = await import('@/utils/callTimeHelper')
        .then(module => module.enhanceLeadsWithCallTime(processedData))
        .catch(err => {
          console.error('Error importing callTimeHelper:', err);
          return processedData;
        });
      
      // Update cache if no filters were applied
      if (!filters) {
        this.updateCache(enhancedLeads as Lead[]);
      }
      
      return enhancedLeads as Lead[];
    } catch (error) {
      console.error('Error in getLeads:', error);
      throw error;
    }
  }
  
  /**
   * Get a single lead by ID
   * 
   * CRITICAL: This method should be used with canAccessClientData utility
   * to ensure users can only access leads from their client
   */
  public async getLeadById(id: string): Promise<Lead | null> {
    try {
      // Get lead data with client name
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          clients(name)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching lead by ID:', error);
        throw new Error(`Failed to fetch lead: ${error.message}`);
      }
      
      if (!data) {
        return null;
      }
      
      // Process the data to extract client name
      const processedLead = {
        ...data,
        client_name: data.clients?.name || null,
        // Add status field as an alias for lead_status for backward compatibility
        status: data.lead_status,
        // Hardcode source as "AI Agent" for now until we add it to the database
        source: 'ai_agent',
        clients: undefined // Remove the clients object
      };
      
      // Get call time if call_id exists
      if (processedLead.call_id) {
        try {
          const { data: callData, error: callError } = await supabase
            .from('calls')
            .select('call_start_time')
            .eq('id', processedLead.call_id)
            .single();
          
          if (!callError && callData && callData.call_start_time) {
            const callTime = new Date(callData.call_start_time);
            if (!isNaN(callTime.getTime())) {
              processedLead.call_time = format(callTime, 'MMM d, yyyy h:mm a');
            }
          }
        } catch (callError) {
          console.error('Error fetching call time:', callError);
        }
      }
      
      return processedLead as Lead;
    } catch (error) {
      console.error('Error in getLeadById:', error);
      throw error;
    }
  }
  
  /**
   * Create a new lead
   * 
   * CRITICAL: client_id must be set based on the user's client_id
   * for proper data isolation
   */
  public async createLead(lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating lead:', error);
        throw new Error(`Failed to create lead: ${error.message}`);
      }
      
      // Invalidate cache
      this.cache.data = null;
      
      return data as Lead;
    } catch (error) {
      console.error('Error in createLead:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing lead
   * 
   * CRITICAL: This method should be used with canAccessClientData utility
   * to ensure users can only update leads from their client
   */
  public async updateLead(id: string, lead: Partial<Lead>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(lead)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating lead:', error);
        throw new Error(`Failed to update lead: ${error.message}`);
      }
      
      // Invalidate cache
      this.cache.data = null;
      
      return data as Lead;
    } catch (error) {
      console.error('Error in updateLead:', error);
      throw error;
    }
  }
  
  /**
   * Update lead status
   */
  public async updateLeadStatus(id: string, status: Lead['status']): Promise<Lead> {
    // Map status to lead_status to match the database schema
    return this.updateLead(id, { lead_status: status });
  }
  
  /**
   * Add a note to a lead
   */
  public async addLeadNote(id: string, note: string): Promise<Lead> {
    try {
      // First get the current lead to append to existing notes
      const lead = await this.getLeadById(id);
      
      if (!lead) {
        throw new Error(`Lead with ID ${id} not found`);
      }
      
      const updatedNotes = lead.notes 
        ? `${lead.notes}\n${note}` 
        : note;
      
      return this.updateLead(id, { notes: updatedNotes });
    } catch (error) {
      console.error('Error in addLeadNote:', error);
      throw error;
    }
  }
  
  /**
   * Delete a lead
   * 
   * CRITICAL: This method should be used with canAccessClientData utility
   * to ensure users can only delete leads from their client
   */
  public async deleteLead(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting lead:', error);
        throw new Error(`Failed to delete lead: ${error.message}`);
      }
      
      // Invalidate cache
      this.cache.data = null;
    } catch (error) {
      console.error('Error in deleteLead:', error);
      throw error;
    }
  }
  
  /**
   * Get leads by client ID
   * 
   * CRITICAL: This method enforces client data isolation
   */
  public async getLeadsByClientId(clientId: string): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching leads by client ID:', error);
        throw new Error(`Failed to fetch leads by client ID: ${error.message}`);
      }
      
      return data as Lead[];
    } catch (error) {
      console.error('Error in getLeadsByClientId:', error);
      throw error;
    }
  }
  
  /**
   * Export leads to CSV format
   * 
   * CRITICAL: This method should filter by client_id for non-admin users
   */
  public async exportLeadsToCSV(
    filters?: LeadFilters, 
    options?: {
      includeNotes?: boolean;
      includeClientId?: boolean;
      includeCallId?: boolean;
      includeTimestamps?: boolean;
    }
  ): Promise<string> {
    try {
      const leads = await this.getLeads(filters);
      
      if (leads.length === 0) {
        return 'No leads to export';
      }
      
      // Default options
      const exportOptions = {
        includeNotes: true,
        includeClientId: false, // Default to false for privacy
        includeCallId: true,
        includeTimestamps: true,
        ...options
      };
      
      // Create CSV header based on options
      const headers = ['ID', 'Full Name', 'Phone Number', 'Email', 'Status', 'Source'];
      
      if (exportOptions.includeClientId) {
        headers.push('Client ID');
      }
      
      if (exportOptions.includeCallId) {
        headers.push('Call ID');
      }
      
      if (exportOptions.includeTimestamps) {
        headers.push('Created At');
      }
      
      if (exportOptions.includeNotes) {
        headers.push('Notes');
      }
      
      // Create CSV rows based on options
      const rows = leads.map(lead => {
        const row = [
          lead.id,
          lead.full_name,
          lead.phone_number,
          lead.email || '',
          lead.status,
          lead.source
        ];
        
        if (exportOptions.includeClientId) {
          row.push(lead.client_id);
        }
        
        if (exportOptions.includeCallId) {
          row.push(lead.call_id);
        }
        
        if (exportOptions.includeTimestamps) {
          row.push(lead.created_at);
        }
        
        if (exportOptions.includeNotes) {
          row.push(lead.notes || '');
        }
        
        return row;
      });
      
      // Combine header and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('Error in exportLeadsToCSV:', error);
      throw error;
    }
  }
  
  /**
   * Export leads to Excel format
   * 
   * CRITICAL: This method should filter by client_id for non-admin users
   */
  public async exportLeadsToExcel(
    filters?: LeadFilters,
    options?: {
      includeNotes?: boolean;
      includeClientId?: boolean;
      includeCallId?: boolean;
      includeTimestamps?: boolean;
    }
  ): Promise<Blob> {
    try {
      // For now, we'll just convert the CSV to a blob with Excel mime type
      // In a real implementation, you would use a library like exceljs or xlsx
      const csvContent = await this.exportLeadsToCSV(filters, options);
      
      // Convert CSV to Blob with Excel mime type
      const blob = new Blob([csvContent], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      return blob;
    } catch (error) {
      console.error('Error in exportLeadsToExcel:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const leadService = LeadService.getInstance();