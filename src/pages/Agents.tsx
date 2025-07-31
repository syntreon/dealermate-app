import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bot, Clock, MessageSquare, Phone, Calendar, Globe, RefreshCw, Search, UserCheck, ArrowRightLeft, Zap, BarChart, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo, hasClientAdminAccess } from '@/utils/clientDataIsolation';
import ClientSelector from '@/components/ClientSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useSystemStatus } from '@/hooks/use-system-status';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  description: string;
  workTime: 'Full Time (24/7)' | 'Part Time (off-hours)';
  status: 'active' | 'inactive';
  isDefault?: boolean;
  isAvailable?: boolean;
  capabilities: string[];
  detailedDescription: string;
}

const Agents: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [selectedAgentName, setSelectedAgentName] = useState<string>('');
  const [isAgentDetailsOpen, setIsAgentDetailsOpen] = useState(false);
  const [selectedAgentDetails, setSelectedAgentDetails] = useState<Agent | null>(null);

  // Get client ID from user if available
  const clientId = user?.client_id || undefined;
  
  // Use the system status hook to get real-time status updates
  const { status, statusMessage, isLoading } = useSystemStatus(clientId);

  // Check user permissions
  const canViewAllClients = canViewSensitiveInfo(user);
  const canEditAgents = hasClientAdminAccess(user);
  const showEditControls = canEditAgents && !isMobile;

  // Mock agents data with detailed information
  const agents: Agent[] = [
    {
      id: 'inbound-call-agent',
      name: 'Inbound Call Agent',
      description: 'Helps with answering inbound calls from customers, handling inquiries, and scheduling appointments.',
      detailedDescription: 'Advanced AI agent that handles all inbound customer calls with professional expertise. Capable of understanding customer needs, providing information, and taking appropriate actions.',
      workTime: 'Full Time (24/7)',
      status: 'active',
      isDefault: true,
      isAvailable: true,
      capabilities: [
        'Appointment Booking',
        'Inventory Search',
        'Lead Qualification',
        'Customer Support',
        'Call Transfer',
        'CRM Integration',
        'Real-time Analytics',
        'Multi-language Support'
      ]
    },
    {
      id: 'outbound-service-agent',
      name: 'Outbound Service Call Agent',
      description: 'Makes outbound calls for service reminders, follow-ups, and customer satisfaction surveys.',
      detailedDescription: 'Proactive AI agent that handles outbound communications to maintain customer relationships and ensure service satisfaction.',
      workTime: 'Part Time (off-hours)',
      status: 'inactive',
      isDefault: false,
      isAvailable: true,
      capabilities: [
        'Service Reminders',
        'Follow-up Calls',
        'Customer Surveys',
        'Appointment Scheduling',
        'CRM Integration',
        'Call Analytics'
      ]
    },
    {
      id: 'appointment-confirmation-agent',
      name: 'Appointment Confirmation Call Agent',
      description: 'Automatically calls customers to confirm upcoming appointments and reschedule if needed.',
      detailedDescription: 'Specialized AI agent focused on appointment management, ensuring optimal scheduling and reducing no-shows.',
      workTime: 'Part Time (off-hours)',
      status: 'inactive',
      isDefault: false,
      isAvailable: true,
      capabilities: [
        'Appointment Confirmation',
        'Rescheduling',
        'Reminder Calls',
        'Calendar Integration',
        'SMS Notifications',
        'Customer Preferences'
      ]
    },
    {
      id: 'messaging-agent',
      name: 'Messaging Agent',
      description: 'Handles SMS and messaging communications with customers for quick responses and updates.',
      detailedDescription: 'Multi-channel messaging AI that provides instant responses across SMS, chat, and messaging platforms.',
      workTime: 'Full Time (24/7)',
      status: 'inactive',
      isDefault: false,
      isAvailable: true,
      capabilities: [
        'SMS Messaging',
        'Instant Responses',
        'Multi-platform Support',
        'Message Routing',
        'Customer History',
        'Automated Workflows'
      ]
    },
    {
      id: 'website-chat-agent',
      name: 'Website Chat Agent',
      description: 'Provides real-time chat support on your website to assist visitors and capture leads.',
      detailedDescription: 'Web-integrated AI agent that engages website visitors, answers questions, and converts traffic into leads.',
      workTime: 'Full Time (24/7)',
      status: 'inactive',
      isDefault: false,
      isAvailable: true,
      capabilities: [
        'Live Chat Support',
        'Lead Capture',
        'Website Integration',
        'Visitor Analytics',
        'Proactive Engagement',
        'Handoff to Human'
      ]
    }
  ];

  // Handle client selection change
  const handleClientChange = (clientId: string | null) => {
    setSelectedClientId(clientId);
  };

  // Handle agent card click to show details
  const handleAgentCardClick = (agent: Agent) => {
    setSelectedAgentDetails(agent);
    setIsAgentDetailsOpen(true);
  };

  // Handle agent toggle
  const handleAgentToggle = (agentId: string, currentStatus: 'active' | 'inactive') => {
    // Check if user has permission to edit agents
    if (!canEditAgents) {
      toast.error('You need client admin privileges to modify agent settings.');
      return;
    }

    const agent = agents.find(a => a.id === agentId);
    
    // For the default agent, allow toggling
    if (agent?.isDefault) {
      toast.success(`${agent.name} ${currentStatus === 'active' ? 'deactivated' : 'activated'}`);
      return;
    }

    // For other agents, show upgrade dialog
    setSelectedAgentName(agent?.name || '');
    setIsUpgradeDialogOpen(true);
  };

  // Handle turn on agent from details popup
  const handleTurnOnAgent = () => {
    // Check if user has permission to edit agents
    if (!canEditAgents) {
      toast.error('You need client admin privileges to modify agent settings.');
      return;
    }

    setIsAgentDetailsOpen(false);
    setSelectedAgentName(selectedAgentDetails?.name || '');
    setIsUpgradeDialogOpen(true);
  };

  // Get agent icon
  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'inbound-call-agent':
        return <Phone className="h-5 w-5" />;
      case 'outbound-service-agent':
        return <RefreshCw className="h-5 w-5" />;
      case 'appointment-confirmation-agent':
        return <Calendar className="h-5 w-5" />;
      case 'messaging-agent':
        return <MessageSquare className="h-5 w-5" />;
      case 'website-chat-agent':
        return <Globe className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  // Get work time badge color
  const getWorkTimeBadgeColor = (workTime: string) => {
    return workTime.includes('24/7') 
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  };

  // Get capability icon
  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'Appointment Booking':
      case 'Appointment Confirmation':
      case 'Appointment Scheduling':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'Inventory Search':
        return <Search className="h-4 w-4 text-green-500" />;
      case 'Lead Qualification':
      case 'Lead Capture':
        return <UserCheck className="h-4 w-4 text-purple-500" />;
      case 'Customer Support':
      case 'Live Chat Support':
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case 'Call Transfer':
        return <ArrowRightLeft className="h-4 w-4 text-red-500" />;
      case 'CRM Integration':
      case 'Calendar Integration':
      case 'Website Integration':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'Real-time Analytics':
      case 'Call Analytics':
      case 'Visitor Analytics':
        return <BarChart className="h-4 w-4 text-indigo-500" />;
      case 'Multi-language Support':
        return <Globe className="h-4 w-4 text-pink-500" />;
      default:
        return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  // Helper function to get background color based on status
  const getStatusBackgroundColor = () => {
    switch (status) {
      case 'maintenance':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'inactive':
        return 'bg-destructive/10 border-destructive/30';
      default:
        return '';
    }
  };

  // If system is in maintenance or inactive mode, show full-page message
  if (!isLoading && (status === 'maintenance' || status === 'inactive')) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-[calc(100vh-10rem)] p-8 rounded-lg border",
        getStatusBackgroundColor()
      )}>
        <div className="text-center max-w-md space-y-6">
          <div className="mx-auto rounded-full w-16 h-16 flex items-center justify-center bg-background border">
            {status === 'maintenance' ? (
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-destructive" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold">
            {status === 'maintenance' ? 'System Maintenance' : 'System Unavailable'}
          </h2>
          
          <p className="text-muted-foreground">
            {statusMessage || 
              (status === 'maintenance' 
                ? 'The system is currently undergoing maintenance. Agents are temporarily unavailable.'
                : 'The agent system is currently offline. Please try again later.')
            }
          </p>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Agents</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage your AI agents and their availability</p>
        </div>
        
        <div className="flex gap-2 self-start">
          {/* Client selector for admin users */}
          {canViewAllClients && (
            <ClientSelector
              selectedClientId={selectedClientId}
              onClientChange={handleClientChange}
            />
          )}
        </div>
      </div>

      {/* Active Agents Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Active Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.filter(agent => agent.status === 'active').map((agent) => (
            <Card key={agent.id} className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
              <div onClick={() => handleAgentCardClick(agent)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {getAgentIcon(agent.id)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        {agent.isDefault && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                    {showEditControls && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={agent.status === 'active'}
                          onCheckedChange={() => handleAgentToggle(agent.id, agent.status)}
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Badge className={getWorkTimeBadgeColor(agent.workTime)}>
                      {agent.workTime}
                    </Badge>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Agents Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Available Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.filter(agent => agent.status === 'inactive').map((agent) => (
            <Card key={agent.id} className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
              <div onClick={() => handleAgentCardClick(agent)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {getAgentIcon(agent.id)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                      </div>
                    </div>
                    {showEditControls && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={false}
                          onCheckedChange={() => handleAgentToggle(agent.id, agent.status)}
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Badge className={getWorkTimeBadgeColor(agent.workTime)}>
                      {agent.workTime}
                    </Badge>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Agent Details Dialog */}
      <Dialog open={isAgentDetailsOpen} onOpenChange={setIsAgentDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {selectedAgentDetails && getAgentIcon(selectedAgentDetails.id)}
              </div>
              {selectedAgentDetails?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedAgentDetails?.detailedDescription}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAgentDetails && (
            <div className="space-y-6">
              {/* Work Schedule */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Badge className={getWorkTimeBadgeColor(selectedAgentDetails.workTime)}>
                  {selectedAgentDetails.workTime}
                </Badge>
              </div>

              {/* Capabilities */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Capabilities & Integrations
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedAgentDetails.capabilities.map((capability, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      {getCapabilityIcon(capability)}
                      <span className="text-sm font-medium">{capability}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedAgentDetails.status === 'inactive' && canEditAgents && (
                  <Button 
                    onClick={handleTurnOnAgent}
                    className="flex-1"
                  >
                    Turn On & Schedule Agent
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setIsAgentDetailsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agent Not Available</DialogTitle>
            <DialogDescription>
              The {selectedAgentName} is not available in your current business plan. Contact your account manager to enable this agent.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setIsUpgradeDialogOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agents;