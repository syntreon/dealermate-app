/**
 * Utility functions for date aggregation and time series data
 */

export type AggregationType = 'hour' | 'day' | 'week' | 'month';

/**
 * Determines the appropriate aggregation type based on date range
 * @param startDate Start date string
 * @param endDate End date string
 * @returns Appropriate aggregation type
 */
export function determineAggregationType(
    startDate: string | null,
    endDate: string | null
): AggregationType {
    if (!startDate || !endDate) return 'day';

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'hour';
    if (diffDays <= 7) return 'day';
    if (diffDays <= 31) return 'day';
    if (diffDays <= 90) return 'week';
    return 'month';
}

/**
 * Returns a human-readable description of the aggregation type
 * @param aggregationType The aggregation type
 * @returns Human-readable description
 */
export function getAggregationDescription(aggregationType: AggregationType): string {
    switch (aggregationType) {
        case 'hour':
            return 'Hourly breakdown';
        case 'day':
            return 'Daily breakdown';
        case 'week':
            return 'Weekly breakdown';
        case 'month':
            return 'Monthly breakdown';
        default:
            return 'Time breakdown';
    }
}

/**
 * Aggregates call data based on the specified aggregation type
 * @param calls Array of call objects
 * @param aggregationType Type of aggregation to perform
 * @param startDate Optional start date for filtering
 * @param endDate Optional end date for filtering
 * @returns Aggregated call data
 */
export function aggregateCallData(
    calls: any[],
    aggregationType: AggregationType,
    startDate?: string | null,
    endDate?: string | null
): Array<{ key: string; label: string; calls: number; period: string }> {
    // Filter calls by date range if provided
    let filteredCalls = calls;
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filteredCalls = calls.filter(call => {
            const callDate = new Date(call.call_start_time);
            return callDate >= start && callDate <= end;
        });
    }

    // Group calls by the specified time period
    const aggregated = new Map<string, number>();

    filteredCalls.forEach(call => {
        const callDate = new Date(call.call_start_time);
        let key: string;
        let label: string;

        switch (aggregationType) {
            case 'hour':
                // Format: "2023-01-01 14:00"
                key = `${callDate.getFullYear()}-${String(callDate.getMonth() + 1).padStart(2, '0')}-${String(callDate.getDate()).padStart(2, '0')} ${String(callDate.getHours()).padStart(2, '0')}:00`;
                label = `${String(callDate.getHours()).padStart(2, '0')}:00`;
                break;
            case 'day':
                // Format: "2023-01-01"
                key = `${callDate.getFullYear()}-${String(callDate.getMonth() + 1).padStart(2, '0')}-${String(callDate.getDate()).padStart(2, '0')}`;
                label = `${String(callDate.getMonth() + 1).padStart(2, '0')}/${String(callDate.getDate()).padStart(2, '0')}`;
                break;
            case 'week':
                // Get the first day of the week (Sunday)
                const firstDay = new Date(callDate);
                const day = callDate.getDay();
                firstDay.setDate(callDate.getDate() - day);
                key = `Week of ${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;
                label = `Week ${Math.ceil((callDate.getDate() + 6 - callDate.getDay()) / 7)}`;
                break;
            case 'month':
                // Format: "2023-01"
                key = `${callDate.getFullYear()}-${String(callDate.getMonth() + 1).padStart(2, '0')}`;
                label = `${String(callDate.getMonth() + 1).padStart(2, '0')}/${callDate.getFullYear()}`;
                break;
            default:
                key = `${callDate.getFullYear()}-${String(callDate.getMonth() + 1).padStart(2, '0')}-${String(callDate.getDate()).padStart(2, '0')}`;
                label = `${String(callDate.getMonth() + 1).padStart(2, '0')}/${String(callDate.getDate()).padStart(2, '0')}`;
        }

        aggregated.set(key, (aggregated.get(key) || 0) + 1);
    });

    // Convert to array and sort by key
    return Array.from(aggregated.entries())
        .map(([key, count]) => {
            // Extract label from key
            let label = key;
            if (aggregationType === 'hour') {
                label = key.split(' ')[1]; // Extract time part
            } else if (aggregationType === 'day') {
                const parts = key.split('-');
                label = `${parts[1]}/${parts[2]}`; // MM/DD format
            } else if (aggregationType === 'week') {
                label = key.replace('Week of ', 'Week '); // Simplify label
            } else if (aggregationType === 'month') {
                const parts = key.split('-');
                label = `${parts[1]}/${parts[0]}`; // MM/YYYY format
            }

            return {
                key,
                label,
                calls: count,
                period: key
            };
        })
        .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Aggregates data by day
 * @param data Array of objects with a timestamp property
 * @param getValue Function to extract the value from each data point
 * @returns Array of aggregated data points by day
 */
export function aggregateByDay<T>(
    data: T[],
    getValue: (item: T) => number,
    getDate: (item: T) => Date
): Array<{ date: Date; value: number }> {
    const aggregated = new Map<string, { date: Date; value: number; count: number }>();

    data.forEach(item => {
        const date = getDate(item);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const value = getValue(item);

        if (aggregated.has(dateKey)) {
            const existing = aggregated.get(dateKey)!;
            existing.value += value;
            existing.count += 1;
        } else {
            // Set time to midnight for consistent display
            const normalizedDate = new Date(date);
            normalizedDate.setHours(0, 0, 0, 0);

            aggregated.set(dateKey, {
                date: normalizedDate,
                value,
                count: 1
            });
        }
    });

    // Convert to array and sort by date
    return Array.from(aggregated.values())
        .map(({ date, value, count }) => ({
            date,
            value: value / count // Average value
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Aggregates data by hour
 * @param data Array of objects with a timestamp property
 * @param getValue Function to extract the value from each data point
 * @returns Array of aggregated data points by hour
 */
export function aggregateByHour<T>(
    data: T[],
    getValue: (item: T) => number,
    getDate: (item: T) => Date
): Array<{ date: Date; value: number }> {
    const aggregated = new Map<string, { date: Date; value: number; count: number }>();

    data.forEach(item => {
        const date = getDate(item);
        const dateKey = date.toISOString().split(':').slice(0, 2).join(':'); // YYYY-MM-DDTHH:MM
        const value = getValue(item);

        if (aggregated.has(dateKey)) {
            const existing = aggregated.get(dateKey)!;
            existing.value += value;
            existing.count += 1;
        } else {
            // Set minutes to 0 for consistent hourly display
            const normalizedDate = new Date(date);
            normalizedDate.setMinutes(0, 0, 0);

            aggregated.set(dateKey, {
                date: normalizedDate,
                value,
                count: 1
            });
        }
    });

    // Convert to array and sort by date
    return Array.from(aggregated.values())
        .map(({ date, value, count }) => ({
            date,
            value: value / count // Average value
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Generates time series data for the specified timeframe
 * @param timeframe The timeframe to generate data for ('day', 'week', 'month')
 * @param dataPoints Number of data points to generate
 * @returns Array of data points with timestamps and random values
 */
export function generateTimeSeriesData(
    timeframe: 'day' | 'week' | 'month',
    dataPoints: number = 24
): Array<{ timestamp: Date; value: number }> {
    const now = new Date();
    const result: Array<{ timestamp: Date; value: number }> = [];

    // Determine interval based on timeframe
    let interval: number;
    switch (timeframe) {
        case 'day':
            interval = 60 * 60 * 1000; // 1 hour in milliseconds
            break;
        case 'week':
            interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
            break;
        case 'month':
            interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
            dataPoints = 30; // Override to ensure we have 30 days
            break;
        default:
            interval = 60 * 60 * 1000; // Default to hourly
    }

    // Generate data points
    for (let i = 0; i < dataPoints; i++) {
        const timestamp = new Date(now.getTime() - (dataPoints - i) * interval);
        result.push({
            timestamp,
            value: Math.floor(Math.random() * 100) + 50 // Random value between 50-150
        });
    }

    return result;
}

/**
 * Calculates the growth percentage between two values
 * @param current Current value
 * @param previous Previous value
 * @returns Growth percentage
 */
export function calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

/**
 * Groups data by a specific time period
 * @param data Array of objects with a timestamp property
 * @param period The period to group by ('hour', 'day', 'week', 'month')
 * @param getValue Function to extract the value from each data point
 * @param getDate Function to extract the date from each data point
 * @returns Array of grouped data points
 */
export function groupByTimePeriod<T>(
    data: T[],
    period: 'hour' | 'day' | 'week' | 'month',
    getValue: (item: T) => number,
    getDate: (item: T) => Date
): Array<{ period: string; value: number }> {
    const grouped = new Map<string, { value: number; count: number }>();

    data.forEach(item => {
        const date = getDate(item);
        let periodKey: string;

        switch (period) {
            case 'hour':
                periodKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:00`;
                break;
            case 'day':
                periodKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                break;
            case 'week':
                // Get the first day of the week (Sunday)
                const firstDay = new Date(date);
                const day = date.getDay();
                firstDay.setDate(date.getDate() - day);
                periodKey = `Week of ${firstDay.getFullYear()}-${firstDay.getMonth() + 1}-${firstDay.getDate()}`;
                break;
            case 'month':
                periodKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
                break;
            default:
                periodKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        }

        const value = getValue(item);

        if (grouped.has(periodKey)) {
            const existing = grouped.get(periodKey)!;
            existing.value += value;
            existing.count += 1;
        } else {
            grouped.set(periodKey, {
                value,
                count: 1
            });
        }
    });

    // Convert to array and sort by period
    return Array.from(grouped.entries())
        .map(([period, { value, count }]) => ({
            period,
            value: value / count // Average value
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
}