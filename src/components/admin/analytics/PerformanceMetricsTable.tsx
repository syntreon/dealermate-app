import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown,
  Download
} from 'lucide-react';
import { Client } from '@/types/admin';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatting';

interface PerformanceMetricsTableProps {
  clients: Client[];
}

type SortField = 'name' | 'calls' | 'leads' | 'conversion' | 'revenue' | 'status';
type SortDirection = 'asc' | 'desc';

export const PerformanceMetricsTable: React.FC<PerformanceMetricsTableProps> = ({ clients }) => {
  const [sortField, setSortField] = useState<SortField>('calls');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Prepare data with calculated metrics
  const tableData = clients
    .filter(client => client.metrics)
    .map(client => ({
      id: client.id,
      name: client.name,
      status: client.status,
      subscription: client.subscription_plan,
      calls: client.metrics?.totalCalls || 0,
      leads: client.metrics?.totalLeads || 0,
      conversion: client.metrics?.totalCalls ? 
        ((client.metrics.totalLeads || 0) / client.metrics.totalCalls * 100) : 0,
      revenue: client.monthly_billing_amount_cad,
      avgDuration: client.metrics?.avgCallDuration || 0,
      callsToday: client.metrics?.callsToday || 0,
      leadsToday: client.metrics?.leadsToday || 0
    }));

  // Sort data
  const sortedData = [...tableData].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'name') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    const csvData = [
      ['Client Name', 'Status', 'Subscription', 'Total Calls', 'Total Leads', 'Conversion Rate', 'Monthly Revenue', 'Avg Call Duration'],
      ...sortedData.map(row => [
        row.name,
        row.status,
        row.subscription,
        row.calls.toString(),
        row.leads.toString(),
        `${row.conversion.toFixed(2)}%`,
        row.revenue.toString(),
        `${Math.round(row.avgDuration / 60)}m`
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
        {sortField === field && (
          <div className="text-xs">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </div>
        )}
      </div>
    </Button>
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trial':
        return 'secondary';
      case 'inactive':
        return 'outline';
      case 'churned':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getConversionTrend = (conversion: number) => {
    if (conversion >= 20) return { icon: TrendingUp, color: 'text-green-500' };
    if (conversion >= 10) return { icon: ArrowUpDown, color: 'text-yellow-500' };
    return { icon: TrendingDown, color: 'text-red-500' };
  };

  if (tableData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Detailed client performance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </div>
          <Button onClick={handleExport} variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </CardTitle>
        <CardDescription>
          Detailed client performance breakdown • {tableData.length} clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="name">Client</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="status">Status</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="calls">Calls</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="leads">Leads</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="conversion">Conversion</SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="revenue">Revenue</SortButton>
                </TableHead>
                <TableHead className="text-right">Today</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row) => {
                const TrendIcon = getConversionTrend(row.conversion).icon;
                const trendColor = getConversionTrend(row.conversion).color;
                
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {row.subscription}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(row.status)} className="capitalize">
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">{formatNumber(row.calls)}</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(row.avgDuration / 60)}m avg
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">{formatNumber(row.leads)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                        <span className="font-medium">
                          {formatPercentage(row.conversion)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {formatCurrency(row.revenue, 'CAD')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm">
                        <div>{formatNumber(row.callsToday)} calls</div>
                        <div className="text-muted-foreground">
                          {formatNumber(row.leadsToday)} leads
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {formatNumber(tableData.reduce((sum, row) => sum + row.calls, 0))}
            </div>
            <div className="text-xs text-muted-foreground">Total Calls</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {formatNumber(tableData.reduce((sum, row) => sum + row.leads, 0))}
            </div>
            <div className="text-xs text-muted-foreground">Total Leads</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {formatCurrency(tableData.reduce((sum, row) => sum + row.revenue, 0), 'CAD')}
            </div>
            <div className="text-xs text-muted-foreground">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {formatPercentage(
                tableData.length > 0 ? 
                  tableData.reduce((sum, row) => sum + row.conversion, 0) / tableData.length : 0
              )}
            </div>
            <div className="text-xs text-muted-foreground">Avg Conversion</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};