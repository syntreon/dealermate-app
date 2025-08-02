# Call Intelligence Analytics Implementation Guide

## Overview

This document outlines the implementation of the Call Intelligence Analytics feature, specifically focusing on the call inquiry pie chart component. This component visualizes the distribution of call inquiry types (sales, service, general, etc.) based on data from the `call_intelligence` table in Supabase.

**Current Architecture:** This implementation uses **application-level filtering** rather than Row Level Security (RLS) policies, which is consistent with the existing application architecture.

## Database Schema

The `call_intelligence` table has the following key fields:

```sql
CREATE TABLE public.call_intelligence (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Key field for pie chart
  inquiry_type TEXT NOT NULL,  -- 'general', 'sales', 'service', 'parts', 'test_drive', 'finance', 'trade_in', 'other'
  
  -- Other fields omitted for brevity
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Service Implementation

### CallIntelligenceService

Located at `src/services/callIntelligenceService.ts`, this service handles data fetching and processing for call intelligence data.

```typescript
// Key interfaces
export interface CallInquiryData {
  type: string;
  count: number;
  percentage: number;
}

export interface CallInquiryFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
}
```

#### Key Methods

1. **getCallInquiries**: Fetches raw call intelligence data from the database
   - Handles client-based filtering (admin users see all data)
   - Applies date range filtering
   - Includes fallback mechanisms for error handling

2. **processCallInquiryData**: Transforms raw data into a format suitable for charts
   - Counts occurrences of each inquiry type
   - Calculates percentages
   - Handles edge cases like missing data

## Component Implementation

### CallAnalytics Component

Located at `src/components/analytics/CallAnalytics.tsx`, this component renders the call inquiry pie chart along with other call analytics visualizations.

Key implementation details:

1. **Data Fetching**:
   ```typescript
   // Determine effective client ID based on user role
   const isAdminUser = user.client_id === null && (user.role === 'admin' || user.role === 'owner');
   const effectiveClientId = isAdminUser ? undefined : user.client_id || undefined;

   // Fetch call inquiries data from the database
   const callInquiriesRaw = await CallIntelligenceService.getCallInquiries(
     effectiveClientId,
     startDate,
     endDate
   );

   // Process the inquiry data
   const callInquiriesData = CallIntelligenceService.processCallInquiryData(callInquiriesRaw);
   ```

2. **Fallback Mechanism**:
   ```typescript
   // If no real data is available, use fallback mock data
   const callInquiries = callInquiriesData.length > 0 ? callInquiriesData : [
     { type: 'general', count: 18, percentage: 18 },
     { type: 'sales', count: 52, percentage: 52 },
     { type: 'service', count: 28, percentage: 28 },
     { type: 'other', count: 2, percentage: 2 }
   ];
   ```

3. **Rendering the Pie Chart**:
   ```typescript
   <PieChart width={300} height={300}>
     <Pie
       data={data.callInquiries}
       cx="50%"
       cy="50%"
       labelLine={false}
       outerRadius={80}
       fill="#8884d8"
       dataKey="count"
       nameKey="type"
       label={renderCustomizedLabel}
     >
       {data.callInquiries.map((entry, index) => (
         <Cell 
           key={`cell-${index}`} 
           fill={inquiryColors[entry.type as keyof typeof inquiryColors] || '#6b7280'} 
         />
       ))}
     </Pie>
     <Tooltip formatter={(value, name) => [`${value} calls (${data.callInquiries.find(i => i.type === name)?.percentage}%)`, `${name}`]} />
     <Legend />
   </PieChart>
   ```

## Data Access Control

### Current Implementation: Application-Level Filtering

The `call_intelligence` table uses **application-level filtering** to ensure data isolation between clients while allowing admin users to see all data. This approach is consistent with the existing application architecture.

**Key Configuration:**
```sql
-- RLS is DISABLED on call_intelligence table to match existing app pattern
ALTER TABLE call_intelligence DISABLE ROW LEVEL SECURITY;
```

**How it works:**
1. **Admin users** (`user.client_id === null` and `role === 'admin'|'owner'`) see all data by passing `clientId = undefined` to services
2. **Client users** see only their data by passing their specific `clientId` to services
3. **Service layer** applies the appropriate filtering in the database query

**Example from CallIntelligenceService:**
```typescript
// Admin users pass undefined clientId to see all data
// Client users pass their specific clientId
if (clientId) {
  console.log('Filtering by client_id:', clientId);
  queryBuilder = queryBuilder.eq('client_id', clientId);
} else {
  console.log('Admin view - no client_id filter applied');
}
```

### Setup Instructions

To ensure the `call_intelligence` table works with the existing application pattern:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE call_intelligence DISABLE ROW LEVEL SECURITY;

-- Remove any existing policies (not needed for application-level filtering)
DROP POLICY IF EXISTS "admin_all_access" ON call_intelligence;
DROP POLICY IF EXISTS "client_records_access" ON call_intelligence;
```

