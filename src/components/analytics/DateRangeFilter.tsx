import React from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

interface DateRangeFilterProps {
  onRangeChange?: (startDate: string | null, endDate: string | null) => void;
  className?: string;
  showClearButton?: boolean;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
}

/**
 * A reusable date range filter component that can be used across the application
 * Provides date range selection with optional clear and refresh buttons
 */
export function DateRangeFilter({
  onRangeChange,
  className = '',
  showClearButton = true,
  showRefreshButton = true,
  onRefresh
}: DateRangeFilterProps) {
  const {
    dateRange,
    setDateRange,
    startDate,
    endDate,
    clearDateRange,
    isDateRangeSelected
  } = useDateRange();

  // Using a ref to prevent infinite loops from callback changes
  const onRangeChangeRef = React.useRef(onRangeChange);
  
  React.useEffect(() => {
    onRangeChangeRef.current = onRangeChange;
  }, [onRangeChange]);
  
  React.useEffect(() => {
    if (onRangeChangeRef.current) {
      onRangeChangeRef.current(startDate, endDate);
    }
  }, [startDate, endDate]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        placeholder="Filter by date"
        className="w-[260px]"
      />
      
      {showClearButton && isDateRangeSelected && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearDateRange}
          className="h-9 w-9"
          title="Clear date filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      {showRefreshButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          className="h-9 w-9"
          title="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}