import { useState, useCallback, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { format, startOfDay, endOfDay } from 'date-fns';

export interface UseDateRangeOptions {
  defaultRange?: DateRange;
}

export interface UseDateRangeReturn {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  startDate: string | null; // ISO string for API calls
  endDate: string | null; // ISO string for API calls
  formattedRange: string;
  clearDateRange: () => void;
  isDateRangeSelected: boolean;
}

/**
 * Custom hook for managing date range selection
 * Provides formatted dates for display and API calls
 */
export function useDateRange(options: UseDateRangeOptions = {}): UseDateRangeReturn {
  const { defaultRange } = options;
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange);

  // Format dates for API calls (ISO strings)
  const startDate = useMemo(() => {
    if (dateRange?.from) {
      return startOfDay(dateRange.from).toISOString();
    }
    return null;
  }, [dateRange?.from]);

  const endDate = useMemo(() => {
    if (dateRange?.to) {
      return endOfDay(dateRange.to).toISOString();
    }
    return null;
  }, [dateRange?.to]);

  // Format date range for display
  const formattedRange = useMemo(() => {
    if (!dateRange?.from) {
      return 'All time';
    }

    if (dateRange.from && dateRange.to) {
      if (format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd')) {
        return format(dateRange.from, 'MMM d, yyyy');
      }
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }

    if (dateRange.from) {
      return `From ${format(dateRange.from, 'MMM d, yyyy')}`;
    }

    if (dateRange.to) {
      return `Until ${format(dateRange.to, 'MMM d, yyyy')}`;
    }

    return 'All time';
  }, [dateRange]);

  // Clear date range
  const clearDateRange = useCallback(() => {
    setDateRange(undefined);
  }, []);

  // Check if date range is selected
  const isDateRangeSelected = Boolean(dateRange?.from || dateRange?.to);

  return {
    dateRange,
    setDateRange,
    startDate,
    endDate,
    formattedRange,
    clearDateRange,
    isDateRangeSelected
  };
}