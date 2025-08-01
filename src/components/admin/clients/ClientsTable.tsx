import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Client } from '@/types/admin';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onActivate: (client: Client) => void;
  onDeactivate: (client: Client) => void;
  /**
   * Optional row click handler. If provided, rows become clickable and accessible.
   */
  onRowClick?: (client: Client) => void;
}

const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  isLoading,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onRowClick,
}) => {
  const navigate = useNavigate();

  // Get appropriate badge for client status with theme-aware styling
  const getStatusBadge = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Inactive</Badge>;
      case 'trial':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Trial</Badge>;
      case 'churned':
        return <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted">Churned</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted">Unknown</Badge>;
    }
  };

  // Loading state with theme-aware styling
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-full"></div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No clients found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Monthly Billing</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            // If onRowClick is provided, make the row clickable and accessible
            const clickableProps = onRowClick
              ? {
                  onClick: () => onRowClick(client),
                  role: 'button',
                  tabIndex: 0,
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') onRowClick(client);
                  },
                  className: 'cursor-pointer',
                }
              : {};
            return (
              <TableRow key={client.id} {...clickableProps}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.type}</TableCell>
                <TableCell>{getStatusBadge(client.status)}</TableCell>
                <TableCell>{client.subscription_plan}</TableCell>
                <TableCell>{formatCurrency(client.monthly_billing_amount_cad, 'CAD')}</TableCell>
                <TableCell>{formatDate(client.joined_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}`)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(client)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Client
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {client.status !== 'active' && (
                        <DropdownMenuItem onClick={() => onActivate(client)}>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Activate Client
                        </DropdownMenuItem>
                      )}
                      {client.status !== 'inactive' && (
                        <DropdownMenuItem onClick={() => onDeactivate(client)}>
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Deactivate Client
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(client)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientsTable;