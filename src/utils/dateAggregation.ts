import { format, parseISO, isValid, differenceInDays, differenceInWeeks, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

export type AggregationType = 'hour' | 'day' | 'week' | 'month';

export interface AggregatedDataPoint {
  key: string;
  label: string;
  calls: number;
  period: Date;
}

/**
 * Determines the appropriate aggregation type based on the date range span
 */
export function determineAggregationType(startDate: string | null, endDate: string | null): AggregationType {
  if (!startDate || !endDate) {
    // Default to daily for no date range
    return 'day';
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  if (!isValid(start) || !isValid(end)) {
    return 'day';
  }

  const daysDiff = differenceInDays(end, start);
  const weeksDiff = differenceInWeeks(end, start);

  // Determine aggregation based on range span
  if (daysDiff <= 1) {
    return 'hour'; // Single day or less - show by hour
  } else if (daysDiff <= 31) {
    return 'day'; // Up to a month - show by day
  } else if (weeksDiff <= 12) {
    return 'week'; // Up to 3 months - show by week
  } else {
    return 'month'; // Longer periods - show by month
  }
}

/**
 * Aggregates call data based on the specified aggregation type
 */
export function aggregateCallData(
  callData: any[], 
  aggregationType: AggregationType,
  startDate: string | null,
  endDate: string | null
): AggregatedDataPoint[] {
  if (!callData.length) return [];

  const aggregatedData: Record<string, { calls: number; period: Date }> = {};

  callData.forEach(call => {
    if (!call.call_start_time) return;

    const callDate = parseISO(call.call_start_time);
    if (!isValid(callDate)) return;

    let key: string;
    let period: Date;

    switch (aggregationType) {
      case 'hour':
        // Group by hour of day
        const hour = callDate.getHours();
        key = hour.toString().padStart(2, '0');
        period = new Date();
        period.setHours(hour, 0, 0, 0);
        break;

      case 'day':
        // Group by date
        key = format(callDate, 'yyyy-MM-dd');
        period = startOfDay(callDate);
        break;

      case 'week':
        // Group by week starting Monday
        const weekStart = startOfWeek(callDate, { weekStartsOn: 1 });
        key = format(weekStart, 'yyyy-MM-dd');
        period = weekStart;
        break;

      case 'month':
        // Group by month
        key = format(callDate, 'yyyy-MM');
        period = startOfMonth(callDate);
        break;

      default:
        return;
    }

    if (!aggregatedData[key]) {
      aggregatedData[key] = { calls: 0, period };
    }
    aggregatedData[key].calls += 1;
  });

  // Convert to array and sort by period
  const result = Object.entries(aggregatedData)
    .map(([key, data]) => ({
      key,
      label: formatLabel(data.period, aggregationType),
      calls: data.calls,
      period: data.period
    }))
    .sort((a, b) => a.period.getTime() - b.period.getTime());

  // Fill in missing periods for better visualization
  return fillMissingPeriods(result, aggregationType, startDate, endDate);
}

/**
 * Formats the label for display based on aggregation type
 */
function formatLabel(date: Date, aggregationType: AggregationType): string {
  switch (aggregationType) {
    case 'hour':
      return format(date, 'h a'); // "2 PM"
    case 'day':
      return format(date, 'MMM d'); // "Jan 15"
    case 'week':
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(date, 'MMM d')} - ${format(weekEnd, 'MMM d')}`; // "Jan 15 - Jan 21"
    case 'month':
      return format(date, 'MMM yyyy'); // "Jan 2024"
    default:
      return format(date, 'MMM d');
  }
}

/**
 * Fills in missing periods to ensure continuous visualization
 */
function fillMissingPeriods(
  data: AggregatedDataPoint[], 
  aggregationType: AggregationType,
  startDate: string | null,
  endDate: string | null
): AggregatedDataPoint[] {
  if (!startDate || !endDate || data.length === 0) {
    return data;
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  if (!isValid(start) || !isValid(end)) {
    return data;
  }

  const filledData: AggregatedDataPoint[] = [];
  const existingData = new Map(data.map(d => [d.key, d]));

  let current = new Date(start);
  
  while (current <= end) {
    let key: string;
    let period: Date;
    let nextPeriod: Date;

    switch (aggregationType) {
      case 'hour':
        // For hourly, show all 24 hours
        for (let hour = 0; hour < 24; hour++) {
          key = hour.toString().padStart(2, '0');
          period = new Date();
          period.setHours(hour, 0, 0, 0);
          
          const existing = existingData.get(key);
          filledData.push(existing || {
            key,
            label: formatLabel(period, aggregationType),
            calls: 0,
            period
          });
        }
        return filledData; // Exit early for hourly

      case 'day':
        key = format(current, 'yyyy-MM-dd');
        period = startOfDay(current);
        nextPeriod = new Date(current);
        nextPeriod.setDate(nextPeriod.getDate() + 1);
        break;

      case 'week':
        period = startOfWeek(current, { weekStartsOn: 1 });
        key = format(period, 'yyyy-MM-dd');
        nextPeriod = new Date(period);
        nextPeriod.setDate(nextPeriod.getDate() + 7);
        break;

      case 'month':
        period = startOfMonth(current);
        key = format(period, 'yyyy-MM');
        nextPeriod = new Date(period);
        nextPeriod.setMonth(nextPeriod.getMonth() + 1);
        break;

      default:
        return data;
    }

    const existing = existingData.get(key);
    filledData.push(existing || {
      key,
      label: formatLabel(period, aggregationType),
      calls: 0,
      period
    });

    current = nextPeriod;
  }

  return filledData;
}

/**
 * Gets a human-readable description of the current aggregation
 */
export function getAggregationDescription(aggregationType: AggregationType): string {
  switch (aggregationType) {
    case 'hour':
      return 'Showing calls by hour of day';
    case 'day':
      return 'Showing calls by day';
    case 'week':
      return 'Showing calls by week';
    case 'month':
      return 'Showing calls by month';
    default:
      return 'Showing call activity';
  }
}