import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface Lead {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed_won' | 'closed_lost';
  source: 'website' | 'direct_call' | 'referral' | 'social_media' | 'other' | 'ai_agent';
  callId: string;
  clientId: string;
  createdAt: string;
  notes?: string;
  sent_to?: string;
  sent_to_client_at?: string;
}

interface LeadStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  closedWon: number;
  conversionRate: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
}

interface LeadContextType {
  leads: Lead[];
  stats: LeadStats;
  addLead: (lead: Omit<Lead, "id" | "createdAt">) => Promise<boolean>;
  updateLeadStatus: (id: string, status: Lead['status']) => Promise<boolean>;
  addLeadNote: (id: string, note: string) => Promise<boolean>;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const LeadProvider = ({ children }: { children: ReactNode }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    closedWon: 0,
    conversionRate: 0,
    bySource: {},
    byStatus: {}
  });

  // Mock data for initial leads
  const mockLeads: Lead[] = [
    {
      id: '1',
      fullName: 'John Smith',
      phoneNumber: '+1 (555) 123-4567',
      email: 'john.smith@example.com',
      status: 'new',
      source: 'direct_call',
      callId: 'call_001',
      clientId: 'client_001',
      createdAt: new Date(2025, 6, 15, 10, 35).toISOString(),
      notes: 'Interested in premium service package'
    },
    {
      id: '2',
      fullName: 'Sarah Johnson',
      phoneNumber: '+1 (555) 987-6543',
      email: 'sarah.j@example.com',
      status: 'contacted',
      source: 'website',
      callId: 'call_002',
      clientId: 'client_002',
      createdAt: new Date(2025, 6, 16, 14, 22).toISOString(),
      notes: 'Requested additional information about service options'
    },
    {
      id: '3',
      fullName: 'David Wilson',
      phoneNumber: '+1 (555) 345-6789',
      email: 'david.wilson@example.com',
      status: 'qualified',
      source: 'referral',
      callId: 'call_005',
      clientId: 'client_003',
      createdAt: new Date(2025, 6, 17, 11, 28).toISOString(),
      notes: 'Scheduled a follow-up call for next Monday'
    },
    {
      id: '4',
      fullName: 'Emily Davis',
      phoneNumber: '+1 (555) 234-5678',
      email: 'emily.d@example.com',
      status: 'proposal',
      source: 'website',
      callId: 'call_004',
      clientId: 'client_004',
      createdAt: new Date(2025, 6, 17, 9, 11).toISOString(),
      notes: 'Sent proposal for premium package'
    },
    {
      id: '5',
      fullName: 'Michael Brown',
      phoneNumber: '+1 (555) 456-7890',
      email: 'michael.b@example.com',
      status: 'closed_won',
      source: 'direct_call',
      callId: 'call_003',
      clientId: 'client_003',
      createdAt: new Date(2025, 6, 16, 16, 45).toISOString(),
      notes: 'Signed up for annual contract'
    },
    {
      id: '6',
      fullName: 'Jennifer Lee',
      phoneNumber: '+1 (555) 567-8901',
      email: 'jennifer.l@example.com',
      status: 'closed_lost',
      source: 'social_media',
      callId: 'call_006',
      clientId: 'client_002',
      createdAt: new Date(2025, 6, 18, 13, 15).toISOString(),
      notes: 'Decided to go with competitor'
    }
  ];

  useEffect(() => {
    // Load leads from localStorage or use mock data on init
    const storedLeads = localStorage.getItem("leads");
    if (storedLeads) {
      setLeads(JSON.parse(storedLeads));
    } else {
      setLeads(mockLeads);
      localStorage.setItem("leads", JSON.stringify(mockLeads));
    }
  }, []);

  useEffect(() => {
    // Update stats whenever leads change
    if (leads.length > 0) {
      // Calculate lead stats
      const byStatus: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      
      leads.forEach(lead => {
        // Count by status
        byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
        
        // Count by source
        bySource[lead.source] = (bySource[lead.source] || 0) + 1;
      });
      
      const newStats = {
        totalLeads: leads.length,
        newLeads: leads.filter(lead => lead.status === 'new').length,
        qualifiedLeads: leads.filter(lead => lead.status === 'qualified').length,
        closedWon: leads.filter(lead => lead.status === 'closed_won').length,
        conversionRate: Math.round((leads.filter(lead => lead.status === 'closed_won').length / leads.length) * 100),
        bySource,
        byStatus
      };
      
      setStats(newStats);
      
      // Save to localStorage
      localStorage.setItem("leads", JSON.stringify(leads));
    }
  }, [leads]);

  const addLead = async (leadData: Omit<Lead, "id" | "createdAt">): Promise<boolean> => {
    try {
      const newLead: Lead = {
        ...leadData,
        id: `lead_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      
      setLeads(prevLeads => [newLead, ...prevLeads]);
      return true;
    } catch (error) {
      console.error("Error adding lead:", error);
      return false;
    }
  };

  const updateLeadStatus = async (id: string, status: Lead['status']): Promise<boolean> => {
    try {
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === id 
            ? { ...lead, status } 
            : lead
        )
      );
      return true;
    } catch (error) {
      console.error("Error updating lead status:", error);
      return false;
    }
  };

  const addLeadNote = async (id: string, note: string): Promise<boolean> => {
    try {
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === id 
            ? { ...lead, notes: lead.notes ? `${lead.notes}\n${note}` : note } 
            : lead
        )
      );
      return true;
    } catch (error) {
      console.error("Error adding lead note:", error);
      return false;
    }
  };

  return (
    <LeadContext.Provider value={{ leads, stats, addLead, updateLeadStatus, addLeadNote }}>
      {children}
    </LeadContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (context === undefined) {
    throw new Error("useLeads must be used within a LeadProvider");
  }
  return context;
};