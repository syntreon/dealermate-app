import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  User,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react';
import { AuditService } from '@/services/auditService';
import { AuditLog, AuditFilters, AuditAction } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { AuditLogDetailsDialog } from '@/components/admin/audit/AuditLogDetailsDialog';

const AdminAudit = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState<AuditFilters>({
    sortBy: 'created_at',
    sortDirection: 'desc'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction | 'all'>('all');
  const [selectedTable, setSelectedTable] = useState<string>('all');

  const loadAuditLogs = async (page = 1) => {
    try {
      setIsLoading(true);
      
      const response = await AuditService.getAuditLogs({
        ...filters,
        search: searchTerm || undefined,
        action: selectedAction !== 'all' ? selectedAction : undefined,
        table_name: selectedTable !== 'all' ? selectedTable : undefined
      }, {
        page,
        limit: 20
      });

      setAuditLogs(response.data);
      setTotalCount(response.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadAuditLogs(1);
  };

  const handleExport = async () => {
    try {
      const exportData = await AuditService.exportAuditLogs({
        ...filters,
        search: searchTerm || undefined,
        action: selectedAction !== 'all' ? selectedAction : undefined,
        table_name: selectedTable !== 'all' ? selectedTable : undefined
      }, 'csv');

      // Create and download CSV file
      const csvContent = [
        ['Timestamp', 'User', 'Action', 'Table', 'Client', 'Summary'],
        ...auditLogs.map(log => [
          log.created_at.toISOString(),
          log.user?.full_name || 'System',
          log.action,
          log.table_name,
          log.client?.name || '',
          log.summary || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Audit logs have been exported to CSV.",
      });
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export audit logs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'create':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'update':
        return <Info className="h-4 w-4 text-primary" />;
      case 'delete':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'login':
        return <User className="h-4 w-4 text-success" />;
      case 'logout':
        return <User className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const getActionBadgeVariant = (action: AuditAction) => {
    switch (action) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      case 'login':
      case 'logout':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailsDialog(true);
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">
            Track all administrative actions and system events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => loadAuditLogs(currentPage)} disabled={isLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter and search audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={selectedAction} onValueChange={(value) => setSelectedAction(value as AuditAction | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="agent_status_change">Agent Status</SelectItem>
                  <SelectItem value="bulk_operation">Bulk Operation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Table</label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="All tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  <SelectItem value="clients">Clients</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="calls">Calls</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="agent_status">Agent Status</SelectItem>
                  <SelectItem value="system_messages">System Messages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            {totalCount} total entries • Showing page {currentPage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="h-4 w-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded flex-1"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-4 bg-muted rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Audit Logs Found</h3>
              <p className="text-muted-foreground">No audit logs match your current filters.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {log.user?.full_name || 'System'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.table_name}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.client ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{log.client.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {log.created_at.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(log.created_at, { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalCount > 20 && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      {/* Previous page button */}
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && loadAuditLogs(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {/* First page and ellipsis if needed */}
                      {currentPage > 3 && Math.ceil(totalCount / 20) > 5 && (
                        <>
                          <PaginationItem>
                            <PaginationLink onClick={() => loadAuditLogs(1)}>1</PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        </>
                      )}
                      
                      {/* Page numbers */}
                      {(() => {
                        const totalPages = Math.ceil(totalCount / 20);
                        let pageNumbers = [];
                        
                        if (totalPages <= 5) {
                          // If 5 or fewer pages, show all
                          pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
                        } else if (currentPage <= 3) {
                          // Near start: show first 5 pages
                          pageNumbers = [1, 2, 3, 4, 5];
                        } else if (currentPage >= totalPages - 2) {
                          // Near end: show last 5 pages
                          pageNumbers = Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
                        } else {
                          // Middle: show current page and 2 pages on each side
                          pageNumbers = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
                        }
                        
                        return pageNumbers.map(pageNum => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink 
                              isActive={pageNum === currentPage}
                              onClick={() => loadAuditLogs(pageNum)}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ));
                      })()}
                      
                      {/* Last page and ellipsis if needed */}
                      {currentPage < Math.ceil(totalCount / 20) - 2 && Math.ceil(totalCount / 20) > 5 && (
                        <>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink onClick={() => loadAuditLogs(Math.ceil(totalCount / 20))}>
                              {Math.ceil(totalCount / 20)}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      {/* Next page button */}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < Math.ceil(totalCount / 20) && loadAuditLogs(currentPage + 1)}
                          className={currentPage >= Math.ceil(totalCount / 20) ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Details Dialog */}
      <AuditLogDetailsDialog
        log={selectedLog}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </div>
  );
};

export default AdminAudit;