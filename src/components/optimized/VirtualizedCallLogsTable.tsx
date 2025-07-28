import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, ChevronDown, ChevronUp, Clock, Filter, Phone, PhoneCall, PhoneOutgoing, Search, User, VoicemailIcon, Eye } from 'lucide-react';
import { CallLog, CallType } from '@/integrations/supabase/call-logs-service';
import { cn } from '@/lib/utils';
import CallDetailsPopup from '@/components/calls/CallDetailsPopup';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InquiryTypeBadge from '@/components/calls/InquiryTypeBadge';
import { CallIntelligenceService } from '@/services/callIntelligenceService';
import { LeadEvaluationService } from '@/services/leadEvaluationService';
import { PromptAdherenceService } from '@/services/promptAdherenceService';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';

// Extended CallLog interface to include client_name for admin view
export interface ExtendedCallLog extends CallLog {
  client_name?: string;
}

interface VirtualizedCallLogsTableProps {
  callLogs: ExtendedCallLog[];
  loading: boolean;
  onRefresh: () => void;
  leadCallIds?: Set<string>;
  height?: number; // Height of the virtualized container
  itemHeight?: number; // Height of each row
}

// Call type badge component with theme-aware styling
const CallTypeBadge = memo(({ callType }: { callType: string }) => {
  const safeCallType = callType && typeof callType === 'string' ? callType.toLowerCase() : 'unknown';

  const typeConfig: Record<string, { color: string; label: string }> = {
    'inbound': { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800', label: 'Inbound' },
    'outbound': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', label: 'Outbound' },
    'missed': { color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', label: 'Missed' },
    'voicemail': { color: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800', label: 'Voicemail' },
    'unknown': { color: 'bg-muted text-muted-foreground border-border', label: 'Unknown' }
  };

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
});

CallTypeBadge.displayName = 'CallTypeBadge';

// Memoized row component for better performance
const CallLogRow = memo(({ 
  log, 
  isAdmin, 
  leadCallIds, 
  inquiryTypes, 
  onRowClick 
}: {
  log: ExtendedCallLog;
  isAdmin: boolean;
  leadCallIds: Set<string>;
  inquiryTypes: Map<string, string>;
  onRowClick: (log: ExtendedCallLog) => void;
}) => {
  const handleRowClick = useCallback((e: React.MouseEvent) => {
    // Prevent row click if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onRowClick(log);
  }, [log, onRowClick]);

  const handleButtonClick = useCallback(() => {
    onRowClick(log);
  }, [log, onRowClick]);

  return (
    <TableRow 
      className="hover:bg-secondary/20 transition-colors cursor-pointer"
      onClick={handleRowClick}
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
            {isAdmin && log.client_name && (
              <div className="flex items-center mt-0.5 text-xs text-foreground/60">
                <User className="h-3 w-3 mr-1" />
                <span className="truncate">Client: {log.client_name}</span>
              </div>
            )}
            <div className="sm:hidden text-xs text-foreground/60 mt-0.5 flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              <span className="truncate">{log.caller_phone_number || 'N/A'}</span>
            </div>
            <div className="md:hidden mt-1">
              {log.id && inquiryTypes.get(log.id) ? (
                <InquiryTypeBadge inquiryType={inquiryTypes.get(log.id)!} />
              ) : (
                <span className="text-xs text-foreground/50">—</span>
              )}
            </div>
            <div className="sm:hidden mt-1">
              <CallTypeBadge callType={log.call_type || 'unknown'} />
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-3 sm:px-4 py-3 sm:py-4 hidden sm:table-cell">
        {log.caller_phone_number || <span className="text-xs text-foreground/50">N/A</span>}
      </TableCell>
      <TableCell className="px-3 sm:px-4 py-3 sm:py-4 hidden sm:table-cell">
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
        <div className="mt-1 text-xs text-foreground/60 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>{log.call_duration_mins ? `${log.call_duration_mins}m` : 'N/A'}</span>
        </div>
      </TableCell>
      <TableCell className="px-3 sm:px-4 py-3 sm:py-4 hidden sm:table-cell w-[110px]">
        <CallTypeBadge callType={log.call_type || 'unknown'} />
      </TableCell>
      <TableCell className="px-3 sm:px-4 py-3 sm:py-4 text-right w-[60px]">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleButtonClick}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="sr-only">View Details</span>
        </Button>
      </TableCell>
    </TableRow>
  );
});

CallLogRow.displayName = 'CallLogRow';

/**
 * Virtualized version of CallLogsTable for handling large datasets efficiently.
 * Uses react-window for virtualization to render only visible rows.
 */
const VirtualizedCallLogsTable: React.FC<VirtualizedCallLogsTableProps> = memo(({
  callLogs,
  loading,
  onRefresh,
  leadCallIds = new Set(),
  height = 600,
  itemHeight = 80
}) => {
  const { user } = useAuth();
  const [sortField, setSortField] = useState<keyof CallLog>('call_start_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCallType, setSelectedCallType] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<ExtendedCallLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [inquiryTypes, setInquiryTypes] = useState<Map<string, string>>(new Map());

  const isAdmin = canViewSensitiveInfo(user);

  // Fetch inquiry types and evaluation data when call logs change
  useEffect(() => {
    const fetchCallData = async () => {
      if (callLogs.length === 0) return;

      const callIds = callLogs.map(log => log.id).filter(Boolean);
      if (callIds.length === 0) return;

      try {
        const inquiryMap = await CallIntelligenceService.getCallInquiryTypes(callIds);
        setInquiryTypes(inquiryMap);
      } catch (error) {
        console.error('Error fetching call data:', error);
      }
    };

    fetchCallData();
  }, [callLogs]);

  // Handle sorting
  const handleSort = useCallback((field: keyof CallLog) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Memoized filtered and sorted logs
  const filteredAndSortedLogs = useMemo(() => {
    return callLogs
      .filter(log => {
        // Apply call type filter
        if (selectedCallType && log.call_type?.toLowerCase() !== selectedCallType.toLowerCase()) {
          return false;
        }

        // Apply search filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          return (
            (log.caller_full_name?.toLowerCase().includes(search) || false) ||
            (log.caller_phone_number?.toLowerCase().includes(search) || false) ||
            (log.transcript?.toLowerCase().includes(search) || false) ||
            (log.client_id?.toLowerCase().includes(search) || false) ||
            (inquiryTypes.get(log.id)?.toLowerCase().includes(search) || false) ||
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
  }, [callLogs, selectedCallType, searchTerm, sortField, sortDirection, inquiryTypes]);

  // Handle row click
  const handleRowClick = useCallback((log: ExtendedCallLog) => {
    setSelectedCall(log);
    setIsDetailsOpen(true);
  }, []);

  // Render sort icon
  const renderSortIcon = useCallback((field: keyof CallLog) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1" /> :
      <ChevronDown className="h-4 w-4 ml-1" />;
  }, [sortField, sortDirection]);

  // Column definition for sortable headers
  const SortableHeader = useCallback(({ field, label, className }: { field: keyof CallLog, label: string, className?: string }) => (
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
  ), [handleSort, renderSortIcon]);

  // Row renderer for react-window
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const log = filteredAndSortedLogs[index];
    
    return (
      <div style={style}>
        <CallLogRow
          log={log}
          isAdmin={isAdmin}
          leadCallIds={leadCallIds}
          inquiryTypes={inquiryTypes}
          onRowClick={handleRowClick}
        />
      </div>
    );
  }, [filteredAndSortedLogs, isAdmin, leadCallIds, inquiryTypes, handleRowClick]);

  const colSpan = 7;

  return (
    <div className="bg-card rounded-lg shadow-sm md:shadow border border-border overflow-hidden w-full mx-auto">
      {/* Table filters */}
      <div className="p-3 border-b border-border bg-secondary/30">
        <div className="flex flex-row gap-3 items-center">
          {/* Search Input */}
          <div className="relative w-auto max-w-xs flex-grow-0 flex-shrink-0" style={{ width: '300px' }}>
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
          <div className="relative w-auto max-w-xs flex-grow-0 flex-shrink-0" style={{ width: '200px' }}>
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
          
          {/* Spacer */}
          <div className="flex-grow"></div>
        </div>
      </div>
      
      {/* Table Header */}
      <div className="overflow-x-auto w-full">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <SortableHeader field="caller_full_name" label="Caller" className="px-3 sm:px-4 py-3 text-xs whitespace-nowrap w-[220px]" />
              <TableHead className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider hidden md:table-cell whitespace-nowrap">Phone Number</TableHead>
              <TableHead className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider hidden md:table-cell whitespace-nowrap w-[90px]">Lead</TableHead>
              <TableHead className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider hidden md:table-cell whitespace-nowrap w-[120px]">Inquiry Type</TableHead>
              <SortableHeader field="call_start_time" label="Time" className="px-3 sm:px-4 py-3 text-xs whitespace-nowrap" />
              <SortableHeader field="call_type" label="Type" className="px-3 sm:px-4 py-3 text-xs hidden sm:table-cell whitespace-nowrap w-[110px]" />
              <TableHead className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Virtualized Table Body */}
      {loading ? (
        <div className="h-20 sm:h-24 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
            <p className="text-foreground/70 text-xs sm:text-sm font-medium">Loading call logs...</p>
          </div>
        </div>
      ) : filteredAndSortedLogs.length === 0 ? (
        <div className="h-20 sm:h-24 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3">
            <Phone className="h-8 w-8 sm:h-10 sm:w-10 text-foreground/30" />
            <div className="space-y-1">
              <p className="text-foreground/70 font-medium text-sm sm:text-base">No call logs found</p>
              <p className="text-foreground/50 text-xs sm:text-sm">Try adjusting your filters or search term</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableBody>
              <List
                height={height}
                itemCount={filteredAndSortedLogs.length}
                itemSize={itemHeight}
                width="100%"
              >
                {Row}
              </List>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination section */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 bg-secondary/30 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <div className="text-xs sm:text-sm text-foreground/70">
          Showing {filteredAndSortedLogs.length} of {callLogs.length} call logs
        </div>

        {filteredAndSortedLogs.length > 10 && (
          <div className="flex items-center space-x-2 text-xs sm:text-sm">
            <span className="text-foreground/70">Virtualized view</span>
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
});

VirtualizedCallLogsTable.displayName = 'VirtualizedCallLogsTable';

export default VirtualizedCallLogsTable;