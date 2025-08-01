# Call Mode Filter Developer Guide

## Overview
This guide explains how to implement and use the call mode filter ('all', 'live', 'test') in analytics services and components.

## Implementation Pattern

### 1. Service Function Signature
Add the callType parameter to your service function:

```typescript
async function getAnalyticsData(
  startDate: string,
  endDate: string,
  clientId?: string,
  callType: 'all' | 'live' | 'test' = 'live'  // Add this parameter
): Promise<AnalyticsData> {
  // Implementation
}
```

### 2. Database Query Integration
Use the callType parameter to filter database queries:

```typescript
let query = supabase
  .from('calls')
  .select('*')
  .gte('created_at', startDate)
  .lte('created_at', endDate);

// Apply client filtering
if (clientId) {
  query = query.eq('client_id', clientId);
}

// Apply call type filtering
if (callType === 'live') {
  query = query.eq('is_test_call', false);
} else if (callType === 'test') {
  query = query.eq('is_test_call', true);
}
// For 'all', no additional filtering is needed

const { data, error } = await query;
```

### 3. Default Values
- Use 'live' as the default value for most analytics services
- Use 'all' when you want to show all calls by default
- Be consistent with existing services

## Best Practices

### 1. Type Safety
Always use the explicit type `'all' | 'live' | 'test'` rather than string.

### 2. Database Field
Always filter using the `is_test_call` boolean field:
- `is_test_call = false` for live calls
- `is_test_call = true` for test calls
- No filter for 'all' calls

### 3. Consistency
- Follow the same parameter naming convention: `callType`
- Use the same default value as similar services
- Maintain the same order of parameters

## Example Implementation

Here's a complete example of implementing call mode filter in a service:

```typescript
export interface CallAnalyticsData {
  totalCalls: number;
  // ... other properties
}

export async function getCallAnalyticsData(
  startDate: string,
  endDate: string,
  clientId?: string,
  callType: 'all' | 'live' | 'test' = 'live'
): Promise<CallAnalyticsData> {
  try {
    let query = supabase
      .from('calls')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Apply call type filtering
    if (callType === 'live') {
      query = query.eq('is_test_call', false);
    } else if (callType === 'test') {
      query = query.eq('is_test_call', true);
    }

    const { data: calls, error } = await query;

    if (error) {
      console.error('Error fetching calls data:', error);
      throw error;
    }

    // Process data and return results
    return {
      totalCalls: calls?.length || 0,
      // ... other processed data
    };
  } catch (error) {
    console.error('Error in getCallAnalyticsData:', error);
    throw error;
  }
}
```

## Component Integration

When integrating in components, make sure to:

1. Add callType state:
```typescript
const [callType, setCallType] = useState<'all' | 'live' | 'test'>('live');
```

2. Pass the callType to service calls:
```typescript
const analyticsData = await getCallAnalyticsData(
  startDate,
  endDate,
  clientId,
  callType  // Pass the callType
);
```

3. Add UI controls for call mode selection

## Testing

Test all three modes:
- 'all': Should return both live and test calls
- 'live': Should return only calls where `is_test_call = false`
- 'test': Should return only calls where `is_test_call = true`