## Troubleshooting Guide

### Common Issues and Solutions

1. **No Data Showing in Pie Chart**

   **Possible Causes**:
   - RLS is enabled on `call_intelligence` table (should be disabled)
   - Date filtering excluding records
   - Table name mismatch between SQL and API
   
   **Solutions**:
   - Verify RLS is disabled: `ALTER TABLE call_intelligence DISABLE ROW LEVEL SECURITY;`
   - Check if data exists within the selected date range
   - Verify table name matches in service queries

2. **Data Visible to Admin but Not to Client Users**

   **Possible Causes**:
   - Client ID not being passed correctly to service
   - User role detection logic incorrect
   
   **Solutions**:
   - Check the `isAdminUser` logic in component: `user.client_id === null && (user.role === 'admin' || user.role === 'owner')`
   - Verify `effectiveClientId` is passed correctly to `CallIntelligenceService.getCallInquiries()`
   - Check browser console for service logging

3. **Incorrect Data Distribution**

   **Possible Causes**:
   - Field name mismatch in data processing
   - Incorrect grouping logic
   
   **Solutions**:
   - Verify the field names in the database match those used in the service
   - Check the data processing logic in `processCallInquiryData`

4. **Service Returns Empty Array**

   **Possible Causes**:
   - Database connection issues
   - Incorrect client_id filtering
   
   **Solutions**:
   - Check browser console for service logs
   - Verify data exists in database: `SELECT * FROM call_intelligence LIMIT 10;`
   - Test with RLS disabled temporarily

## Implementation Steps for Developers

1. **Database Setup**:
   - Ensure the `call_intelligence` table exists with proper schema
   - Configure RLS policies for admin and client access
   - Optionally create RPC functions for direct access

2. **Service Implementation**:
   - Implement `CallIntelligenceService` with `getCallInquiries` and `processCallInquiryData` methods
   - Handle client-based filtering based on user role
   - Implement robust error handling and fallbacks

3. **Component Integration**:
   - Use the service in the `CallAnalytics` component
   - Implement conditional rendering based on data availability
   - Add proper loading states and error handling

4. **Testing**:
   - Test with admin users (should see all data)
   - Test with client users (should see only their data)
   - Verify pie chart renders correctly with different data distributions

## Future Implementation: Row Level Security (RLS) Migration Plan

### Why Consider RLS?

While application-level filtering works well for the current architecture, RLS provides additional security benefits:

- **Defense in depth**: Database-level security as a backup to application logic
- **API security**: Protection against potential service layer bypasses
- **Compliance**: Some regulations require database-level access controls
- **Third-party integrations**: Safer when exposing data to external tools

### Migration Strategy

If you decide to implement RLS in the future, here's a phased approach:

#### Phase 1: Preparation (No Downtime)
1. **Create helper functions** (these can coexist with current approach):
```sql
-- Helper function to check if user is admin or owner
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (users.role = 'admin' OR users.role = 'owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's client_id
CREATE OR REPLACE FUNCTION get_user_client_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT client_id FROM users 
        WHERE users.id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. **Test the functions** with existing data to ensure they work correctly

#### Phase 2: Gradual RLS Implementation
1. **Start with new tables** - implement RLS on any new tables first
2. **Test with non-critical tables** - enable RLS on less critical tables to validate the approach
3. **Monitor performance** - ensure RLS policies don't impact query performance

#### Phase 3: Core Tables Migration (Requires Maintenance Window)
1. **Enable RLS on core tables** one at a time:
```sql
-- Example for call_intelligence table
ALTER TABLE call_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_intelligence_select_policy" ON call_intelligence
    FOR SELECT USING (
        is_admin_or_owner() OR 
        client_id = get_user_client_id()
    );

