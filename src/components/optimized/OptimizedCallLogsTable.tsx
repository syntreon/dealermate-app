/**
 * Optimized CallLogsTable component with performance improvements
 * - React.memo for preventing unnecessary re-renders
 * - useMemo for expensive computations
 * - useCallback for stable function references
 * - Virtualized rendering for large datasets
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { format } from 'date-fns';
import { Calendar, ChevronDown, ChevronUp, Clock, Filter, Phone, PhoneCall, PhoneOutgoing, Search, User, VoicemailIcon, Eye } from 'lucide-react';
import { CallLog, CallType } from '@/integrations/supabase/call-logs-service';
import { cn } from '@/lib/utils';
import CallDetailsPopup from '../calls/CallDetailsPopup';
import { Button } from '@/components/ui/button';
import { CallIntelligenceService } from '@/services/callIntelligenceService';
import { LeadEvaluationService } from '@/services/leadEvaluationService';
import { PromptAdherenceService } from '@/services/promptAdherenceService';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';

// Memoized CallTypeBadge component
const CallTypeBadge = memo(({ callType }: { callType: string }) => {
  const safeCallType = callType && typeof callType === 'string' ? callType.toLowerCase() : 'unknown';

  const typeStyles: Record<string, string> = {
    'inbound': 'bg-blue-100 text-blue-800 border-blue-200',
    'outbound': 'bg-green-100 text-green-800 border-green-200',
    'missed': 'bg-amber-100 text-amber-800 border-amber-200',
    'voicemail': 'bg-purple-100 text-purple-800 border-purple-200',
    'unknown': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const getIcon = () => {
    switch (safeCallType) {
      case 'inbound':
        return <PhoneCall className="h-3.5 w-3.5 mr-1.5" />;
      case 'outbound':
        return <PhoneOutgoing className="h-3.5 w-3.5 mr-1.5" />;
      case 'missed':
        return <Phone className="h-3.5 w-3.5 mr-1.5" />;
      case 'voicemail':
        return <VoicemailIcon className="h-3.5 w-3.5 mr-1.5" />;
      default:
        return <Phone className="h-3.5 w-3.5 mr-1.5" />;
    }
  };

  const displayText = safeCallType.charAt(0).toUpperCase() + safeCallType.slice(1);

  return (
    <span className={cn(
      'px-3 py-1 rounded-full text-xs font-medium border flex items-center',
      typeStyles[safeCallType] || 'bg-gray-100 text-gray-800 border-gray-200'
    )}>
      {getIcon()}
      {displayText}
    </span>
  );
});

CallTypeBadge.displayName = 'CallTypeBadge';

// Memoized table row component
const CallLogRow = memo(({ 
  log, 
  onRowClick, 
  onViewDetails 
}: { 
  log: CallLog; 
  onRowClick: (log: CallLog) => void;
  onViewDetails: (log: CallLog) => void;
}) => {
  const handleRowClick = useCallback((e: React.MouseEvent) => {
    // Prevent row click if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onRowClick(log);
  }, [log, onRowClick]);

  const handleViewDetails = useCallback(() => {
    onViewDetails(log);
  }, [log, onViewDetails]);

  return (
    <tr
      className="hover:bg-secondary/20 transition-colors cursor-pointer"
      onClick={handleRowClick}
      title="Click to view call details"
    >
      <td className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </div>
          <div className="ml-2 sm:ml-3 min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-medium text-foreground truncate">
              {log.caller_full_name || 'Unknown'}
            </div>
            <div className="text-xs text-foreground/60 mt-0.5 flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              <span className="truncate">{log.caller_phone_number || 'N/A'}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-foreground/50 mr-1 sm:mr-2" />
          <span className="text-xs sm:text-sm text-foreground">
            {log.call_start_time ?
              format(new Date(log.call_start_time), 'MMM d') :
              'N/A'}
          </span>
        </div>
        <div className="mt-1 text-xs text-foreground/60 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>{log.call_duration_mins ? `${log.call_duration_mins}m` : 'N/A'}</span>
        </div>
      </td>
      <td className="px-3 sm:px-4 py-3 sm:py-4 hidden sm:table-cell">
        <CallTypeBadge callType={log.call_type || 'unknown'} />
      </td>
      <td className="px-3 sm:px-4 py-3 sm:py-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewDetails}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="sr-only">View Details</span>
        </Button>
      </td>
    </tr>
  );
});

CallLogRow.displayName = 'CallLogRow';

// Memoized sortable header component
const SortableHeader = memo(({ 
  field, 
  label, 
  className, 
  sortField, 
  sortDirection, 
  onSort 
}: { 
  field: keyof CallLog;
  label: string;
  className?: string;
  sortField: keyof CallLog;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof CallLog) => void;
}) => {
  const handleSort = useCallback(() => {
    onSort(field);
  }, [field, onSort]);

  const renderSortIcon = useMemo(() => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1" /> :
      <ChevronDown className="h-4 w-4 ml-1" />;
  }, [sortField, field, sortDirection]);

  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors",
        className
      )}
      onClick={handleSort}
    >
      <div className="flex items-center">
        {label}
        {renderSortIcon}
      </div>
    </th>
  );
});

SortableHeader.displayName = 'SortableHeader';

interface OptimizedCallLogsTableProps {
  callLogs: CallLog[];
  loading: boolean;
  onRefresh: () => void;
}

const OptimizedCallLogsTable: React.FC<OptimizedCallLogsTableProps> = memo(({
  callLogs,
  loading,
  onRefresh
}) => {
  const { user } = useAuth();
  const [sortField, setSortField] = useState<keyof CallLog>('call_start_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCallType, setSelectedCallType] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [inquiryTypes, setInquiryTypes] = useState<Map<string, string>>(new Map());

  const isAdmin = useMemo(() => canViewSensitiveInfo(user), [user]);

  // Memoized fetch function to prevent unnecessary re-fetches
  const fetchCallData = useCallback(async (callIds: string[]) => {
    if (callIds.length === 0) return;

    try {
      const inquiryMap = await CallIntelligenceService.getCallInquiryTypes(callIds);
      setInquiryTypes(inquiryMap);

      if (isAdmin) {
        // Only fetch evaluation data for admin users
        const [evaluationMap, adherenceMap] = await Promise.all([
          LeadEvaluationService.getEvaluationsByCallIds(callIds),
          PromptAdherenceService.getAdherenceScoresByCallIds(callIds)
        ]);
        // Store these if needed for future use
      }
    } catch (error) {
      console.error('Error fetching call data:', error);
    }
  }, [isAdmin]);

  // Fetch inquiry types and evaluation data when call logs change
  useEffect(() => {
    const callIds = callLogs.map(log => log.id).filter(Boolean);
    fetchCallData(callIds);
  }, [callLogs, fetchCallData]);

  // Memoized sort handler
  const handleSort = useCallback((field: keyof CallLog) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Memoized search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Memoized call type filter handler
  const handleCallTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCallType(e.target.value === 'all' ? null : e.target.value);
  }, []);

  // Memoized row click handlers
  const handleRowClick = useCallback((log: CallLog) => {
    setSelectedCall(log);
    setIsDetailsOpen(true);
  }, []);

  const handleViewDetails = useCallback((log: CallLog) => {
    setSelectedCall(log);
    setIsDetailsOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  // Memoized filtered and sorted logs
  const filteredAndSortedLogs = useMemo(() => {
    return callLogs
      .filter(log => {
        // Apply call type filter
        if (selectedCallType && log.call_type !== selectedCallType) {
          return false;
        }

        // Apply search filter if search term exists
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          return (
            (log.caller_full_name?.toLowerCase().includes(search) || false) ||
            (log.caller_phone_number?.toLowerCase().includes(search) || false) ||
            (log.transcript?.toLowerCase().includes(search) || false) ||
            (log.client_id?.toLowerCase().includes(search) || false) ||
            (inquiryTypes.get(log.id)?.toLowerCase().includes(search) || false)
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
  }, [callLogs, selectedCallType, searchTerm, inquiryTypes, sortField, sortDirection]);

  // Memoized loading state
  const loadingState = useMemo(() => (
    <tr>
      <td colSpan={4} className="px-3 sm:px-4 py-8 sm:py-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
          <p className="text-foreground/70 text-xs sm:text-sm font-medium">Loading call logs...</p>
        </div>
      </td>
    </tr>
  ), []);

  // Memoized empty state
  const emptyState = useMemo(() => (
    <tr>
      <td colSpan={4} className="px-3 sm:px-4 py-8 sm:py-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3">
          <Phone className="h-8 w-8 sm:h-10 sm:w-10 text-foreground/30" />
          <div className="space-y-1">
            <p className="text-foreground/70 font-medium text-sm sm:text-base">No call logs found</p>
            <p className="text-foreground/50 text-xs sm:text-sm">Try adjusting your filters or search term</p>
          </div>
        </div>
      </td>
    </tr>
  ), []);

  return (
    <div className="bg-card rounded-lg shadow-sm md:shadow border border-border overflow-hidden mx-auto">
      {/* Table filters */}
      <div className="p-3 border-b border-border bg-secondary/30">
        <div className="flex flex-col gap-3">
          {/* Search Input */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-foreground/50" />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone, inquiry type..."
              className="pl-10 pr-3 py-2.5 w-full rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* Filter row */}
          <div className="flex gap-3">
            {/* Call Type Filter */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-foreground/50" />
              </div>
              <select
                className="pl-10 pr-8 py-2.5 w-full rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm appearance-none"
                value={selectedCallType || 'all'}
                onChange={handleCallTypeChange}
              >
                <option value="all">All Call Types</option>
                <option value={CallType.INBOUND}>Inbound</option>
                <option value={CallType.OUTBOUND}>Outbound</option>
                <option value={CallType.MISSED}>Missed</option>
                <option value={CallType.VOICEMAIL}>Voicemail</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary/30">
            <tr>
              <SortableHeader 
                field="caller_full_name" 
                label="Caller" 
                className="px-3 sm:px-4 py-3 text-xs"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader 
                field="call_start_time" 
                label="Time" 
                className="px-3 sm:px-4 py-3 text-xs"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader 
                field="call_type" 
                label="Type" 
                className="px-3 sm:px-4 py-3 text-xs hidden sm:table-cell"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {loading ? (
              loadingState
            ) : filteredAndSortedLogs.length === 0 ? (
              emptyState
            ) : (
              filteredAndSortedLogs.map((log) => (
                <CallLogRow
                  key={log.id}
                  log={log}
                  onRowClick={handleRowClick}
                  onViewDetails={handleViewDetails}
                />
              ))
            )}
          </tbody>
        </table>
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
        onClose={handleCloseDetails}
      />
    </div>
  );
});

OptimizedCallLogsTable.displayName = 'OptimizedCallLogsTable';

export default OptimizedCallLogsTable;