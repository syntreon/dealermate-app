/**
 * Adapter functions to convert between different lead data formats
 */
import { Lead as SupabaseLead } from '@/integrations/supabase/lead-service';
import { Lead as ContextLead } from '@/context/LeadContext';

/**
 * Convert a Supabase lead to the format expected by the UI components
 */
export function adaptSupabaseLeadToContextLead(lead: SupabaseLead): ContextLead {
  return {
    id: lead.id,
    fullName: lead.full_name,
    phoneNumber: lead.phone_number,
    email: lead.email,
    status: lead.status,
    source: lead.source,
    callId: lead.call_id,
    clientId: lead.client_id,
    createdAt: lead.created_at,
    notes: lead.notes
  };
}

/**
 * Convert an array of Supabase leads to the format expected by the UI components
 */
export function adaptSupabaseLeadsToContextLeads(leads: SupabaseLead[]): ContextLead[] {
  return leads.map(adaptSupabaseLeadToContextLead);
}

/**
 * Convert a context lead to the format expected by the Supabase service
 */
export function adaptContextLeadToSupabaseLead(lead: ContextLead): Omit<SupabaseLead, 'id' | 'created_at'> {
  return {
    full_name: lead.fullName,
    phone_number: lead.phoneNumber,
    email: lead.email,
    status: lead.status,
    source: lead.source,
    call_id: lead.callId,
    client_id: lead.clientId,
    notes: lead.notes
  };
}