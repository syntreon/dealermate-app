import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, ChevronDown, ChevronUp, Clock, Filter, Phone, PhoneCall, PhoneOutgoing, Search, User, VoicemailIcon, Eye } from 'lucide-react';
import { CallLog, CallType } from '@/integrations/supabase/call-logs-service';
import { cn } from '@/lib/utils';
import CallDetailsPopup from './calls/CallDetailsPopup';
import { Button } from '@/components/ui/button';
import InquiryTypeBadge from './calls/InquiryTypeBadge';
import { CallIntelligenceService } from '@/services/callIntelligenceService';

// Call type badge component
const CallTypeBadge = ({ callType }: { callType: string }) => {
  // Ensure callType is a string and has a value
  const safeCallType = callType && typeof callType === 'string' ? callType.toLowerCase() : 'unknown';
  
  const typeStyles: Record<string, string> = {
    'inbound': 'bg-blue-100 text-blue-800 border-blue-200',
    'outbound': 'bg-green-100 text-green-800 border-green-200',
    'missed': 'bg-amber-100 text-amber-800 border-amber-200',
    'voicemail': 'bg-purple-100 text-purple-800 border-purple-200',
    'unknown': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  // Get the appropriate icon based on call type
  const getIcon = () => {
    switch(safeCallType) {
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

  // Format the display text with proper capitalization
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
};

interface CallLogsTableProps {
  callLogs: CallLog[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * CallLogsTable component displays call logs in a clean, organized table
 * with sorting, filtering, and responsive design
 */
const CallLogsTable: React.FC<CallLogsTableProps> = ({ 
  callLogs, 
  loading,
  onRefresh
}) => {
  const [sortField, setSortField] = useState<keyof CallLog>('call_start_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCallType, setSelectedCallType] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [inquiryTypes, setInquiryTypes] = useState<Map<string, string>>(new Map());

  // Fetch inquiry types when call logs change
  useEffect(() => {
    const fetchInquiryTypes = async () => {
      if (callLogs.length === 0) return;
      
      const callIds = callLogs.map(log => log.id).filter(Boolean);
      if (callIds.length === 0) return;
      
      try {
        const inquiryMap = await CallIntelligenceService.getCallInquiryTypes(callIds);
        setInquiryTypes(inquiryMap);
      } catch (error) {
        console.error('Error fetching inquiry types:', error);
      }
    };

    fetchInquiryTypes();
  }, [callLogs]);

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
  const filteredAndSortedLogs = callLogs
    .filter(log => {
      // Apply call type filter
      if (selectedCallType && log.call_type !== selectedCallType) {
        return false;
      }
      
      // Apply search filter if search term exists
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        // Search in multiple fields with null/undefined checks
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

  // Render sort icon
  const renderSortIcon = (field: keyof CallLog) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  // Column definition for sortable headers
  const SortableHeader = ({ field, label, className }: { field: keyof CallLog, label: string, className?: string }) => (
    <th 
      className={cn(
        "px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider cursor-pointer hover:bg-secondary/50 transition-colors",
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {label}
        {renderSortIcon(field)}
      </div>
    </th>
  );

  return (
    <div className="bg-card rounded-lg shadow-sm md:shadow border border-border overflow-hidden mx-auto">
      {/* Table filters */}
      <div className="p-4 md:p-6 border-b border-border bg-secondary/30 flex flex-col sm:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-foreground/50" />
          </div>
          <input
            type="text"
            placeholder="Search by name, phone, or inquiry type..."
            className="pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 w-full rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Call Type Filter */}
        <div className="relative w-full sm:w-auto sm:min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-foreground/50" />
          </div>
          <select
            className="pl-10 md:pl-12 pr-8 py-2.5 md:py-3 w-full rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm appearance-none"
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
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary/30">
            <tr>
              <SortableHeader field="caller_full_name" label="Caller" className="px-4 md:px-5 py-3 md:py-4" />
              <SortableHeader field="caller_phone_number" label="Phone" className="px-4 md:px-5 py-3 md:py-4" />
              <th className="px-4 md:px-5 py-3 md:py-4 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                Inquiry Type
              </th>
              <SortableHeader field="call_start_time" label="Call Time" className="px-4 md:px-5 py-3 md:py-4" />
              <SortableHeader field="call_duration_mins" label="Duration" className="px-4 md:px-5 py-3 md:py-4 hidden md:table-cell" />
              <SortableHeader field="call_type" label="Type" className="px-4 md:px-5 py-3 md:py-4" />
              <th className="px-4 md:px-5 py-3 md:py-4 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 md:px-5 py-12 md:py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-foreground/70 text-sm font-medium">Loading call logs...</p>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 md:px-5 py-12 md:py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Phone className="h-10 w-10 text-foreground/30" />
                    <div className="space-y-1">
                      <p className="text-foreground/70 font-medium">No call logs found</p>
                      <p className="text-foreground/50 text-sm">Try adjusting your filters or search term</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedLogs.map((log) => (
                <tr 
                  key={log.id} 
                  className="hover:bg-secondary/20 transition-colors cursor-pointer" 
                  onClick={(e) => {
                    // Prevent row click if clicking on action buttons
                    if ((e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    setSelectedCall(log);
                    setIsDetailsOpen(true);
                  }}
                  title="Click to view call details"
                >
                  <td className="px-4 md:px-5 py-4 md:py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <div className="text-sm font-medium text-foreground">
                          {log.caller_full_name || 'Unknown'}
                        </div>
                        {/* Client ID is hidden for privacy and compliance reasons */}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-4 md:py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-foreground/50 mr-2 md:mr-3" />
                      <span className="text-sm text-foreground">
                        {log.caller_phone_number || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-4 md:py-5 whitespace-nowrap">
                    <InquiryTypeBadge inquiryType={inquiryTypes.get(log.id) || null} />
                  </td>
                  <td className="px-4 md:px-5 py-4 md:py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-foreground/50 mr-2 md:mr-3" />
                      <span className="text-sm text-foreground">
                        {log.call_start_time ? 
                          format(new Date(log.call_start_time), 'MMM d, yyyy h:mm a') : 
                          'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-4 md:py-5 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-foreground/50 mr-2 md:mr-3" />
                      <span className="text-sm text-foreground">
                        {log.call_duration_mins ? 
                          `${log.call_duration_mins} min` : 
                          'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-4 md:py-5 whitespace-nowrap">
                    <CallTypeBadge callType={log.call_type || 'unknown'} />
                  </td>
                  <td className="px-4 md:px-5 py-4 md:py-5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCall(log);
                        setIsDetailsOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination section with improved spacing */}
      <div className="px-4 md:px-5 py-4 md:py-5 bg-secondary/30 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm text-foreground/70">
          Showing {filteredAndSortedLogs.length} of {callLogs.length} call logs
        </div>
        
        {/* Placeholder for future pagination controls */}
        {filteredAndSortedLogs.length > 10 && (
          <div className="flex items-center space-x-2 text-sm">
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
