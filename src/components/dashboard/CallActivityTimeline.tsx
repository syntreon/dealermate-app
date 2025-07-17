import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { callLogsService } from '@/integrations/supabase/call-logs-service';
import { format, parseISO, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * Call Activity Timeline Chart Component
 * Shows the most active call times in a bar chart
 * Includes date range filtering capability
 */
export function CallActivityTimeline() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [callData, setCallData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Fetch call data when date range changes
  useEffect(() => {
    const fetchCallData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const filters = {
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        };
        
        const calls = await callLogsService.getCallLogs(filters);
        setCallData(calls);
      } catch (err) {
        console.error('Error fetching call activity data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch call activity data'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchCallData();
  }, [startDate, endDate]);

  // Process call data for the chart
  const chartData = useMemo(() => {
    if (!callData.length) return [];
    
    // Group calls by hour of day
    const hourCounts: Record<number, number> = {};
    
    callData.forEach(call => {
      if (call.call_start_time) {
        const date = parseISO(call.call_start_time);
        if (isValid(date)) {
          const hour = date.getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      }
    });
    
    // Convert to chart data format
    return Array.from({ length: 24 }, (_, hour) => ({
      hour: hour,
      hourLabel: format(new Date().setHours(hour, 0, 0, 0), 'h a'),
      calls: hourCounts[hour] || 0
    }));
  }, [callData]);

  // Handle date range changes
  const handleDateRangeChange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    // Re-fetch data with current filters
    const fetchCallData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const filters = {
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        };
        
        const calls = await callLogsService.getCallLogs(filters, true); // Force refresh
        setCallData(calls);
      } catch (err) {
        console.error('Error refreshing call activity data:', err);
        setError(err instanceof Error ? err : new Error('Failed to refresh call activity data'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchCallData();
  };

  return (
    <Card className="col-span-12 lg:col-span-8">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Call Activity Timeline</CardTitle>
          <CardDescription>Most active call times throughout the day</CardDescription>
        </div>
        <DateRangeFilter 
          onRangeChange={handleDateRangeChange}
          onRefresh={handleRefresh}
        />
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="w-full h-[300px] flex items-center justify-center">
            <div className="space-y-2 w-full">
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-[300px] flex items-center justify-center text-center">
            <div>
              <p className="text-destructive">Error loading call activity data</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
              <button 
                onClick={handleRefresh}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-[300px] flex items-center justify-center text-center">
            <div>
              <p className="text-lg font-medium">No call data available</p>
              <p className="text-sm text-muted-foreground">
                {startDate || endDate ? 
                  'Try selecting a different date range' : 
                  'There are no calls recorded yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="hourLabel" 
                  tick={{ fontSize: 12 }}
                  tickMargin={8}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} calls`, 'Call Volume']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="calls" 
                  name="Call Volume" 
                  fill="#a78bfa" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}