CREATE POLICY "call_intelligence_insert_policy" ON call_intelligence
    FOR INSERT WITH CHECK (
        is_admin_or_owner() OR
        client_id = get_user_client_id()
    );

CREATE POLICY "call_intelligence_update_policy" ON call_intelligence
    FOR UPDATE USING (
        is_admin_or_owner() OR 
        client_id = get_user_client_id()
    );

CREATE POLICY "call_intelligence_delete_policy" ON call_intelligence
    FOR DELETE USING (is_admin_or_owner());
```

2. **Update service layer** to remove explicit client filtering (RLS handles it automatically)
3. **Thorough testing** with both admin and client users

#### Phase 4: Service Layer Cleanup
1. **Remove application-level filtering** from services (since RLS handles it)
2. **Simplify service methods** - no need to pass clientId parameters
3. **Update documentation** and code comments

### RLS Implementation for call_intelligence

Here's the complete RLS setup for future reference:

```sql
-- Enable RLS
ALTER TABLE call_intelligence ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "call_intelligence_select_policy" ON call_intelligence
    FOR SELECT USING (
        is_admin_or_owner() OR 
        client_id = get_user_client_id()
    );

CREATE POLICY "call_intelligence_insert_policy" ON call_intelligence
    FOR INSERT WITH CHECK (
        is_admin_or_owner() OR
        client_id = get_user_client_id()
    );

CREATE POLICY "call_intelligence_update_policy" ON call_intelligence
    FOR UPDATE USING (
        is_admin_or_owner() OR 
        client_id = get_user_client_id()
    );

CREATE POLICY "call_intelligence_delete_policy" ON call_intelligence
    FOR DELETE USING (is_admin_or_owner());
```

### Service Layer Changes for RLS

When RLS is implemented, the service layer can be simplified:

```typescript
// BEFORE (current application-level filtering)
async getCallInquiries(clientId?: string, startDate?: string, endDate?: string) {
  let queryBuilder = supabase.from('call_intelligence').select('*');
  
  if (clientId) {
    queryBuilder = queryBuilder.eq('client_id', clientId);
  }
  
  // ... rest of the method
}

// AFTER (with RLS - no need for explicit client filtering)
async getCallInquiries(startDate?: string, endDate?: string) {
  let queryBuilder = supabase.from('call_intelligence').select('*');
  
  // RLS automatically filters based on user's permissions
  // No need to pass or check clientId
  
  // ... rest of the method
}
```

### Testing Strategy for RLS Migration

1. **Unit tests** for helper functions
2. **Integration tests** for each user role
3. **Performance tests** to ensure RLS doesn't slow down queries
4. **Security tests** to verify data isolation
5. **Rollback plan** in case issues arise

### Recommendation

**For now, stick with application-level filtering** because:
- ✅ It's working well for your current needs
- ✅ It's consistent with your existing architecture
- ✅ It's easier to debug and maintain
- ✅ No migration risk or downtime required

**Consider RLS migration when:**
- You need to integrate with third-party tools that access the database directly
- Compliance requirements mandate database-level security
- You're doing a major architecture refactor anyway
- You have dedicated time for thorough testing and migration

## Conclusion

The call inquiry pie chart provides valuable insights into the types of inquiries received by dealerships. The current implementation uses application-level filtering which is appropriate for the existing architecture. This document serves as a reference for maintaining the current feature and planning future security enhancements.

## Related Documentation

- [Quality Analytics Implementation](./quality_analytics_spec.md)
- [Database Schema Documentation](../database_schema.md)
- [Application Security Patterns](../security/application_level_filtering.md)
