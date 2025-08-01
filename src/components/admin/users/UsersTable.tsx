import React from 'react';
import { getRoleLabel } from '@/utils/roleLabels'; // Centralized role label mapping
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
  Mail,
  Building2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Client } from '@/types/admin';
import { formatDate } from '@/utils/formatters';

interface UsersTableProps {
  users: User[];
  clients: Client[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  /**
   * Optional row click handler. If provided, rows become clickable and accessible.
   */
  onRowClick?: (user: User) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  clients,
  isLoading,
  onEdit,
  onDelete,
  onRowClick,
}) => {
  // Get appropriate badge for user role
  // Get appropriate badge for user role with theme-aware styling
  // Returns a themed badge for the user's role using the centralized role label mapping
  // Use centralized role label mapping
// (imported at top)

  const getRoleBadge = (role: User['role']) => {
    let badgeClass = '';
    switch (role) {
      case 'owner':
        badgeClass = 'bg-primary/10 text-primary border-primary/20'; break;
      case 'admin':
        badgeClass = 'bg-blue-500/10 text-blue-500 border-blue-500/20'; break;
      case 'client_admin':
        badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'; break;
      default:
        badgeClass = 'bg-muted/50 text-muted-foreground border-muted'; break;
    }
    return (
      <Badge variant="outline" className={badgeClass}>
        {getRoleLabel(role)}
      </Badge>
    );
  };

  // Get client name display
  const getClientName = (clientId: string | null) => {
    if (clientId === null) {
      return <Badge variant="outline">All Clients</Badge>;
    }
    
    const client = clients.find(c => c.id === clientId);
    return client ? (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span>{client.name}</span>
      </div>
    ) : (
      <span className="text-muted-foreground">Unknown Client</span>
    );
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

  // Empty state
  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            // If onRowClick is provided, make the row clickable and accessible
            const clickableProps = onRowClick
              ? {
                  onClick: () => onRowClick(user),
                  role: 'button',
                  tabIndex: 0,
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') onRowClick(user);
                  },
                  className: 'cursor-pointer',
                }
              : {};
            return (
              <TableRow key={user.id} {...clickableProps}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${user.email}`} className="hover:underline">
                      {user.email}
                    </a>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getClientName(user.client_id)}</TableCell>
                <TableCell>
                  {user.last_login_at
                    ? formatDate(user.last_login_at)
                    : 'Never'}
                </TableCell>
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
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(user)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
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

export default UsersTable;