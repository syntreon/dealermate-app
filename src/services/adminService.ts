import { Client, ClientFilters, CreateClientData, UpdateClientData, User, UserFilters, CreateUserData, UpdateUserData } from '@/types/admin';

// Mock data for development - will be replaced with actual API calls
const mockClients: Client[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    status: 'active',
    type: 'Enterprise',
    subscription_plan: 'Premium',
    contact_person: 'John Doe',
    contact_email: 'john@acme.com',
    phone_number: '555-123-4567',
    billing_address: '123 Main St, Anytown, USA',
    monthly_billing_amount_cad: 2500,
    average_monthly_ai_cost_usd: 750,
    average_monthly_misc_cost_usd: 250,
    partner_split_percentage: 20,
    finders_fee_cad: 1000,
    slug: 'acme-corp',
    config_json: { theme: 'light', features: ['call_recording', 'lead_export'] },
    joined_at: new Date('2023-01-15'),
    last_active_at: new Date(),
    metrics: {
      totalCalls: 1250,
      totalLeads: 320,
      avgCallDuration: 245,
      callsToday: 15,
      leadsToday: 4
    }
  },
  {
    id: '2',
    name: 'TechStart Inc',
    status: 'active',
    type: 'Startup',
    subscription_plan: 'Basic',
    contact_person: 'Jane Smith',
    contact_email: 'jane@techstart.io',
    phone_number: '555-987-6543',
    billing_address: '456 Innovation Ave, Tech City, USA',
    monthly_billing_amount_cad: 1200,
    average_monthly_ai_cost_usd: 350,
    average_monthly_misc_cost_usd: 100,
    partner_split_percentage: 15,
    finders_fee_cad: 500,
    slug: 'techstart',
    config_json: { theme: 'dark', features: ['call_recording'] },
    joined_at: new Date('2023-05-20'),
    last_active_at: new Date(),
    metrics: {
      totalCalls: 450,
      totalLeads: 85,
      avgCallDuration: 180,
      callsToday: 8,
      leadsToday: 2
    }
  },
  {
    id: '3',
    name: 'Global Solutions Ltd',
    status: 'pending',
    type: 'Enterprise',
    subscription_plan: 'Premium',
    contact_person: 'Robert Johnson',
    contact_email: 'robert@globalsolutions.com',
    phone_number: '555-555-5555',
    billing_address: '789 Corporate Blvd, Metropolis, USA',
    monthly_billing_amount_cad: 3000,
    average_monthly_ai_cost_usd: 900,
    average_monthly_misc_cost_usd: 300,
    partner_split_percentage: 25,
    finders_fee_cad: 1500,
    slug: 'global-solutions',
    config_json: { theme: 'system', features: ['call_recording', 'lead_export', 'analytics'] },
    joined_at: new Date('2023-08-10'),
    last_active_at: null,
    metrics: {
      totalCalls: 0,
      totalLeads: 0,
      avgCallDuration: 0,
      callsToday: 0,
      leadsToday: 0
    }
  },
  {
    id: '4',
    name: 'Local Business Co',
    status: 'inactive',
    type: 'SMB',
    subscription_plan: 'Basic',
    contact_person: 'Sarah Williams',
    contact_email: 'sarah@localbiz.com',
    phone_number: '555-222-3333',
    billing_address: '321 Small St, Hometown, USA',
    monthly_billing_amount_cad: 800,
    average_monthly_ai_cost_usd: 200,
    average_monthly_misc_cost_usd: 50,
    partner_split_percentage: 10,
    finders_fee_cad: 300,
    slug: 'local-biz',
    config_json: { theme: 'light', features: ['call_recording'] },
    joined_at: new Date('2022-11-05'),
    last_active_at: new Date('2023-06-15'),
    metrics: {
      totalCalls: 320,
      totalLeads: 45,
      avgCallDuration: 160,
      callsToday: 0,
      leadsToday: 0
    }
  }
];

// Mock users data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    full_name: 'Admin User',
    role: 'admin',
    client_id: null, // Admin can access all clients
    last_login_at: new Date(),
    created_at: new Date('2023-01-10'),
    preferences: {
      notifications: {
        email: true,
        leadAlerts: true,
        systemAlerts: true,
        notificationEmails: ['admin@example.com']
      },
      displaySettings: {
        theme: 'dark',
        dashboardLayout: 'detailed'
      }
    }
  },
  {
    id: '2',
    email: 'client1.admin@example.com',
    full_name: 'Client 1 Admin',
    role: 'client_admin',
    client_id: '1', // Acme Corp
    last_login_at: new Date('2023-06-15'),
    created_at: new Date('2023-01-15'),
    preferences: {
      notifications: {
        email: true,
        leadAlerts: true,
        systemAlerts: false,
        notificationEmails: ['client1.admin@example.com']
      },
      displaySettings: {
        theme: 'light',
        dashboardLayout: 'compact'
      }
    }
  },
  {
    id: '3',
    email: 'client1.user@example.com',
    full_name: 'Client 1 User',
    role: 'client_user',
    client_id: '1', // Acme Corp
    last_login_at: new Date('2023-06-20'),
    created_at: new Date('2023-02-01'),
    preferences: {
      notifications: {
        email: false,
        leadAlerts: false,
        systemAlerts: false,
        notificationEmails: []
      },
      displaySettings: {
        theme: 'system',
        dashboardLayout: 'compact'
      }
    }
  },
  {
    id: '4',
    email: 'client2.admin@example.com',
    full_name: 'Client 2 Admin',
    role: 'client_admin',
    client_id: '2', // TechStart Inc
    last_login_at: new Date('2023-06-18'),
    created_at: new Date('2023-05-20'),
    preferences: {
      notifications: {
        email: true,
        leadAlerts: true,
        systemAlerts: true,
        notificationEmails: ['client2.admin@example.com']
      },
      displaySettings: {
        theme: 'dark',
        dashboardLayout: 'detailed'
      }
    }
  }
];

