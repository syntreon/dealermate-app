# SystemStatusService Troubleshooting Guide

## Common Issues and Solutions

### 1. 400 Bad Request Errors When Updating Agent Status

**Symptom**: Error message "null value in column 'updated_by' of relation 'agent_status' violates not-null constraint"

**Cause**: The `updated_by` field is required by the database but was not being populated properly.

**Solution**:
- Ensure the user is properly authenticated before calling `updateAgentStatus`
- Verify that the `updateAgentStatus` method is receiving a valid user ID
- Check that the AuthContext is properly providing user information

**Debugging Steps**:
1. Verify the user is logged in by checking `useAuth()` hook in the component
2. Confirm the user object has a valid `id` property
3. Check that the user ID is being passed to the service method
4. Add console logs to verify the user ID value in the service method

### 2. Method Not Found Errors

**Symptom**: Error message "Property 'updateAgentStatus' does not exist on type 'typeof SystemStatusService'"

**Cause**: The `updateAgentStatus` method is missing from the SystemStatusService class.

**Solution**:
- Verify that the method exists in `src/services/systemStatusService.ts`
- Check for syntax errors that might prevent the method from being properly defined
- Ensure the file was saved correctly after modifications

### 3. Authentication Required Errors

**Symptom**: Error message "User authentication required"

**Cause**: The service method was called without a valid user ID and the retry mechanism failed to obtain one.

**Solution**:
- Ensure the user is properly logged in before calling the method
- Verify that the Supabase authentication is working correctly
- Check network connectivity to the authentication service

**Debugging Steps**:
1. Verify user authentication status in the component
2. Check browser console for authentication errors
3. Confirm Supabase client is properly configured
4. Test authentication flow in isolation

### 4. Database Constraint Violations

**Symptom**: Error messages related to database constraints

**Cause**: Data being inserted/updated violates database constraints

**Solution**:
- Ensure all required fields are populated
- Verify data types match database schema
- Check for unique constraint violations

**Common Constraint Issues**:
- `updated_by` field must not be null
- `client_id` uniqueness constraint on agent_status table
- Proper timestamp formatting

### 5. Monitoring Issues

**Symptom**: System health checks not running or reporting incorrectly

**Cause**: Monitoring interval not properly configured or health check methods have errors

**Solution**:
- Verify `checkInterval` property exists and is properly typed
- Check that `startMonitoring()` is being called
- Ensure health check methods are properly implemented
- Verify network connectivity for external service checks

## Debugging Techniques

### Adding Console Logs
```typescript
static async updateAgentStatus(
  status: Omit<AgentStatus, 'lastUpdated'>, 
  clientId?: string | null,
  updatedBy?: string
): Promise<AgentStatus> {
  console.log('updateAgentStatus called with:', { status, clientId, updatedBy });
  
  // Try to get user ID with retries if not provided
  let userId = updatedBy;
  console.log('Initial userId:', userId);
  
  if (!userId) {
    // Retry mechanism for getting user ID
    for (let i = 0; i < 3; i++) {
      userId = await getCurrentUserId();
      console.log(`Attempt ${i + 1}: userId =`, userId);
      if (userId) break;
      // Wait 100ms before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  if (!userId) {
    console.error('User authentication required - no userId found');
    throw new Error('User authentication required');
  }
  
  // Rest of method...
}
```

### Testing Authentication
```typescript
// In a component
useEffect(() => {
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    if (user) {
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
    }
  };
  
  checkAuth();
}, []);
```

## Performance Considerations

### Caching
- The `getSystemMessagesPaginated` method uses in-memory caching with a 5-minute TTL
- Cache is automatically cleared when messages are created, updated, or deleted
- Force refresh parameter can bypass cache when immediate updates are needed

### Retry Mechanism
- User ID retrieval includes a retry mechanism with exponential backoff
- Prevents failures due to temporary authentication delays
- Limits retry attempts to prevent infinite loops

## Monitoring and Logging

### Health Checks
- Database connection verification
- API endpoint availability checks
- External service status monitoring
- Automatic agent status updates based on health check results

### Error Logging
- Database errors are logged to console
- Authentication failures are logged
- Health check failures are logged
- All errors are propagated to calling functions for handling

## Testing Checklist

Before deploying changes to SystemStatusService:

- [ ] Verify all methods are properly defined and exported
- [ ] Test user authentication flow with valid and invalid users
- [ ] Test agent status updates with and without client IDs
- [ ] Verify error handling for database constraint violations
- [ ] Test caching behavior for system messages
- [ ] Verify monitoring functions start and stop correctly
- [ ] Test health check functionality
- [ ] Confirm proper error propagation to UI components
