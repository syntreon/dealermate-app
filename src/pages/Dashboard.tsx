import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Call } from '@/context/CallsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PotentialEarnings } from '@/components/dashboard/PotentialEarnings';
import { Phone, Clock, Calendar, MessageSquare, CheckCircle, XCircle, SendHorizontal, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useClient } from '@/context/ClientContext';
import { ComingSoonBadge } from '@/components/ui/coming-soon-badge';
import { useNavigate } from 'react-router-dom';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { useCallType } from '@/context/CallTypeContext'; // Global call type filter

import MetricsSummaryCards from '@/components/dashboard/MetricsSummaryCards';
import useDashboardMetrics from '@/hooks/useDashboardMetrics';
import { CallActivityTimeline } from '@/components/dashboard/CallActivityTimeline';
import { CallsService, CallStats } from '@/services/callsService';
import CallDetailsPopup from '@/components/calls/CallDetailsPopup';
import { callLogsService } from '@/integrations/supabase/call-logs-service';

const Dashboard = () => {
  // Global call type filter from context
  const { selectedCallType } = useCallType();
  const { user } = useAuth();
  const { selectedClientId } = useClient();
  const navigate = useNavigate();

  // State for real data
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState<CallStats>({ totalCalls: 0, sent: 0, answered: 0, failed: 0 });
  const [loadingCalls, setLoadingCalls] = useState(true);


  // State for call details popup
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedCallDetails, setSelectedCallDetails] = useState<unknown>(null);
  const [isCallDetailsOpen, setIsCallDetailsOpen] = useState(false);
  const [loadingCallDetails, setLoadingCallDetails] = useState(false);

  // Check if user can view all clients (admin)
  const canViewAllClients = canViewSensitiveInfo(user);



  // Get effective client ID for data fetching
  const getEffectiveClientId = () => {
    if (canViewAllClients) {
      return selectedClientId; // Admin can select specific client or null for all
    }
    return user?.client_id || undefined; // Regular users see only their client data
  };

  // Get effective client ID for data fetching
  const effectiveClientId = getEffectiveClientId();

  // Use our custom hook to fetch dashboard metrics
  // Pass selectedCallType to dashboard metrics hook
  const { metrics, isLoading, error } = useDashboardMetrics(effectiveClientId, selectedCallType);

  // Fetch calls and stats
  useEffect(() => {
    const fetchCallsData = async () => {
      if (!user) return;

      setLoadingCalls(true);
      try {
        // Get effective client ID for data fetching
        const effectiveClientId = canViewAllClients ? selectedClientId : (user?.client_id || undefined);

        const [recentCalls, callStats] = await Promise.all([
          CallsService.getRecentCalls(5, effectiveClientId, selectedCallType),
          CallsService.getCallStats(effectiveClientId, selectedCallType)
        ]);

        setCalls(recentCalls);
        setStats(callStats);
      } catch (error) {
        console.error('Error fetching calls data:', error);
      } finally {
        setLoadingCalls(false);
      }
    };

    fetchCallsData();
  }, [user?.id, user?.role, user?.client_id, selectedClientId, canViewAllClients, selectedCallType]); // Only depend on specific user properties

  // Updated chart colors to be theme-aware
  const chartData = [
    { name: 'Sent', value: stats.sent, color: 'hsl(var(--primary) / 0.8)' }, // Primary with opacity
    { name: 'Answered', value: stats.answered, color: 'hsl(var(--primary))' }, // Primary color
    { name: 'Failed', value: stats.failed, color: 'hsl(var(--destructive))' }, // Destructive color
  ];

  // Updated status icons to use theme-aware colors
  const getStatusIcon = (status: Call['status']) => {
    switch (status) {
      case 'sent':
        return <SendHorizontal className="h-4 w-4 text-primary" />;
      case 'answered':
        // Using success semantic color instead of hardcoded green
        return <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
      case 'failed':
        // Using destructive semantic color instead of hardcoded red
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        // Using amber for pending/unknown status
        return <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
    }
  };

  // Custom function to format time ago (replacement for formatDistanceToNow)
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Define time intervals in seconds
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;

    // Calculate the appropriate time format
    if (diffInSeconds < minute) {
      return 'just now';
    } else if (diffInSeconds < hour) {
      const minutes = Math.floor(diffInSeconds / minute);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < day) {
      const hours = Math.floor(diffInSeconds / hour);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < week) {
      const days = Math.floor(diffInSeconds / day);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diffInSeconds < month) {
      const weeks = Math.floor(diffInSeconds / week);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInSeconds < year) {
      const months = Math.floor(diffInSeconds / month);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInSeconds / year);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  const handleForceRefresh = () => {
    window.location.reload();
  };

  const handleNewCall = () => {
    navigate('/call');
  };

  // Client selection is now handled by the global ClientContext

  // Handle opening call details popup
  const handleOpenCallDetails = async (callId: string) => {
    if (!callId) return;

    setSelectedCallId(callId);
    setLoadingCallDetails(true);
    setIsCallDetailsOpen(true);

    try {
      // Fetch the full call details
      const callDetails = await callLogsService.getCallLogById(callId);
      setSelectedCallDetails(callDetails);
    } catch (error) {
      console.error('Error fetching call details:', error);
      toast.error('Failed to load call details');
    } finally {
      setLoadingCallDetails(false);
    }
  };

  // Handle closing call details popup
  const handleCloseCallDetails = () => {
    setIsCallDetailsOpen(false);
    setSelectedCallId(null);
    // We don't clear selectedCallDetails immediately to avoid UI flicker
    // It will be replaced on next open
  };

  return (
    <div className="space-y-8 pb-8"> {/* Increased top-level spacing */}
      {/* Call Details Popup */}
      <CallDetailsPopup
        call={selectedCallDetails}
        isOpen={isCallDetailsOpen}
        onClose={handleCloseCallDetails}
      />
      {/* Enhanced responsive header layout with improved spacing */}
      <div className="flex flex-col space-y-6 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-2"> {/* Increased vertical spacing */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3"> {/* Stack vertically on mobile */}
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {/* Coming Soon badge hidden as requested */}
          </div>
          <p className="text-sm text-muted-foreground">Overview of your AI call system performance.</p> {/* Theme-aware text */}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0"> {/* Increased button spacing and added top margin on mobile */}
          <Button
            onClick={handleNewCall}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2" /* Added more padding */
          >
            <Phone className="h-4 w-4 mr-2" /> New Call
          </Button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <MetricsSummaryCards
        metrics={metrics ? {
          totalCalls: metrics.totalCalls,
          averageHandleTime: metrics.averageHandleTime,
          callsTransferred: metrics.callsTransferred,
          totalLeads: metrics.totalLeads,
          callsGrowth: metrics.callsGrowth,
          timeGrowth: metrics.timeGrowth,
          transferGrowth: metrics.transferGrowth,
          leadsGrowth: metrics.leadsGrowth,
          todaysCalls: metrics.todaysCalls || 0,
          linesAvailable: 10, // Static value as requested
          agentsAvailable: 1, // Static value as requested
          callsInQueue: 0 // Static value - could be dynamic in the future
        } : {
          totalCalls: 156,
          averageHandleTime: '2h 22m',
          callsTransferred: 23,
          totalLeads: 42,
          callsGrowth: 12,
          timeGrowth: 15,
          transferGrowth: 8,
          leadsGrowth: 15,
          todaysCalls: 0,
          linesAvailable: 10,
          agentsAvailable: 1,
          callsInQueue: 0
        }}
        isLoading={isLoading}
      />

      {/* Call Activity Timeline */}
      <CallActivityTimeline clientId={effectiveClientId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PotentialEarnings
          totalCalls={metrics?.totalCalls || 0}
          totalLeads={metrics?.totalLeads || 0}
          isLoading={isLoading}
        />

        <Card className="bg-card shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-card-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!loadingCalls && calls.length > 0 ? (
              <div className="space-y-4">
                {calls.slice(0, 5).map((call) => (
                  <div
                    key={call.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 border border-border hover:border-input transition-all duration-200 cursor-pointer"
                    onClick={() => handleOpenCallDetails(call.id)}
                    role="button"
                    aria-label={`View details for call from ${call.name}`}
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      {getStatusIcon(call.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium truncate">{call.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(new Date(call.timestamp))}
                        </span>
                      </div>
                      <div className="flex flex-wrap mt-1 gap-x-3 gap-y-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{call.phoneNumber}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{call.appointmentDate}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{call.appointmentTime}</span>
                        </div>
                      </div>
                      {call.message && (
                        <div className="flex items-start mt-2 text-xs text-gray-600">
                          <MessageSquare className="h-3 w-3 mr-1 mt-0.5" />
                          <p className="line-clamp-1">{call.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : loadingCalls ? (
              <div className="h-40 flex items-center justify-center text-gray-500">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <p>Loading recent activity...</p>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-500">
                <p>No activity yet. Start by making a call.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;