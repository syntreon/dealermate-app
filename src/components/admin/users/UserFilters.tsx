import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserFilters as UserFiltersType, Client } from '@/types/admin';
import { Search, X } from 'lucide-react';

interface UserFiltersProps {
  filters: UserFiltersType;
  clients: Client[];
  onFilterChange: (filters: UserFiltersType) => void;
  onResetFilters: () => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  clients,
  onFilterChange,
  onResetFilters,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    onFilterChange({
      ...filters,
      role: value === 'all' ? undefined : value as any,
    });
  };

  const handleClientChange = (value: string) => {
    onFilterChange({
      ...filters,
      client_id: value === 'all' ? undefined : value,
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortDirection] = value.split('-');
    onFilterChange({
      ...filters,
      sortBy: sortBy as any,
      sortDirection: sortDirection as 'asc' | 'desc',
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.role ||
    filters.client_id;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>

        <Select
          value={filters.role || 'all'}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="client_admin">Client Admin</SelectItem>
            <SelectItem value="client_user">Client User</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.client_id || 'all'}
          onValueChange={handleClientChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={`${filters.sortBy || 'full_name'}-${filters.sortDirection || 'asc'}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full_name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="full_name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="email-asc">Email (A-Z)</SelectItem>
            <SelectItem value="email-desc">Email (Z-A)</SelectItem>
            <SelectItem value="created_at-desc">Newest First</SelectItem>
            <SelectItem value="created_at-asc">Oldest First</SelectItem>
            <SelectItem value="last_login_at-desc">Recently Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing filtered results
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-8 px-2 lg:px-3"
          >
            <X className="h-4 w-4 mr-2" />
            Reset filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserFilters;