import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { ClientFilters as ClientFiltersType, SavedFilter } from '@/types/admin';
import { Search, X, Filter, Calendar as CalendarIcon, Save, Settings, Bookmark, Plus, Trash2, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ClientFiltersProps {
  filters: ClientFiltersType;
  onFilterChange: (filters: ClientFiltersType) => void;
  onResetFilters: () => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string, filters: ClientFiltersType) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
  onDeleteFilter?: (filterId: string) => void;
  isLoading?: boolean;
}

const ClientFilters: React.FC<ClientFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [saveFilterDialogOpen, setSaveFilterDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  // Debounced search with optimization
  const debouncedSearch = useCallback(
    (searchValue: string) => {
      const handler = setTimeout(() => {
        if (searchValue !== (filters.search || '')) {
          onFilterChange({ ...filters, search: searchValue || undefined });
        }
      }, 300);
      return handler;
    },
    [filters, onFilterChange]
  );

  useEffect(() => {
    const handler = debouncedSearch(searchTerm);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedSearch]);

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
      status: value === 'all' ? undefined : value as 'active' | 'inactive' | 'trial' | 'churned',
    });
  };

  const handleTypeChange = (value: string) => {
    onFilterChange({ ...filters, type: value === 'all' ? undefined : value });
  };

  const handleSubscriptionPlanChange = (value: string) => {
    onFilterChange({
      ...filters,
      subscription_plan: value === 'all' ? undefined : value as 'Free Trial' | 'Basic' | 'Pro' | 'Custom'
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortDirection] = value.split('-');
    onFilterChange({
      ...filters,
      sortBy: sortBy as 'name' | 'joined_at' | 'last_active_at' | 'status' | 'monthly_billing_amount_cad' | 'type',
      sortDirection: sortDirection as 'asc' | 'desc',
    });
  };

  const handleSearchFieldsChange = (field: string, checked: boolean) => {
    const currentFields = filters.searchFields || ['name', 'contact_person', 'contact_email', 'slug'];
    const newFields = checked
      ? [...currentFields, field]
      : currentFields.filter(f => f !== field);

    onFilterChange({
      ...filters,
      searchFields: newFields.length > 0 ? newFields as ('name' | 'contact_person' | 'contact_email' | 'slug')[] : undefined
    });
  };

  const handleDateRangeChange = (field: 'joined_at' | 'last_active_at', start?: Date, end?: Date) => {
    onFilterChange({
      ...filters,
      dateRange: start || end ? { field, start, end } : undefined
    });
  };

  const handleBillingRangeChange = (min?: number, max?: number) => {
    onFilterChange({
      ...filters,
      billingRange: (min !== undefined || max !== undefined) ? { min, max } : undefined
    });
  };

  const handleCustomFieldChange = (key: string, value: any) => {
    const customFields = { ...filters.customFields };
    if (value === '' || value === null || value === undefined) {
      delete customFields[key];
    } else {
      customFields[key] = value;
    }

    onFilterChange({
      ...filters,
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined
    });
  };

  const handleSaveFilter = () => {
    if (filterName.trim() && onSaveFilter) {
      onSaveFilter(filterName.trim(), filters);
      setFilterName('');
      setSaveFilterDialogOpen(false);
    }
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    if (onLoadFilter) {
      onLoadFilter(filter);
    }
  };

  const handleDeleteFilter = (filterId: string) => {
    if (onDeleteFilter) {
      onDeleteFilter(filterId);
    }
  };

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.type) count++;
    if (filters.subscription_plan) count++;
    if (filters.dateRange) count++;
    if (filters.billingRange) count++;
    if (filters.customFields && Object.keys(filters.customFields).length > 0) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0;

  // Get active filter badges
  const getActiveFilterBadges = () => {
    const badges = [];

    if (filters.search) {
      badges.push({ key: 'search', label: `Search: "${filters.search}"` });
    }
    if (filters.status && filters.status !== 'all') {
      badges.push({ key: 'status', label: `Status: ${filters.status}` });
    }
    if (filters.type) {
      badges.push({ key: 'type', label: `Type: ${filters.type}` });
    }
    if (filters.subscription_plan) {
      badges.push({ key: 'subscription_plan', label: `Plan: ${filters.subscription_plan}` });
    }
    if (filters.dateRange) {
      const { field, start, end } = filters.dateRange;
      let dateLabel = `${field === 'joined_at' ? 'Joined' : 'Last Active'}`;
      if (start && end) {
        dateLabel += `: ${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}`;
      } else if (start) {
        dateLabel += `: After ${format(start, 'MMM dd')}`;
      } else if (end) {
        dateLabel += `: Before ${format(end, 'MMM dd')}`;
      }
      badges.push({ key: 'dateRange', label: dateLabel });
    }
    if (filters.billingRange) {
      const { min, max } = filters.billingRange;
      let billingLabel = 'Billing';
      if (min !== undefined && max !== undefined) {
        billingLabel += `: $${min} - $${max}`;
      } else if (min !== undefined) {
        billingLabel += `: > $${min}`;
      } else if (max !== undefined) {
        billingLabel += `: < $${max}`;
      }
      badges.push({ key: 'billingRange', label: billingLabel });
    }

    return badges;
  };

  const clearFilter = (filterKey: string) => {
    const newFilters = { ...filters };
    switch (filterKey) {
      case 'search':
        delete newFilters.search;
        setSearchTerm('');
        break;
      case 'status':
        delete newFilters.status;
        break;
      case 'type':
        delete newFilters.type;
        break;
      case 'subscription_plan':
        delete newFilters.subscription_plan;
        break;
      case 'dateRange':
        delete newFilters.dateRange;
        break;
      case 'billingRange':
        delete newFilters.billingRange;
        break;
    }
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Main Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-8"
            disabled={isLoading}
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
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
            disabled={isLoading}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Type" />
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
            disabled={isLoading}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="joined_at-desc">Newest First</SelectItem>
              <SelectItem value="joined_at-asc">Oldest First</SelectItem>
              <SelectItem value="last_active_at-desc">Recently Active</SelectItem>
              <SelectItem value="monthly_billing_amount_cad-desc">Highest Billing</SelectItem>
              <SelectItem value="monthly_billing_amount_cad-asc">Lowest Billing</SelectItem>
              <SelectItem value="status-asc">Status (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters Toggle & Saved Filters */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            disabled={isLoading}
            className="whitespace-nowrap"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Advanced
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Saved Filters Dropdown */}
          {savedFilters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                  <Bookmark className="h-4 w-4 mr-2" />
                  Saved
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {savedFilters.map((filter) => (
                  <DropdownMenuItem
                    key={filter.id}
                    className="flex items-center justify-between"
                  >
                    <span
                      className="flex-1 cursor-pointer"
                      onClick={() => handleLoadFilter(filter)}
                    >
                      {filter.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFilter(filter.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Save Filter Button */}
          {hasActiveFilters && onSaveFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveFilterDialogOpen(true)}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Advanced Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Subscription Plan Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subscription Plan</Label>
              <Select
                value={filters.subscription_plan || 'all'}
                onValueChange={handleSubscriptionPlanChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="Free Trial">Free Trial</SelectItem>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange ? (
                      `${filters.dateRange.field === 'joined_at' ? 'Joined' : 'Last Active'}: ${filters.dateRange.start ? format(filters.dateRange.start, 'MMM dd') : 'Start'
                      } - ${filters.dateRange.end ? format(filters.dateRange.end, 'MMM dd') : 'End'
                      }`
                    ) : (
                      'Select date range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-3">
                    <Select
                      value={filters.dateRange?.field || 'joined_at'}
                      onValueChange={(value) => {
                        const field = value as 'joined_at' | 'last_active_at';
                        handleDateRangeChange(
                          field,
                          filters.dateRange?.start,
                          filters.dateRange?.end
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="joined_at">Joined Date</SelectItem>
                        <SelectItem value="last_active_at">Last Active</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <div>
                        <Label className="text-xs">From</Label>
                        <Calendar
                          mode="single"
                          selected={filters.dateRange?.start}
                          onSelect={(date) => handleDateRangeChange(
                            filters.dateRange?.field || 'joined_at',
                            date,
                            filters.dateRange?.end
                          )}
                          className="rounded-md border"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">To</Label>
                        <Calendar
                          mode="single"
                          selected={filters.dateRange?.end}
                          onSelect={(date) => handleDateRangeChange(
                            filters.dateRange?.field || 'joined_at',
                            filters.dateRange?.start,
                            date
                          )}
                          className="rounded-md border"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleDateRangeChange(filters.dateRange?.field || 'joined_at', undefined, undefined);
                          setDateRangeOpen(false);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setDateRangeOpen(false)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Billing Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Monthly Billing (CAD)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.billingRange?.min || ''}
                  onChange={(e) => handleBillingRangeChange(
                    e.target.value ? Number(e.target.value) : undefined,
                    filters.billingRange?.max
                  )}
                  disabled={isLoading}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.billingRange?.max || ''}
                  onChange={(e) => handleBillingRangeChange(
                    filters.billingRange?.min,
                    e.target.value ? Number(e.target.value) : undefined
                  )}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Search Fields Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Search In Fields</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'name', label: 'Name' },
                { key: 'contact_person', label: 'Contact Person' },
                { key: 'contact_email', label: 'Contact Email' },
                { key: 'slug', label: 'Slug' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`search-${key}`}
                    checked={(filters.searchFields || ['name', 'contact_person', 'contact_email', 'slug']).includes(key as any)}
                    onCheckedChange={(checked) => handleSearchFieldsChange(key, checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor={`search-${key}`} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Fields */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Fields</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                placeholder="Config Theme"
                value={filters.customFields?.['config.theme'] || ''}
                onChange={(e) => handleCustomFieldChange('config.theme', e.target.value)}
                disabled={isLoading}
              />
              <Input
                placeholder="Config Language"
                value={filters.customFields?.['config.language'] || ''}
                onChange={(e) => handleCustomFieldChange('config.language', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              <div className="flex flex-wrap gap-1">
                {getActiveFilterBadges().map(({ key, label }) => (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => clearFilter(key)}
                  >
                    {label}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-8 px-2 lg:px-3"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Clear all
            </Button>
          </div>
        </div>
      )}

      {/* Save Filter Dialog */}
      <Dialog open={saveFilterDialogOpen} onOpenChange={setSaveFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-name">Filter Name</Label>
              <Input
                id="filter-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Enter filter name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveFilterDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFilter}
              disabled={!filterName.trim()}
            >
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientFilters;