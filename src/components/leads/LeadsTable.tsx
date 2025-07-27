import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Mail,
  Phone,
  Search,
  User,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  PhoneCall,
  ExternalLink,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Lead as ContextLead } from '@/context/LeadContext';
import { Lead as SupabaseLead } from '@/integrations/supabase/lead-service';
import { adaptSupabaseLeadToContextLead } from '@/utils/leadAdapter';
import { cn } from '@/lib/utils';
import InquiryTypeBadge from '@/components/calls/InquiryTypeBadge';
import { CallIntelligenceService } from '@/services/callIntelligenceService';

interface LeadsTableProps {
  leads: SupabaseLead[];
  loading: boolean;
  onViewLead: (lead: SupabaseLead) => void;
  onEditLead: (lead: SupabaseLead) => void;
  onDeleteLead: (lead: SupabaseLead) => void;
  onStatusChange: (lead: SupabaseLead, status: SupabaseLead['status']) => void;
  onExportLeads: () => void;
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  loading,
  onViewLead,
  onEditLead,
  onDeleteLead,
  onStatusChange,
  onExportLeads,
}) => {
  const { user } = useAuth();
  const [sortField, setSortField] = useState<keyof SupabaseLead>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<SupabaseLead['status'] | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<SupabaseLead['source'] | 'all'>('all');
  const [inquiryTypes, setInquiryTypes] = useState<Map<string, string>>(new Map());

  // Handle sorting
  const handleSort = (field: keyof SupabaseLead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Fetch inquiry types when leads change
  useEffect(() => {
    const fetchInquiryTypes = async () => {
      if (leads.length === 0) return;
      
      // Extract call IDs from leads
      const callIds = leads
        .map(lead => lead.call_id)
        .filter(Boolean) as string[];
      
      if (callIds.length === 0) return;
      
      try {
        const inquiryMap = await CallIntelligenceService.getCallInquiryTypes(callIds);
        setInquiryTypes(inquiryMap);
      } catch (error) {
        console.error('Error fetching inquiry types:', error);
      }
    };
    
    fetchInquiryTypes();
  }, [leads]);

  // Filter and sort leads
  const filteredAndSortedLeads = leads
    .filter(lead => {
      // Apply status filter - case insensitive comparison
      if (selectedStatus !== 'all' && 
          lead.status.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
      
      // Apply source filter - case insensitive comparison
      if (selectedSource !== 'all' && 
          lead.source.toLowerCase() !== selectedSource.toLowerCase()) {
        return false;
      }
      
      // Apply search filter if search term exists
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        // Search in multiple fields
        return (
          lead.full_name.toLowerCase().includes(search) ||
          lead.phone_number.toLowerCase().includes(search) ||
          (lead.email?.toLowerCase().includes(search) || false) ||
          (lead.notes?.toLowerCase().includes(search) || false) ||
          // Search by inquiry type
          (lead.call_id && inquiryTypes.get(lead.call_id)?.toLowerCase().includes(search) || false)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Handle sorting based on field type
      if (sortField === 'created_at') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortDirection === 'asc' ? 
          dateA.getTime() - dateB.getTime() : 
          dateB.getTime() - dateA.getTime();
      }
      
      // String comparison for other fields
      const valueA = String(a[sortField] || '').toLowerCase();
      const valueB = String(b[sortField] || '').toLowerCase();
      
      return sortDirection === 'asc' ? 
        valueA.localeCompare(valueB) : 
        valueB.localeCompare(valueA);
    });

  // Render sort icon
  const renderSortIcon = (field: keyof SupabaseLead) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  // Get status badge with theme-aware colors
  const getStatusBadge = (status: string) => {
    // Normalize status to handle any case variations
    const normalizedStatus = status?.toLowerCase() || 'unknown';
    
    // Use theme-aware semantic classes instead of hardcoded colors
    const statusConfig: Record<string, { variant: string, label: string }> = {
      'new': { variant: 'default', label: 'New' },
      'contacted': { variant: 'secondary', label: 'Contacted' },
      'qualified': { variant: 'outline', label: 'Qualified' },
      'proposal': { variant: 'secondary', label: 'Proposal' },
      'closed_won': { variant: 'success', label: 'Closed (Won)' },
      'closed': { variant: 'success', label: 'Closed' },
      'closed_lost': { variant: 'destructive', label: 'Closed (Lost)' },
      'lost': { variant: 'destructive', label: 'Lost' }
    };

    // Use normalized status for lookup to ensure case-insensitivity
    const config = statusConfig[normalizedStatus] || { variant: 'outline', label: status || 'Unknown' };

    return (
      <Badge variant={config.variant as any} className="px-3 py-1 rounded-full text-xs font-medium">
        {config.label}
      </Badge>
    );
  };

  // Get source badge
  const getSourceBadge = (source: string) => {
    // Normalize source to handle any case variations
    const normalizedSource = source?.toLowerCase() || 'unknown';
    
    const sourceConfig: Record<string, { color: string, label: string }> = {
      'website': { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Website' },
      'direct_call': { color: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Direct Call' },
      'referral': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Referral' },
      'social_media': { color: 'bg-sky-100 text-sky-800 border-sky-200', label: 'Social Media' },
      'ai_agent': { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'AI Agent' },
      'other': { color: 'bg-muted text-muted-foreground border-border', label: 'Other' }
    };

    const config = sourceConfig[normalizedSource] || { color: 'bg-muted text-muted-foreground border-border', label: 'Unknown' };

    return (
      <Badge variant="outline" className={cn('px-3 py-1 rounded-full text-xs font-medium border', config.color)}>
        {config.label}
      </Badge>
    );
  };

  // Column definition for sortable headers
  const SortableHeader = ({ field, label, className }: { field: keyof SupabaseLead, label: string, className?: string }) => (
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
      <div className="p-3 border-b border-border bg-secondary/30">
        <div className="flex flex-col gap-2">
          {/* Search Input */}
          <div className="relative w-full">
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

          {/* Filter row */}
          <div className="flex gap-2">
            {/* Status Filter */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-foreground/50" />
              </div>
              <select
                className="pl-10 pr-8 py-2 w-full rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm appearance-none"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as SupabaseLead['status'] | 'all')}
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="closed_won">Closed (Won)</option>
                <option value="closed_lost">Closed (Lost)</option>
              </select>
            </div>

            {/* Source Filter */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-foreground/50" />
              </div>
              <select
                className="pl-10 pr-8 py-2 w-full rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm appearance-none"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as SupabaseLead['source'] | 'all')}
              >
                <option value="all">All Sources</option>
                <option value="website">Website</option>
                <option value="direct_call">Direct Call</option>
                <option value="referral">Referral</option>
                <option value="social_media">Social Media</option>
                <option value="ai_agent">AI Agent</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="full_name" label="Name" className="px-3 sm:px-4 py-3 text-xs" />
              <SortableHeader field="phone_number" label="Contact" className="px-3 sm:px-4 py-3 text-xs hidden sm:table-cell" />
              <TableHead className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider hidden md:table-cell">Inquiry Type</TableHead>
              <SortableHeader field="status" label="Status" className="px-3 sm:px-4 py-3 text-xs" />
              <SortableHeader field="created_at" label="Created" className="px-3 sm:px-4 py-3 text-xs hidden lg:table-cell" />
              <TableHead className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 sm:h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                    <p className="text-foreground/70 text-xs sm:text-sm font-medium">Loading leads...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAndSortedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 sm:h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                    <User className="h-8 w-8 sm:h-10 sm:w-10 text-foreground/30" />
                    <div className="space-y-1">
                      <p className="text-foreground/70 font-medium text-sm sm:text-base">No leads found</p>
                      <p className="text-foreground/50 text-xs sm:text-sm">Try adjusting your filters or search term</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedLeads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="hover:bg-secondary/20 transition-colors cursor-pointer"
                  onClick={(e) => {
                    // Prevent row click if clicking on dropdown menu or its children
                    if ((e.target as HTMLElement).closest('.dropdown-menu-container')) {
                      return;
                    }
                    onViewLead(lead);
                  }}
                  title="Click to view lead details"
                >
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      <div className="ml-2 sm:ml-3 md:ml-4 min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                          {lead.full_name}
                        </div>
                        {/* Mobile: Show phone number below name */}
                        <div className="sm:hidden text-xs text-foreground/60 mt-0.5 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          <span className="truncate">{lead.phone_number}</span>
                        </div>
                        {/* Mobile: Show inquiry type below */}
                        <div className="md:hidden mt-1">
                          {lead.call_id && inquiryTypes.get(lead.call_id) ? (
                            <InquiryTypeBadge inquiryType={inquiryTypes.get(lead.call_id)!} />
                          ) : (
                            <span className="text-xs text-foreground/50">—</span>
                          )}
                        </div>
                        {/* For admin view: show client name */}
                        {user && canViewSensitiveInfo(user) ? (
                          <div className="text-xs text-foreground/60 mt-0.5 flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span className="truncate">Client: {lead.client_name || 'Unknown'}</span>
                          </div>
                        ) : (
                          /* For client view: show call time instead of call ID */
                          lead.call_time && (
                            <div className="text-xs text-primary/80 mt-0.5 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span className="truncate">{lead.call_time}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4 hidden sm:table-cell">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-foreground/50 mr-2" />
                      <span className="text-sm text-foreground truncate">
                        {lead.phone_number}
                      </span>
                    </div>
                    {/* Email hidden as requested for now */}
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4 hidden md:table-cell">
                    {lead.call_id && inquiryTypes.get(lead.call_id) ? (
                      <InquiryTypeBadge inquiryType={inquiryTypes.get(lead.call_id)!} />
                    ) : (
                      <span className="text-xs text-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4">
                    {getStatusBadge(lead.status)}
                    {/* Mobile: Show created date below status */}
                    <div className="lg:hidden mt-1 text-xs text-foreground/60 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {lead.created_at && !isNaN(new Date(lead.created_at).getTime()) 
                          ? format(new Date(lead.created_at), 'MMM d, yyyy')
                          : 'Invalid date'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4 hidden lg:table-cell">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-foreground/50 mr-2" />
                      <span className="text-sm text-foreground">
                        {lead.created_at && !isNaN(new Date(lead.created_at).getTime()) 
                          ? format(new Date(lead.created_at), 'MMM d, yyyy')
                          : 'Invalid date'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-3 sm:py-4 text-right dropdown-menu-container">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewLead(lead)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditLead(lead)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Lead
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        {lead.status !== 'new' && (
                          <DropdownMenuItem onClick={() => onStatusChange(lead, 'new')}>
                            Set as New
                          </DropdownMenuItem>
                        )}
                        {lead.status !== 'contacted' && (
                          <DropdownMenuItem onClick={() => onStatusChange(lead, 'contacted')}>
                            Set as Contacted
                          </DropdownMenuItem>
                        )}
                        {lead.status !== 'qualified' && (
                          <DropdownMenuItem onClick={() => onStatusChange(lead, 'qualified')}>
                            Set as Qualified
                          </DropdownMenuItem>
                        )}
                        {lead.status !== 'proposal' && (
                          <DropdownMenuItem onClick={() => onStatusChange(lead, 'proposal')}>
                            Set as Proposal
                          </DropdownMenuItem>
                        )}
                        {lead.status !== 'closed_won' && (
                          <DropdownMenuItem onClick={() => onStatusChange(lead, 'closed_won')}>
                            Set as Closed (Won)
                          </DropdownMenuItem>
                        )}
                        {lead.status !== 'closed_lost' && (
                          <DropdownMenuItem onClick={() => onStatusChange(lead, 'closed_lost')}>
                            Set as Closed (Lost)
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeleteLead(lead)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Lead
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination section */}
      <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5 bg-secondary/30 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <div className="text-xs sm:text-sm text-foreground/70">
          Showing {filteredAndSortedLeads.length} of {leads.length} leads
        </div>
        
        {/* Placeholder for future pagination controls */}
        {filteredAndSortedLeads.length > 10 && (
          <div className="flex items-center space-x-2 text-xs sm:text-sm">
            <span className="text-foreground/70">Page 1</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsTable;