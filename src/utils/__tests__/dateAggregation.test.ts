import { determineAggregationType, aggregateCallData, getAggregationDescription } from '../dateAggregation';

describe('dateAggregation', () => {
  describe('determineAggregationType', () => {
    it('should return hour for single day', () => {
      const startDate = '2024-01-15T00:00:00Z';
      const endDate = '2024-01-15T23:59:59Z';
      expect(determineAggregationType(startDate, endDate)).toBe('hour');
    });

    it('should return day for multiple days within a month', () => {
      const startDate = '2024-01-15T00:00:00Z';
      const endDate = '2024-01-25T23:59:59Z';
      expect(determineAggregationType(startDate, endDate)).toBe('day');
    });

    it('should return week for longer periods', () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-02-15T23:59:59Z';
      expect(determineAggregationType(startDate, endDate)).toBe('week');
    });

    it('should return month for very long periods', () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-06-01T23:59:59Z';
      expect(determineAggregationType(startDate, endDate)).toBe('month');
    });

    it('should return day for null dates', () => {
      expect(determineAggregationType(null, null)).toBe('day');
    });
  });

  describe('getAggregationDescription', () => {
    it('should return correct descriptions', () => {
      expect(getAggregationDescription('hour')).toBe('Showing calls by hour of day');
      expect(getAggregationDescription('day')).toBe('Showing calls by day');
      expect(getAggregationDescription('week')).toBe('Showing calls by week');
      expect(getAggregationDescription('month')).toBe('Showing calls by month');
    });
  });

  describe('aggregateCallData', () => {
    const mockCallData = [
      { call_start_time: '2024-01-15T10:30:00Z' },
      { call_start_time: '2024-01-15T10:45:00Z' },
      { call_start_time: '2024-01-15T14:20:00Z' },
      { call_start_time: '2024-01-16T09:15:00Z' },
    ];

    it('should aggregate by hour correctly', () => {
      const result = aggregateCallData(mockCallData, 'hour', null, null);
      
      // Should have 24 hours (0-23)
      expect(result).toHaveLength(24);
      
      // Hour 10 should have 2 calls
      const hour10 = result.find(item => item.key === '10');
      expect(hour10?.calls).toBe(2);
      
      // Hour 14 should have 1 call
      const hour14 = result.find(item => item.key === '14');
      expect(hour14?.calls).toBe(1);
      
      // Hour 9 should have 1 call
      const hour9 = result.find(item => item.key === '09');
      expect(hour9?.calls).toBe(1);
    });

    it('should aggregate by day correctly', () => {
      const result = aggregateCallData(mockCallData, 'day', '2024-01-15T00:00:00Z', '2024-01-16T23:59:59Z');
      
      // Should have entries for both days
      expect(result.length).toBeGreaterThanOrEqual(2);
      
      // Jan 15 should have 3 calls
      const jan15 = result.find(item => item.key === '2024-01-15');
      expect(jan15?.calls).toBe(3);
      
      // Jan 16 should have 1 call
      const jan16 = result.find(item => item.key === '2024-01-16');
      expect(jan16?.calls).toBe(1);
    });

    it('should handle empty data', () => {
      const result = aggregateCallData([], 'day', null, null);
      expect(result).toEqual([]);
    });

    it('should handle invalid dates', () => {
      const invalidData = [{ call_start_time: 'invalid-date' }];
      const result = aggregateCallData(invalidData, 'day', null, null);
      expect(result).toEqual([]);
    });
  });
});