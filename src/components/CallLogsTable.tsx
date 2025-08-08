import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, ChevronDown, ChevronUp, Clock, Filter, Phone, PhoneCall, PhoneOutgoing, Search, User, VoicemailIcon, Eye, Info } from 'lucide-react';
import { CallLog, CallType } from '@/integrations/supabase/call-logs-service';
import CallLogsAdvancedFilter, { CallLogsAdvancedFilters } from './CallLogsAdvancedFilter';
import { cn } from '@/lib/utils';
import CallDetailsPopup from './calls/CallDetailsPopup';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InquiryTypeBadge from './calls/InquiryTypeBadge';
import { OverallScoreBadge, SentimentBadge, PromptAdherenceBadge } from './calls/EvaluationBadges';
import { CallIntelligenceService } from '@/services/callIntelligenceService';
import { LeadEvaluationService } from '@/services/leadEvaluationService';
import { PromptAdherenceService } from '@/services/promptAdherenceService';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import TestCallCheckbox from './calls/TestCallCheckbox';
import { toast } from '@/components/ui/use-toast';

// Call type badge component with theme-aware styling
const CallTypeBadge = ({ callType }: { callType: string }) => {
  // Ensure callType is a string and has a value
  const safeCallType = callType && typeof callType === 'string' ? callType.toLowerCase() : 'unknown';

  const typeConfig: Record<string, { color: string; label: string }> = {
    'inbound': { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800', label: 'Inbound' },
    'outbound': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', label: 'Outbound' },
    'missed': { color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', label: 'Missed' },
    'voicemail': { color: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800', label: 'Voicemail' },
    'unknown': { color: 'bg-muted text-muted-foreground border-border', label: 'Unknown' }
  };

  // Get the appropriate icon based on call type
  const getIcon = () => {
    switch (safeCallType) {
      case 'inbound':
        return <PhoneCall className="h-3 w-3 mr-1.5" />;
      case 'outbound':
        return <PhoneOutgoing className="h-3 w-3 mr-1.5" />;
      case 'missed':
        return <Phone className="h-3 w-3 mr-1.5" />;
      case 'voicemail':
        return <VoicemailIcon className="h-3 w-3 mr-1.5" />;
      default:
        return <Phone className="h-3 w-3 mr-1.5" />;
    }
  };

  const config = typeConfig[safeCallType] || { color: 'bg-muted text-muted-foreground border-border', label: 'Unknown' };

  return (
    <Badge variant="outline" className={cn('px-2 py-1 rounded-full text-xs font-medium border inline-flex items-center w-fit', config.color)}>
      {getIcon()}
      {config.label}
    </Badge>
  );
};

// Extended CallLog interface to include client_name for admin view and is_test_call for test status
export interface ExtendedCallLog extends CallLog {
  client_name?: string;
  is_test_call?: boolean;
}

interface CallLogsTableProps {
  callLogs: ExtendedCallLog[];
  loading: boolean;
  onRefresh: () => void;
  /**
   * Set of call IDs that have an associated lead. This enables efficient lookup
   * when displaying the 'Lead' column, and should be batch-fetched by the parent.
   */
  leadCallIds?: Set<string>;
}

/**
 * CallLogsTable component displays call logs in a clean, organized table
 * with sorting, filtering, and responsive design
 */
const CallLogsTable: React.FC<CallLogsTableProps> = ({
  callLogs,
  loading,
  onRefresh,
  /**
   * Default to empty Set if parent does not provide leadCallIds.
   * This prevents runtime errors when checking for lead associations.
   */
  leadCallIds = new Set(),
}) => {
  // Advanced filter state (minimal, modular)
  const [advancedFilters, setAdvancedFilters] = useState<CallLogsAdvancedFilters>({});
  const { user } = useAuth();
  const [sortField, setSortField] = useState<keyof CallLog>('call_start_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCallType, setSelectedCallType] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<ExtendedCallLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [inquiryTypes, setInquiryTypes] = useState<Map<string, string>>(new Map());
  const [evaluations, setEvaluations] = useState<Map<string, { overallScore: number | null; sentiment: 'positive' | 'neutral' | 'negative'; humanReviewRequired: boolean }>>(new Map());
  const [adherenceScores, setAdherenceScores] = useState<Map<string, number>>(new Map());

  // Use useMemo to stabilize the admin check and prevent infinite renders
  const isAdmin = useMemo(() => canViewSensitiveInfo(user), [user]);
  
  // Use ref to track if we're currently fetching to prevent overlapping requests
  const isFetchingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch inquiry types and evaluation data when call logs change
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the fetch to prevent excessive API calls
    timeoutRef.current = setTimeout(async () => {
      if (callLogs.length === 0 || isFetchingRef.current) return;

      const callIds = callLogs.map(log => log.id).filter(Boolean);
      if (callIds.length === 0) return;

      isFetchingRef.current = true;
      
      try {
        // Always fetch inquiry types
        const inquiryMap = await CallIntelligenceService.getCallInquiryTypes(callIds);
        setInquiryTypes(inquiryMap);

        // Only fetch evaluation data for admin users
        if (isAdmin) {
          const [evaluationMap, adherenceMap] = await Promise.all([
            LeadEvaluationService.getEvaluationsByCallIds(callIds),
            PromptAdherenceService.getAdherenceScoresByCallIds(callIds)
          ]);

          setEvaluations(evaluationMap);
          setAdherenceScores(adherenceMap);
        }
      } catch (error) {
        console.error('Error fetching call data:', error);
        // If we get insufficient resources error, wait longer before next attempt
        if (error?.message?.includes('ERR_INSUFFICIENT_RESOURCES') || error?.message?.includes('Failed to fetch')) {
          console.warn('Network resources exhausted, will retry after delay');
        }
      } finally {
        isFetchingRef.current = false;
      }
    }, 300); // 300ms debounce

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callLogs, isAdmin]);

  // Handle sorting
  const handleSort = (field: keyof CallLog) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort call logs
  // Apply advanced filters and existing filters
  const filteredAndSortedLogs = callLogs
    .filter(log => {
      // 1. Call type filter (existing)
      if (selectedCallType && log.call_type?.toLowerCase() !== selectedCallType.toLowerCase()) {
        return false;
      }

      // 2. Advanced filters (score, sentiment, inquiry type, review required)
      const evaluation = evaluations.get(log.id);
      // Score filter (1-5, nullable)
      const evalScore = evaluation?.overallScore ?? null;
      if (
        (advancedFilters.minScore !== undefined && (evalScore === null || evalScore < advancedFilters.minScore)) ||
        (advancedFilters.maxScore !== undefined && (evalScore === null || evalScore > advancedFilters.maxScore))
      ) {
        return false;
      }
      // Sentiment filter - handle '__all__' sentinel value
      const sentiment = evaluation?.sentiment ?? '';
      if (advancedFilters.sentiment && advancedFilters.sentiment !== '__all__' && sentiment !== advancedFilters.sentiment) {
        return false;
      }
      // Inquiry type filter (from inquiryTypes map) - handle '__all__' sentinel value
      const inquiryType = inquiryTypes.get(log.id) ?? '';
      if (advancedFilters.inquiryType && advancedFilters.inquiryType !== '__all__' && inquiryType !== advancedFilters.inquiryType) {
        return false;
      }
      // Review required filter (boolean in LeadEvaluation)
      const reviewEvaluation = evaluations.get(log.id);
      if (
        advancedFilters.reviewRequired !== undefined &&
        reviewEvaluation?.humanReviewRequired !== undefined &&
        reviewEvaluation?.humanReviewRequired !== advancedFilters.reviewRequired
      ) {
        return false;
      }

      // 3. Search filter (existing)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          (log.caller_full_name?.toLowerCase().includes(search) || false) ||
          (log.caller_phone_number?.toLowerCase().includes(search) || false) ||
          (log.transcript?.toLowerCase().includes(search) || false) ||
          (log.client_id?.toLowerCase().includes(search) || false) ||
          (inquiryType.toLowerCase().includes(search) || false) ||
          (log.call_type?.toLowerCase().includes(search) || false)
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Handle sorting based on field type
      if (sortField === 'call_start_time' || sortField === 'call_end_time') {
        const dateA = a[sortField] ? new Date(a[sortField]!) : new Date(0);
        const dateB = b[sortField] ? new Date(b[sortField]!) : new Date(0);
        return sortDirection === 'asc' ?
          dateA.getTime() - dateB.getTime() :
          dateB.getTime() - dateA.getTime();
      }

      // Number comparison for duration and cost fields
      if (sortField === 'call_duration_seconds' || sortField === 'call_duration_mins') {
        const numA = Number(a[sortField] || 0);
        const numB = Number(b[sortField] || 0);
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // String comparison for other fields
      const valueA = String(a[sortField] || '').toLowerCase();
      const valueB = String(b[sortField] || '').toLowerCase();

      return sortDirection === 'asc' ?
        valueA.localeCompare(valueB) :
        valueB.localeCompare(valueA);
    });

  // Render sort icon
  const renderSortIcon = (field: keyof CallLog) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1" /> :
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  // Column definition for sortable headers
  const SortableHeader = ({ field, label, className }: { field: keyof CallLog, label: string, className?: string }) => (
    <TableHead 
      className={cn(
        "px-3 sm:px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors",
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {label}
        {renderSortIcon(field)}
      </div>
    </TableHead>
  );

  const colSpan = 7; // Always show all 7 columns, including Lead, for all users

  return (
    <div className="bg-card rounded-lg shadow-sm md:shadow border border-border overflow-hidden w-full mx-auto">
      {/* Table filters */}
      <div className="p-3 border-b border-border bg-secondary/30">
        {/* Allow wrapping on small screens to prevent page-level overflow */}
        <div className="flex flex-row flex-wrap gap-3 items-center w-full min-w-0">
          {/* Search Input */}
          {/* Responsive width: full on mobile, fixed on sm+ */}
          <div className="relative w-full sm:w-[300px] min-w-0 flex-shrink">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-foreground/50" />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone, inquiry type..."
              className="pl-10 pr-3 py-2 w-full rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Call Type Filter */}
          {/* Responsive width: full on mobile, fixed on sm+ */}
          <div className="relative w-full sm:w-[200px] min-w-0 flex-shrink">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-foreground/50" />
            </div>
            <select
              className="pl-10 pr-8 py-2 w-full rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm appearance-none"
              value={selectedCallType || 'all'}
              onChange={(e) => setSelectedCallType(e.target.value === 'all' ? null : e.target.value)}
            >
              <option value="all">All Call Types</option>
              <option value={CallType.INBOUND}>Inbound</option>
              <option value={CallType.OUTBOUND}>Outbound</option>
              <option value={CallType.MISSED}>Missed</option>
              <option value={CallType.VOICEMAIL}>Voicemail</option>
            </select>
          </div>
          
          {/* Advanced Filter UI */}
          <CallLogsAdvancedFilter
            filters={advancedFilters}
            onFilterChange={setAdvancedFilters}
          />
          {/* Spacer */}
          <div className="flex-grow"></div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto w-full">
        <Table className="w-full ">
          <TableHeader>
            <TableRow>
              {/* Make caller column width responsive to reduce overflow on small screens */}
              <SortableHeader field="caller_full_name" label="Caller" className="px-3 sm:px-4 py-3 text-xs whitespace-nowrap w-[180px] sm:w-[220px]" />
              {/* Phone Number column (desktop only) - shows caller's phone number */}
              <TableHead className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider hidden md:table-cell whitespace-nowrap">Phone Number</TableHead>
              {/* Reduce Lead column width */}
              <TableHead className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider hidden md:table-cell whitespace-nowrap w-[90px]">Lead</TableHead>
              <TableHead className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider hidden md:table-cell whitespace-nowrap w-[120px]">Inquiry Type</TableHead>
              <SortableHeader field="call_start_time" label="Time" className="px-3 sm:px-4 py-3 text-xs whitespace-nowrap" />
              <SortableHeader field="call_type" label="Type" className="px-3 sm:px-4 py-3 text-xs hidden sm:table-cell whitespace-nowrap w-[110px]" />
              <TableHead className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-foreground/70 uppercase tracking-wider w-[60px]">Test</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="h-20 sm:h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                    <p className="text-foreground/70 text-xs sm:text-sm font-medium">Loading call logs...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAndSortedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="h-20 sm:h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                    <Phone className="h-8 w-8 sm:h-10 sm:w-10 text-foreground/30" />
                    <div className="space-y-1">
                      <p className="text-foreground/70 font-medium text-sm sm:text-base">No call logs found</p>
                      <p className="text-foreground/50 text-xs sm:text-sm">Try adjusting your filters or search term</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedLogs.map((log) => (
                <TableRow 
                  key={log.id} 
                  className="hover:bg-secondary/20 transition-colors cursor-pointer group relative"
                  onClick={(e) => {
                    // Prevent row click if clicking on checkbox
                    if ((e.target as HTMLElement).closest('input') || 
                        (e.target as HTMLElement).closest('[role="checkbox"]') ||
                        (e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    setSelectedCall(log);
                    setIsDetailsOpen(true);
                  }}
                  title="Click to view call details"
                >
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4 w-[220px]">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      <div className="ml-2 sm:ml-3 md:ml-4 min-w-0">
                        <div className="text-sm sm:text-base font-semibold text-foreground truncate">
                          {log.caller_full_name || 'Unknown'}
                        </div>
                        {/* For admin: show client name below caller name, just like LeadsTable */}
                        {isAdmin && log.client_name && (
                          <div className="flex items-center mt-0.5 text-xs text-foreground/60">
                            <User className="h-3 w-3 mr-1" />
                            <span className="truncate">Client: {log.client_name}</span>
                          </div>
                        )}
                        {/* Mobile: Show phone number below name */}
                        <div className="sm:hidden text-xs text-foreground/60 mt-0.5 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          <span className="truncate">{log.caller_phone_number || 'N/A'}</span>
                        </div>
                        {/* Mobile: Show inquiry type below */}
                        <div className="md:hidden mt-1">
                          {log.id && inquiryTypes.get(log.id) ? (
                            <InquiryTypeBadge inquiryType={inquiryTypes.get(log.id)!} />
                          ) : (
                            <span className="text-xs text-foreground/50">—</span>
                          )}
                        </div>
                        {/* Mobile: Show call type below on small screens */}
                        <div className="sm:hidden mt-1">
                          <CallTypeBadge callType={log.call_type || 'unknown'} />
                        </div>
                        {/* For admin view: show client name */}
                        
                      </div>
                    </div>
                  </TableCell>
                  {/* Phone Number column (desktop only) */}
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4 hidden sm:table-cell">
                    {/* Show caller phone number, or N/A if missing */}
                    {log.caller_phone_number || <span className="text-xs text-foreground/50">N/A</span>}
                  </TableCell>
                  {/* Lead column (desktop only): shows badge if call has an associated lead */}
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4 hidden sm:table-cell">
                    {/*
                      Batch association: parent fetches all leads for visible calls and passes call IDs with leads.
                      This avoids per-row queries and is efficient for large tables.
                    */}
                    {leadCallIds?.has(log.id) ? (
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 px-2 py-1 rounded-full text-xs font-medium w-fit">
                        Lead
                      </Badge>
                    ) : (
                      <span className="text-xs text-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4 hidden md:table-cell">
                    {log.id && inquiryTypes.get(log.id) ? (
                      <InquiryTypeBadge inquiryType={inquiryTypes.get(log.id)!} />
                    ) : (
                      <span className="text-xs text-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-foreground/50 mr-2" />
                      <span className="text-sm text-foreground">
                        {log.call_start_time ?
                          format(new Date(log.call_start_time), 'MMM d, yyyy') :
                          'N/A'}
                      </span>
                    </div>
                    {/* Mobile: Show duration below time */}
                    <div className="mt-1 text-xs text-foreground/60 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{log.call_duration_mins ? `${log.call_duration_mins}m` : 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4 hidden sm:table-cell w-[110px]">
                    <CallTypeBadge callType={log.call_type || 'unknown'} />
                  </TableCell>
                  
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4 text-center w-[60px]">
                    <TestCallCheckbox 
                      callId={log.id}
                      isTestCall={log.is_test_call as boolean || false}
                      onStatusChange={(id, isTest) => {
                        // Update the call in the local state
                        const updatedLogs = callLogs.map(c => 
                          c.id === id ? { ...c, is_test_call: isTest } : c
                        );
                        // Trigger a refresh if needed
                        if (onRefresh) {
                          setTimeout(onRefresh, 500); // Delay refresh to allow UI to update
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination section */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 bg-secondary/30 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <div className="text-xs sm:text-sm text-foreground/70">
          Showing {filteredAndSortedLogs.length} of {callLogs.length} call logs
        </div>

        {/* Placeholder for future pagination controls */}
        {filteredAndSortedLogs.length > 10 && (
          <div className="flex items-center space-x-2 text-xs sm:text-sm">
            <span className="text-foreground/70">Page 1</span>
          </div>
        )}
      </div>

      {/* Call Details Popup */}
      <CallDetailsPopup
        call={selectedCall}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
};

export default CallLogsTable;
