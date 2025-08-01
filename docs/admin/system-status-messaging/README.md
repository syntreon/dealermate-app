# Services Documentation

This directory contains all the service classes for the Dealermate application. Each service is responsible for a specific domain of functionality.

## SystemStatusService

The `SystemStatusService` manages system messages and agent statuses within the application.

### Key Responsibilities

1. **Agent Status Management**
   - Updating and retrieving agent statuses
   - Ensuring proper user authentication for all updates
   - Handling both platform-wide and client-specific statuses

2. **System Messages**
   - Creating, reading, updating, and deleting system messages
   - Pagination and caching for improved performance
   - Enhanced message data with publisher and client information

3. **System Monitoring**
   - Health checks for critical system components
   - Automatic status updates based on system health
   - Periodic monitoring with configurable intervals

### Files

- `systemStatusService.ts` - Main service implementation
- `SystemStatusService.DeveloperGuide.md` - Comprehensive developer documentation
- `SystemStatusService.Troubleshooting.md` - Common issues and solutions

### Usage

```typescript
import { SystemStatusService } from '@/services/systemStatusService';

// Update agent status
await SystemStatusService.updateAgentStatus({
  status: 'active',
  message: 'All systems operational'
});

// Get system messages with pagination
const messages = await SystemStatusService.getSystemMessagesPaginated(1, 10);

// Start system monitoring
SystemStatusService.startMonitoring();
```

### Key Features

- **User Authentication**: All updates require proper user authentication
- **Retry Mechanism**: Automatic retry for temporary authentication failures
- **Caching**: In-memory caching for system messages with TTL
- **Monitoring**: Automatic health checks and status updates
- **Error Handling**: Comprehensive error handling and propagation

### Related Components

- `AgentStatusSettings.tsx` - Admin interface for managing agent statuses
- `SystemMessagesTable.tsx` - Display of system messages
- `useSystemMessages.ts` - Hook for system message management

For detailed implementation information, see the [Developer Guide](./SystemStatusService.DeveloperGuide.md).
For troubleshooting common issues, see the [Troubleshooting Guide](./SystemStatusService.Troubleshooting.md).
