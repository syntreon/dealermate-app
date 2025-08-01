# Call Mode Filter Debug Cheatsheet

## Common Issues and Solutions

### 1. Filter Not Working

**Symptom**: All call modes return the same data

**Checklist**:
- [ ] Verify the `callType` parameter is being passed to the service function
- [ ] Check that the database query includes the `is_test_call` filter logic
- [ ] Confirm the `is_test_call` field exists in the database table
- [ ] Verify the database query is being executed (not just built)

**Debug Code**:
```typescript
// Add logging to verify parameter values
console.log('callType parameter:', callType);

// Add logging to verify query conditions
if (callType === 'live') {
  console.log('Filtering for live calls (is_test_call = false)');
  query = query.eq('is_test_call', false);
} else if (callType === 'test') {
  console.log('Filtering for test calls (is_test_call = true)');
  query = query.eq('is_test_call', true);
}
```

### 2. Incorrect Data Returned

**Symptom**: Filter returns wrong set of calls

**Checklist**:
- [ ] Verify the boolean logic is correct (`false` for live, `true` for test)
- [ ] Check that database records have correct `is_test_call` values
- [ ] Confirm date filtering is not interfering with call type filtering

**Debug Query**:
```sql
-- Check actual database values
SELECT id, is_test_call, created_at 
FROM calls 
WHERE created_at >= '2023-01-01' 
AND created_at <= '2023-12-31'
ORDER BY created_at;
```

### 3. Performance Issues

**Symptom**: Slow response when filtering calls

**Checklist**:
- [ ] Verify there's an index on `is_test_call` column
- [ ] Check if combining filters affects query plan
- [ ] Confirm query is not doing unnecessary joins

**Optimization**:
```sql
-- Add index if missing
CREATE INDEX IF NOT EXISTS idx_calls_is_test_call ON calls(is_test_call);
```

## Testing Commands

### Database Verification

```sql
-- Check distribution of call types
SELECT 
  is_test_call,
  COUNT(*) as count
FROM calls 
GROUP BY is_test_call;

-- Check recent test calls
SELECT id, created_at, is_test_call
FROM calls 
WHERE is_test_call = true 
ORDER BY created_at DESC 
LIMIT 5;

-- Check recent live calls
SELECT id, created_at, is_test_call
FROM calls 
WHERE is_test_call = false 
ORDER BY created_at DESC 
LIMIT 5;
```

### Service Testing

```typescript
// Test all modes
const allCalls = await getAnalyticsData(startDate, endDate, clientId, 'all');
const liveCalls = await getAnalyticsData(startDate, endDate, clientId, 'live');
const testCalls = await getAnalyticsData(startDate, endDate, clientId, 'test');

console.log('All calls count:', allCalls.total);
console.log('Live calls count:', liveCalls.total);
console.log('Test calls count:', testCalls.total);

// Verify: allCalls.total should equal liveCalls.total + testCalls.total
```

## Component Debugging

### State Management

```typescript
// Add debugging for state changes
useEffect(() => {
  console.log('Call type changed to:', callType);
  fetchData();
}, [callType]);

// Verify props are passed correctly
<AnalyticsComponent 
  callType={callType}
  onCallTypeChange={setCallType}
/>
```

### UI Verification

1. Check that UI controls correctly set state values
2. Verify that the correct value is passed to service functions
3. Confirm that UI updates when data changes

## Error Handling

### Common Error Messages

1. **"column is_test_call does not exist"**
   - Solution: Verify the column exists in the database

2. **"invalid input syntax for type boolean"**
   - Solution: Check that you're passing boolean values, not strings

3. **Filter has no effect**
   - Solution: Verify the query is being executed, not just built

### Error Logging

```typescript
try {
  // Service call
  const data = await getAnalyticsData(startDate, endDate, clientId, callType);
  console.log(`Successfully fetched ${data.total} calls for mode: ${callType}`);
  return data;
} catch (error) {
  console.error(`Error fetching data for callType ${callType}:`, error);
  throw error;
}
```

## Validation Checklist

Before deploying call mode filter changes:

- [ ] All three modes ('all', 'live', 'test') return data
- [ ] 'all' mode returns sum of 'live' and 'test' modes
- [ ] No console errors related to filtering
- [ ] Performance is acceptable (under 5 seconds for typical queries)
- [ ] UI controls work correctly
- [ ] Default values are appropriate
- [ ] Error handling is implemented
- [ ] Type safety is maintained