export const AdminService = {
  // Client management
  getClients: async (filters?: ClientFilters): Promise<Client[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredClients = [...mockClients];
    
    if (filters) {
      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        filteredClients = filteredClients.filter(client => client.status === filters.status);
      }
      
      // Apply type filter
      if (filters.type) {
        filteredClients = filteredClients.filter(client => client.type === filters.type);
      }
      
      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredClients = filteredClients.filter(client => 
          client.name.toLowerCase().includes(searchLower) || 
          client.slug.toLowerCase().includes(searchLower) ||
          client.contact_person?.toLowerCase().includes(searchLower) ||
          client.contact_email?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply sorting
      if (filters.sortBy) {
        filteredClients.sort((a, b) => {
          const direction = filters.sortDirection === 'desc' ? -1 : 1;
          
          switch (filters.sortBy) {
            case 'name':
              return direction * a.name.localeCompare(b.name);
            case 'joined_at':
              return direction * (a.joined_at.getTime() - b.joined_at.getTime());
            case 'last_active_at':
              if (!a.last_active_at) return direction;
              if (!b.last_active_at) return -direction;
              return direction * (a.last_active_at.getTime() - b.last_active_at.getTime());
            case 'status':
              return direction * a.status.localeCompare(b.status);
            default:
              return 0;
          }
        });
      }
    }
    
    return filteredClients;
  },
  
  getClientById: async (id: string): Promise<Client | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockClients.find(client => client.id === id) || null;
  },
  
  createClient: async (data: CreateClientData): Promise<Client> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newClient: Client = {
      id: Math.random().toString(36).substring(2, 11),
      ...data,
      status: 'pending',
      joined_at: new Date(),
      last_active_at: null,
      metrics: {
        totalCalls: 0,
        totalLeads: 0,
        avgCallDuration: 0,
        callsToday: 0,
        leadsToday: 0
      }
    };
    
    // In a real implementation, this would be saved to the database
    mockClients.push(newClient);
    
    return newClient;
  },
  
  updateClient: async (id: string, data: UpdateClientData): Promise<Client> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const clientIndex = mockClients.findIndex(client => client.id === id);
    if (clientIndex === -1) {
      throw new Error('Client not found');
    }
    
    const updatedClient = {
      ...mockClients[clientIndex],
      ...data
    };
    
    // In a real implementation, this would update the database
    mockClients[clientIndex] = updatedClient;
    
    return updatedClient;
  },
  
  deleteClient: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const clientIndex = mockClients.findIndex(client => client.id === id);
    if (clientIndex === -1) {
      throw new Error('Client not found');
    }
    
    // In a real implementation, this would delete from the database
    mockClients.splice(clientIndex, 1);
  },
  
  activateClient: async (id: string): Promise<Client> => {
    return AdminService.updateClient(id, { status: 'active' });
  },
  
  deactivateClient: async (id: string): Promise<Client> => {
    return AdminService.updateClient(id, { status: 'inactive' });
  },
  
  // User management functions
  getUsers: async (filters?: UserFilters): Promise<User[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredUsers = [...mockUsers];
    
    if (filters) {
      // Apply role filter
      if (filters.role && filters.role !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role);
      }
      
      // Apply client filter
      if (filters.client_id && filters.client_id !== 'all') {
        filteredUsers = filteredUsers.filter(user => 
          user.client_id === filters.client_id || user.client_id === null // Include global admins
        );
      }
      
      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.full_name.toLowerCase().includes(searchLower) || 
          user.email.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply sorting
      if (filters.sortBy) {
        filteredUsers.sort((a, b) => {
          const direction = filters.sortDirection === 'desc' ? -1 : 1;
          
          switch (filters.sortBy) {
            case 'full_name':
              return direction * a.full_name.localeCompare(b.full_name);
            case 'email':
              return direction * a.email.localeCompare(b.email);
            case 'created_at':
              return direction * (a.created_at.getTime() - b.created_at.getTime());
            case 'last_login_at':
              if (!a.last_login_at) return direction;
              if (!b.last_login_at) return -direction;
              return direction * (a.last_login_at.getTime() - b.last_login_at.getTime());
            default:
              return 0;
          }
        });
      }
    }
    
    return filteredUsers;
  },
  
  getUserById: async (id: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUsers.find(user => user.id === id) || null;
  },
  
  createUser: async (data: CreateUserData): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser: User = {
      id: Math.random().toString(36).substring(2, 11),
      ...data,
      last_login_at: null,
      created_at: new Date(),
      preferences: {
        notifications: {
          email: true,
          leadAlerts: false,
          systemAlerts: false,
          notificationEmails: [data.email]
        },
        displaySettings: {
          theme: 'system',
          dashboardLayout: 'compact'
        }
      }
    };
    
    // In a real implementation, this would be saved to the database
    mockUsers.push(newUser);
    
    return newUser;
  },
  
  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...mockUsers[userIndex],
      ...data
    };
    
    // In a real implementation, this would update the database
    mockUsers[userIndex] = updatedUser;
    
    return updatedUser;
  },
  
  deleteUser: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // In a real implementation, this would delete from the database
    mockUsers.splice(userIndex, 1);
  },
  
  // System health functions would go here
};