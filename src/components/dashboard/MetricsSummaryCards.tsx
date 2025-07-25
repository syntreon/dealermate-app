import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Clock, ArrowRightLeft, Users, Calendar, Headphones, Bot, HelpCircle, Timer, Search, UserCheck, Calendar as CalendarIcon, Zap, BarChart, Globe, AlertTriangle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSystemStatus } from '@/hooks/use-system-status';
import { useAuth } from '@/context/AuthContext';

interface MetricsSummaryCardsProps {
  metrics: {
    totalCalls: number;
    averageHandleTime: string;
    callsTransferred: number;
    totalLeads: number;
    callsGrowth?: number;
    timeGrowth?: number;
    transferGrowth?: number;
    leadsGrowth?: number;
    todaysCalls?: number;
    linesAvailable?: number;
    agentsAvailable?: number;
    callsInQueue?: number;
  };
  isLoading?: boolean;
}

interface AgentInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  workTime: string;
  status: 'active' | 'available';
}

const MetricsSummaryCards: React.FC<MetricsSummaryCardsProps> = ({
  metrics,
  isLoading = false
}) => {
  const [isLinesDialogOpen, setIsLinesDialogOpen] = useState(false);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  
  // Get user info to determine client ID
  const { user } = useAuth();
  const clientId = user?.client_id || undefined;
  
  // Use the system status hook to get real-time status updates
  const { status, statusMessage, isLoading: statusLoading } = useSystemStatus(clientId);

  // Mock active agents data
  const activeAgents: AgentInfo[] = [
    {
      id: 'inbound-call-agent',
      name: 'Inbound Call Agent',
      description: 'Handles all inbound customer calls with professional expertise.',
      capabilities: ['Appointment Booking', 'Lead Qualification', 'Customer Support'],
      workTime: 'Full Time (24/7)',
      status: 'active'
    }
    // Add more active agents here as they become active
  ];
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* First Row - 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="h-20 animate-pulse bg-muted rounded-md"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Second Row - 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i + 4} className="bg-card shadow-sm">
              <CardContent className="pt-6">
                <div className="h-20 animate-pulse bg-muted rounded-md"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // If there's no data, show empty state
  if (!metrics) {
    return (
      <div className="space-y-4">
        {/* First Row - 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card shadow-sm">
              <CardContent className="pt-6 flex flex-col items-center justify-center h-32">
                <p className="text-muted-foreground">No data available</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Second Row - 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i + 4} className="bg-card shadow-sm">
              <CardContent className="pt-6 flex flex-col items-center justify-center h-32">
                <p className="text-muted-foreground">No data available</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // First row cards - Key operational metrics
  const firstRowCards = [
    {
      title: "Calls In Queue",
      value: metrics.callsInQueue || 0,
      icon: <Timer className="h-5 w-5 text-primary" />,
      growth: undefined,
      format: (value: number) => value.toLocaleString(),
      subtitle: "Calls waiting to be answered"
    },
    {
      title: "Today's Calls",
      value: metrics.todaysCalls || 0,
      icon: <Calendar className="h-5 w-5 text-primary" />,
      growth: undefined,
      format: (value: number) => value.toLocaleString(),
      subtitle: "Calls received today (EST)"
    },
    {
      title: "Agents Available",
      // Show 0 agents if system status is inactive or maintenance
      value: (!statusLoading && (status === 'inactive' || status === 'maintenance')) 
        ? 0 
        : (metrics.agentsAvailable || 1),
      icon: <Bot className="h-5 w-5 text-primary" />,
      growth: undefined,
      format: (value: number) => value.toLocaleString(),
      subtitle: (!statusLoading && (status === 'inactive' || status === 'maintenance')) 
        ? (status === 'maintenance' ? "System maintenance" : "System offline") 
        : "Active AI agents",
      hasAction: true,
      actionText: "View Details",
      onAction: () => {
        setIsAgentDialogOpen(true);
      },
      // Add status indicator for system status
      statusIndicator: (!statusLoading && (status === 'inactive' || status === 'maintenance')) 
        ? (status === 'maintenance' 
            ? <AlertTriangle className="h-4 w-4 text-amber-500 ml-1" /> 
            : <AlertCircle className="h-4 w-4 text-destructive ml-1" />) 
        : undefined
    },
    {
      title: "Lines Available",
      value: metrics.linesAvailable || 10,
      icon: <Headphones className="h-5 w-5 text-primary" />,
      growth: undefined,
      format: (value: number) => value.toLocaleString(),
      subtitle: "Concurrent phone lines",
      hasAction: true,
      actionText: "Need more lines?",
      onAction: () => setIsLinesDialogOpen(true)
    }
  ];

  // Second row cards - Performance metrics
  const secondRowCards = [
    {
      title: "Total Calls",
      value: metrics.totalCalls,
      icon: <Phone className="h-5 w-5 text-primary" />,
      growth: metrics.callsGrowth,
      format: (value: number) => value.toLocaleString()
    },
    {
      title: "Average Handle Time",
      value: metrics.averageHandleTime,
      icon: <Clock className="h-5 w-5 text-primary" />,
      growth: metrics.timeGrowth,
      format: (value: string) => value
    },
    {
      title: "Calls Transferred",
      value: metrics.callsTransferred,
      icon: <ArrowRightLeft className="h-5 w-5 text-primary" />,
      growth: metrics.transferGrowth,
      format: (value: number) => value.toLocaleString()
    },
    {
      title: "Total Leads",
      value: metrics.totalLeads,
      icon: <Users className="h-5 w-5 text-primary" />,
      growth: metrics.leadsGrowth,
      format: (value: number) => value.toLocaleString()
    }
  ];



  const renderCard = (card: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    growth?: number;
    format: (value: string | number) => string;
    subtitle?: string;
    hasAction?: boolean;
    actionText?: string;
    onAction?: () => void;
    statusIndicator?: React.ReactNode;
  }, index: number) => (
    <Card key={index} className="bg-card shadow-sm hover:border-primary/20 transition-all duration-300">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-sm">{card.title}</span>
          <div className="bg-primary/10 p-2 rounded-lg">
            {card.icon}
          </div>
        </div>
        <h3 className="text-3xl font-bold mb-2 text-card-foreground flex items-center">
          {card.format(card.value as string | number)}
          {card.statusIndicator}
        </h3>
        {card.subtitle && (
          <p className="text-xs text-muted-foreground mb-2">{card.subtitle}</p>
        )}
        {card.growth !== undefined && (
          <div className="flex items-center">
            <span className={`text-xs ${card.growth >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
              {card.growth >= 0 ? '↑' : '↓'} {Math.abs(card.growth)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">vs last month</span>
          </div>
        )}
        {card.hasAction && card.actionText && (
          <button
            onClick={card.onAction}
            className="text-xs text-primary hover:text-primary/80 underline mt-1 flex items-center gap-1"
          >
            {card.actionText}
            <HelpCircle className="h-3 w-3" />
          </button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="space-y-4">
        {/* First Row - Key Operational Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {firstRowCards.map((card, index) => renderCard(card, index))}
        </div>

        {/* Second Row - Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondRowCards.map((card, index) => renderCard(card, index + 4))}
        </div>
      </div>

      {/* Active Agents List Dialog */}
      <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Bot className="h-6 w-6" />
              </div>
              Active Agents
            </DialogTitle>
            <DialogDescription>
              Currently active AI agents in your system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {activeAgents.map((agent) => (
              <div key={agent.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{agent.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{agent.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      {agent.workTime}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {agent.capabilities.slice(0, 3).map((capability, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {activeAgents.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active agents</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsAgentDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* Lines Dialog */}
      <Dialog open={isLinesDialogOpen} onOpenChange={setIsLinesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Need More Lines?</DialogTitle>
            <DialogDescription>
              Contact your account manager to add more concurrent phone lines to your plan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setIsLinesDialogOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MetricsSummaryCards;