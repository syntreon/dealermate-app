import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientFilters as ClientFiltersType } from '@/types/admin';
import { Search, X } from 'lucide-react';

interface ClientFiltersProps {
  filters: ClientFiltersType;
  onFilterChange: (filters: ClientFiltersType) => void;
  onResetFilters: () => void;
}

const ClientFilters: React.FC<ClientFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        onFilterChange({ ...filters, search: searchTerm });
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, filters, onFilterChange]);

  // Sync local search term if filters are reset externally
  useEffect(() => {
    if (!filters.search) {
      setSearchTerm('');
    }
  }, [filters.search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      status: value as 'active' | 'inactive' | 'trial' | 'churned' | 'all',
    });
  };

  const handleTypeChange = (value: string) => {
    onFilterChange({ ...filters, type: value === 'all' ? undefined : value });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortDirection] = value.split('-');
    onFilterChange({
      ...filters,
      sortBy: sortBy as 'name' | 'joined_at' | 'last_active_at' | 'status',
      sortDirection: sortDirection as 'asc' | 'desc',
    });
  };

  const hasActiveFilters =
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    filters.type;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>

        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type || 'all'}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
            <SelectItem value="SMB">SMB</SelectItem>
            <SelectItem value="Startup">Startup</SelectItem>
            <SelectItem value="Agency">Agency</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={`${filters.sortBy || 'name'}-${filters.sortDirection || 'asc'}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="joined_at-desc">Newest First</SelectItem>
            <SelectItem value="joined_at-asc">Oldest First</SelectItem>
            <SelectItem value="last_active_at-desc">Recently Active</SelectItem>
            <SelectItem value="status-asc">Status (A-Z)</SelectItem>
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

export default ClientFilters;