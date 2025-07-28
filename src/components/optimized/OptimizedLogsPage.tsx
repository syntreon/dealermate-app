import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CallLogsService, CallLog } from '@/integrations/supabase/call-logs-service';
import { LeadService } from '@/integrations/supabase/lead-service';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { useDebounce, useRenderPerformance, PerformanceMonitor } from '@/utils/performanceOptimization';
import MemoizedCallLogsTable from './MemoizedCallLogsTable';
import VirtualizedCallLogsTable from './VirtualizedCallLogsTable';
import { ExtendedCallLog } from '@/components/CallLogsTable';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Zap } from 'lucide-react';

/**
 * Optimized version of the Logs page that demonstrates both memoized and virtualized components
 * This page automatically switches to virtualized rendering for large datasets
 */
const OptimizedLogsPage: React.FC = () => {
  const { user } = useAuth();
  const { markRenderStart, markRenderEnd, renderCount } = useRenderPerformance('OptimizedLogsPage');
  
  const [callLogs, setCallLogs] = useState<ExtendedCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadCallIds, setLeadCallIds] = useState<Set<string>>(new Set());
  const [forceVirtualization, setForceVirtualization] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const isAdmin = canViewSensitiveInfo(user);
  
  // Determine whether to use virtualization based on dataset size
  const shouldUseVirtualization = useMemo(() => {
    return forceVirtualization || callLogs.length > 1000;
  }, [forceVirtualization, callLogs.length]);

  // Memoized fetch function to prevent unnecessary re-creations
  const fetchCallLogs = useCallback(async () => {
    if (!user?.client_id && !isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      const result = await PerformanceMonitor.timeAsync('fetch-call-logs', async () => {
        if (isAdmin) {
          // Admin can see all call logs with client names
          return await CallLogsService.getAllCallLogsWithClientNames();
        } else {
          // Regular users see only their client's call logs
          return await CallLogsService.getCallLogsByClientId(user!.client_id!);
        }
      });

      setCallLogs(result);

      // Batch fetch lead associations for better performance
      if (result.length > 0) {
        const callIds = result.map(log => log.id);
        const leadsResult = await PerformanceMonitor.timeAsync('fetch-lead-associations', async () => {
          return await LeadService.getLeadsByCallIds(callIds);
        });
        
        const leadCallIdSet = new Set(leadsResult.map(lead => lead.call_id).filter(Boolean));
        setLeadCallIds(leadCallIdSet);
      }
    } catch (err) {
      console.error('Error fetching call logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load call logs');
    } finally {
      setLoading(false);
    }
  }, [user?.client_id, isAdmin]);

  // Memoized refresh handler
  const handleRefresh = useCallback(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

  // Initial data fetch
  useEffect(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

  // Filter call logs based on search term
  const filteredCallLogs = useMemo(() => {
    if (!debouncedSearchTerm) return callLogs;
    
    return PerformanceMonitor.time('filter-call-logs', () => {
      const searchLower = debouncedSearchTerm.toLowerCase();
      return callLogs.filter(log => 
        log.caller_full_name?.toLowerCase().includes(searchLower) ||
        log.caller_phone_number?.toLowerCase().includes(searchLower) ||
        log.transcript?.toLowerCase().includes(searchLower) ||
        log.client_name?.toLowerCase().includes(searchLower)
      );
    });
  }, [callLogs, debouncedSearchTerm]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    return {
      totalRecords: callLogs.length,
      filteredRecords: filteredCallLogs.length,
      renderCount,
      usingVirtualization: shouldUseVirtualization,
      leadAssociations: leadCallIds.size
    };
  }, [callLogs.length, filteredCallLogs.length, renderCount, shouldUseVirtualization, leadCallIds.size]);

  // Mark render performance
  useEffect(() => {
    markRenderStart();
    return markRenderEnd;
  });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Call Logs</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Performance Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Real-time performance monitoring for the call logs table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{performanceMetrics.totalRecords}</div>
              <div className="text-xs text-muted-foreground">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{performanceMetrics.filteredRecords}</div>
              <div className="text-xs text-muted-foreground">Filtered Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{performanceMetrics.renderCount}</div>
              <div className="text-xs text-muted-foreground">Render Count</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{performanceMetrics.leadAssociations}</div>
              <div className="text-xs text-muted-foreground">Lead Associations</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${performanceMetrics.usingVirtualization ? 'text-emerald-600' : 'text-amber-600'}`}>
                {performanceMetrics.usingVirtualization ? 'ON' : 'OFF'}
              </div>
              <div className="text-xs text-muted-foreground">Virtualization</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(filteredCallLogs.length / Math.max(callLogs.length, 1) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Filter Efficiency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="virtualization"
                checked={forceVirtualization}
                onCheckedChange={setForceVirtualization}
              />
              <Label htmlFor="virtualization" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Force Virtualization
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search call logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button onClick={handleRefresh} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimized Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Call Logs</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {shouldUseVirtualization && (
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  <span>Virtualized</span>
                </div>
              )}
              <span>{filteredCallLogs.length} records</span>
            </div>
          </CardTitle>
          <CardDescription>
            {shouldUseVirtualization 
              ? 'Using virtualized rendering for optimal performance with large datasets'
              : 'Using memoized rendering for efficient updates'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shouldUseVirtualization ? (
            <VirtualizedCallLogsTable
              callLogs={filteredCallLogs}
              loading={loading}
              onRefresh={handleRefresh}
              leadCallIds={leadCallIds}
              height={600}
              itemHeight={80}
            />
          ) : (
            <MemoizedCallLogsTable
              callLogs={filteredCallLogs}
              loading={loading}
              onRefresh={handleRefresh}
              leadCallIds={leadCallIds}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedLogsPage;