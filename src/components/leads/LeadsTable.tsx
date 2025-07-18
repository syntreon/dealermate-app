import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Lead } from '@/context/LeadContext';
import { cn } from '@/lib/utils';

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  onViewLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: Lead['status']) => void;
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
  const [sortField, setSortField] = useState<keyof Lead>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Lead['status'] | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<Lead['source'] | 'all'>('all');

  // Handle sorting
  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort leads
  const filteredAndSortedLeads = leads
    .filter(lead => {
      // Apply status filter
      if (selectedStatus !== 'all' && lead.status !== selectedStatus) {
        return false;
      }
      
      // Apply source filter
      if (selectedSource !== 'all' && lead.source !== selectedSource) {
        return false;
      }
      
      // Apply search filter if search term exists
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        // Search in multiple fields
        return (
          lead.fullName.toLowerCase().includes(search) ||
          lead.phoneNumber.toLowerCase().includes(search) ||
          (lead.email?.toLowerCase().includes(search) || false) ||
          (lead.notes?.toLowerCase().includes(search) || false)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Handle sorting based on field type
      if (sortField === 'createdAt') {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
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
  const renderSortIcon = (field: keyof Lead) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  // Get status badge
  const getStatusBadge = (status: Lead['status']) => {
    const statusConfig: Record<Lead['status'], { color: string, label: string }> = {
      new: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'New' },
      contacted: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Contacted' },
      qualified: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Qualified' },
      proposal: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Proposal' },
      closed_won: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Closed (Won)' },
      closed_lost: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Closed (Lost)' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' };

    return (
      <Badge className={cn('px-3 py-1 rounded-full text-xs font-medium border', config.color)}>
        {config.label}
      </Badge>
    );
  };

  // Get source badge
  const getSourceBadge = (source: Lead['source']) => {
    const sourceConfig: Record<Lead['source'], { color: string, label: string }> = {
      website: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Website' },
      direct_call: { color: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Direct Call' },
      referral: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Referral' },
      social_media: { color: 'bg-sky-100 text-sky-800 border-sky-200', label: 'Social Media' },
      other: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Other' }
    };

    const config = sourceConfig[source] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Unknown' };

    return (
      <Badge variant="outline" className={cn('px-3 py-1 rounded-full text-xs font-medium border', config.color)}>
        {config.label}
      </Badge>
    );
  };

  // Column definition for sortable headers
  const SortableHeader = ({ field, label, className }: { field: keyof Lead, label: string, className?: string }) => (
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
      <div className="p-4 md:p-6 border-b border-border bg-secondary/30 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-foreground/50" />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 w-full rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="outline" size="sm" onClick={onExportLeads}>
              <Download className="h-4 w-4 mr-2" />
              Export Leads
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[180px]">
            <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-foreground/50" />
            </div>
            <select
              className="pl-10 md:pl-12 pr-8 py-2.5 md:py-3 w-full rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm appearance-none"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as Lead['status'] | 'all')}
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

          <div className="relative min-w-[180px]">
            <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-foreground/50" />
            </div>
            <select
              className="pl-10 md:pl-12 pr-8 py-2.5 md:py-3 w-full rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm appearance-none"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as Lead['source'] | 'all')}
            >
              <option value="all">All Sources</option>
              <option value="website">Website</option>
              <option value="direct_call">Direct Call</option>
              <option value="referral">Referral</option>
              <option value="social_media">Social Media</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="fullName" label="Name" />
              <SortableHeader field="phoneNumber" label="Contact" />
              <SortableHeader field="status" label="Status" />
              <SortableHeader field="source" label="Source" />
              <SortableHeader field="createdAt" label="Created" />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-foreground/70 text-sm font-medium">Loading leads...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAndSortedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <User className="h-10 w-10 text-foreground/30" />
                    <div className="space-y-1">
                      <p className="text-foreground/70 font-medium">No leads found</p>
                      <p className="text-foreground/50 text-sm">Try adjusting your filters or search term</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="ml-3 md:ml-4">
                        <div className="text-sm font-medium text-foreground">
                          {lead.fullName}
                        </div>
                        {/* Only show client ID to admins */}
                        {lead.clientId && canViewSensitiveInfo(user) && (
                          <div className="text-xs text-foreground/60 mt-0.5">
                            Client ID: {lead.clientId}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-foreground/50 mr-2" />
                        <span className="text-sm text-foreground">
                          {lead.phoneNumber}
                        </span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-foreground/50 mr-2" />
                          <span className="text-sm text-foreground">
                            {lead.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(lead.status)}
                  </TableCell>
                  <TableCell>
                    {getSourceBadge(lead.source)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-foreground/50 mr-2" />
                      <span className="text-sm text-foreground">
                        {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
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
      <div className="px-4 md:px-5 py-4 md:py-5 bg-secondary/30 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm text-foreground/70">
          Showing {filteredAndSortedLeads.length} of {leads.length} leads
        </div>
        
        {/* Placeholder for future pagination controls */}
        {filteredAndSortedLeads.length > 10 && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-foreground/70">Page 1</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsTable;