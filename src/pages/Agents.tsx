import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bot, Clock, MessageSquare, Phone, Calendar, Globe, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import ClientSelector from '@/components/ClientSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Agent {
  id: string;
  name: string;
  description: string;
  workTime: 'Full Time (24/7)' | 'Part Time (off-hours)';
  status: 'active' | 'inactive';
  isDefault?: boolean;
  isAvailable?: boolean;
}

const Agents: React.FC = () => {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  // Check if user can view all clients (admin)
  const canViewAllClients = canViewSensitiveInfo(user);

  // Mock agents data
  const agents: Agent[] = [
    {
      id: 'inbound-call-agent',
      name: 'Inbound Call Agent',
      description: 'Helps with answering inbound calls from customers, handling inquiries, and scheduling appointments.',
      workTime: 'Full Time (24/7)',
      status: 'active',
      isDefault: true,
      isAvailable: true
    },
    {
      id: 'outbound-service-agent',
      name: 'Outbound Service Call Agent',
      description: 'Makes outbound calls for service reminders, follow-ups, and customer satisfaction surveys.',
      workTime: 'Part Time (off-hours)',
      status: 'inactive',
      isDefault: false,
      isAvailable: true
    },
    {
      id: 'appointment-confirmation-agent',
      name: 'Appointment Confirmation Call Agent',
      description: 'Automatically calls customers to confirm upcoming appointments and reschedule if needed.',
      workTime: 'Part Time (off-hours)',
      status: 'inactive',
      isDefault: false,
      isAvailable: true
    },
    {
      id: 'messaging-agent',
      name: 'Messaging Agent',
      description: 'Handles SMS and messaging communications with customers for quick responses and updates.',
      workTime: 'Full Time (24/7)',
      status: 'inactive',
      isDefault: false,
      isAvailable: true
    },
    {
      id: 'website-chat-agent',
      name: 'Website Chat Agent',
      description: 'Provides real-time chat support on your website to assist visitors and capture leads.',
      workTime: 'Full Time (24/7)',
      status: 'inactive',
      isDefault: false,
      isAvailable: true
    }
  ];

  // Handle client selection change
  const handleClientChange = (clientId: string | null) => {
    setSelectedClientId(clientId);
  };

  // Handle agent toggle
  const handleAgentToggle = (agentId: string, currentStatus: 'active' | 'inactive') => {
    const agent = agents.find(a => a.id === agentId);
    
    // For the default agent, allow toggling
    if (agent?.isDefault) {
      toast.success(`${agent.name} ${currentStatus === 'active' ? 'deactivated' : 'activated'}`);
      return;
    }

    // For other agents, show upgrade dialog
    setSelectedAgent(agent?.name || '');
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

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Agents</h1>
          </div>
          <p className="text-muted-foreground">Manage your AI agents and their availability</p>
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
            <Card key={agent.id} className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300">
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
                  <Switch
                    checked={agent.status === 'active'}
                    onCheckedChange={() => handleAgentToggle(agent.id, agent.status)}
                  />
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
            </Card>
          ))}
        </div>
      </div>

      {/* Available Agents Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Available Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.filter(agent => agent.status === 'inactive').map((agent) => (
            <Card key={agent.id} className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300">
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
                  <Switch
                    checked={false}
                    onCheckedChange={() => handleAgentToggle(agent.id, agent.status)}
                  />
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
            </Card>
          ))}
        </div>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agent Not Available</DialogTitle>
            <DialogDescription>
              The {selectedAgent} is not available in your current business plan. Contact your account manager to enable this agent.
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