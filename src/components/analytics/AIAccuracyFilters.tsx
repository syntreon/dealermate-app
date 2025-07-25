import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  Info,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { UseAIAccuracyFiltersReturn } from '@/hooks/useAIAccuracyFilters';

interface AIAccuracyFiltersProps {
  filterHook: UseAIAccuracyFiltersReturn;
  className?: string;
  compact?: boolean;
}

export const AIAccuracyFilters: React.FC<AIAccuracyFiltersProps> = ({
  filterHook,
  className,
  compact = false
}) => {
  const {
    filters,
    setFilters,
    resetFilters,
    filterOptions,
    loadingOptions,
    validation,
    hasActiveFilters,
    filterSummary
  } = filterHook;

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    if (date) {
      setFilters({ [field]: date.toISOString() });
    }
  };

  const handleClearFilter = (filterKey: keyof typeof filters) => {
    setFilters({ [filterKey]: filterKey === 'clientId' ? null : undefined });
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {/* Compact filter summary */}
        <Badge variant="outline" className="text-xs">
          {filterSummary}
        </Badge>
        
        {/* Quick filter popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                  !
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <FilterContent
              filters={filters}
              setFilters={setFilters}
              resetFilters={resetFilters}
              filterOptions={filterOptions}
              loadingOptions={loadingOptions}
              validation={validation}
              hasActiveFilters={hasActiveFilters}
              compact={true}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <FilterContent
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
          filterOptions={filterOptions}
          loadingOptions={loadingOptions}
          validation={validation}
          hasActiveFilters={hasActiveFilters}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
        />
      </CardContent>
    </Card>
  );
};

interface FilterContentProps {
  filters: any;
  setFilters: (filters: any) => void;
  resetFilters: () => void;
  filterOptions: any;
  loadingOptions: boolean;
  validation: any;
  hasActiveFilters: boolean;
  compact?: boolean;
  showAdvanced?: boolean;
  setShowAdvanced?: (show: boolean) => void;
}

const FilterContent: React.FC<FilterContentProps> = ({
  filters,
  setFilters,
  resetFilters,
  filterOptions,
  loadingOptions,
  validation,
  hasActiveFilters,
  compact = false,
  showAdvanced = false,
  setShowAdvanced
}) => {
  return (
    <div className="space-y-4">
      {/* Validation messages */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Date Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Date Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    format(new Date(filters.startDate), "MMM dd, yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate ? new Date(filters.startDate) : undefined}
                  onSelect={(date) => handleDateChange('startDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? (
                    format(new Date(filters.endDate), "MMM dd, yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate ? new Date(filters.endDate) : undefined}
                  onSelect={(date) => handleDateChange('endDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Client Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Client</Label>
          {filters.clientId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClearFilter('clientId')}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Select
          value={filters.clientId || ''}
          onValueChange={(value) => setFilters({ clientId: value || null })}
          disabled={loadingOptions}
        >
          <SelectTrigger>
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All clients</SelectItem>
            {filterOptions?.availableClients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">AI Model</Label>
          {filters.modelType && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClearFilter('modelType')}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Select
          value={filters.modelType || ''}
          onValueChange={(value) => setFilters({ modelType: value || undefined })}
          disabled={loadingOptions}
        >
          <SelectTrigger>
            <SelectValue placeholder="All models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All models</SelectItem>
            {filterOptions?.availableModels.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters */}
      {!compact && (
        <>
          <Separator />
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced?.(!showAdvanced)}
              className="w-full justify-start text-sm"
            >
              Advanced Filters
            </Button>
            
            {showAdvanced && (
              <div className="space-y-4 pt-2">
                {/* Accuracy Threshold */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Minimum Accuracy Score
                    </Label>
                    {filters.accuracyThreshold !== undefined && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearFilter('accuracyThreshold')}
                        className="h-6 px-2 text-xs"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Slider
                      value={[filters.accuracyThreshold || 0]}
                      onValueChange={([value]) => setFilters({ accuracyThreshold: value })}
                      max={10}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span className="font-medium">
                        {filters.accuracyThreshold?.toFixed(1) || '0.0'}
                      </span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-1">
              {filters.clientId && (
                <Badge variant="secondary" className="text-xs">
                  Client: {filterOptions?.availableClients.find(c => c.id === filters.clientId)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearFilter('clientId')}
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.modelType && (
                <Badge variant="secondary" className="text-xs">
                  Model: {filters.modelType}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearFilter('modelType')}
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.accuracyThreshold !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  Accuracy ≥ {filters.accuracyThreshold.toFixed(1)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClearFilter('accuracyThreshold')}
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  function handleDateChange(field: 'startDate' | 'endDate', date: Date | undefined) {
    if (date) {
      setFilters({ [field]: date.toISOString() });
    }
  }

  function handleClearFilter(filterKey: string) {
    setFilters({ [filterKey]: filterKey === 'clientId' ? null : undefined });
  }
};