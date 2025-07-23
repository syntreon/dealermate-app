# Make.com Operations Integration

This document explains how to integrate Make.com operations tracking with your admin dashboard.

## Overview

The Make.com operations integration allows you to:
- Track daily operations usage per scenario and operation type
- Monitor costs and success rates for client and company operations
- View operations trends and performance metrics across different operation types
- Set up alerts for operation limits or failures
- Separate tracking for call-related vs non-call operations
- Company-wide operations tracking (admin, marketing, notifications, etc.)

## Database Schema

The integration uses a dedicated `make_operations` table with the following structure:

```sql
create table public.make_operations (
  id uuid primary key,
  client_id uuid references clients(id), -- NULL for company operations
  call_id uuid references calls(id), -- NULL for non-call operations
  scenario_name text not null,
  scenario_id text, -- Make.com scenario ID
  operation_type text not null, -- 'call', 'admin', 'marketing', 'notification', 'evaluation', 'general'
  date date not null,
  operations_count integer default 0,
  operations_limit integer, -- Optional daily limit
  cost_usd decimal(10,4) default 0,
  success_count integer default 0,
  error_count integer default 0,
  status text default 'active',
  description text, -- Optional description of scenario purpose
  last_sync_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## Operation Types

- **call**: Operations directly related to call processing (VAPI webhooks, call evaluation, lead processing)
- **admin**: Administrative operations (user management, system maintenance, reporting)
- **marketing**: Marketing automation (email campaigns, lead nurturing, social media)
- **notification**: Notification systems (alerts, reminders, status updates)
- **evaluation**: Call evaluation and analysis operations
- **general**: General purpose operations that don't fit other categories

## Make.com Setup

### 1. Daily Operations Sync Scenario

Create a Make.com scenario that runs daily (recommended: early morning) to collect operations data from the previous day:

1. **Trigger**: Schedule (daily at 6:00 AM)
2. **Get Operations Data**: Use Make.com API to fetch operations for each scenario
3. **Process Data**: Calculate totals, success/error counts, and costs
4. **Sync to Database**: Send data to your application

### 2. Data Collection Module

In your Make.com scenario, use the following structure to collect operations data:

```javascript
// Example Make.com module to collect operations data
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const dateStr = yesterday.toISOString().split('T')[0];

// Get operations for each scenario
const operationsData = scenarios.map(scenario => ({
  client_id: scenario.client_id, // Map from your client data
  scenario_name: scenario.name,
  scenario_id: scenario.id,
  date: dateStr,
  operations_count: scenario.operations_used,
  operations_limit: scenario.operations_limit,
  cost_usd: scenario.cost_usd,
  success_count: scenario.successful_executions,
  error_count: scenario.failed_executions,
  status: scenario.is_active ? 'active' : 'paused'
}));
```

### 3. Webhook Integration

You can also set up real-time updates using webhooks:

1. **Scenario Execution Webhook**: Trigger on each scenario execution
2. **Aggregate Data**: Collect executions throughout the day
3. **Daily Summary**: Send aggregated data at end of day

## Application Integration

### 1. Sync Function

Use the provided sync utility in your application:

```typescript
import { syncMakeOperationsData } from '@/utils/makeOperationsSync';

// Example data from Make.com
const operationsData = [
  {
    client_id: "uuid-here",
    scenario_name: "Lead Processing",
    scenario_id: "12345",
    date: "2025-01-22",
    operations_count: 150,
    operations_limit: 1000,
    cost_usd: 7.50,
    success_count: 145,
    error_count: 5,
    status: "active"
  }
];

const result = await syncMakeOperationsData(operationsData);
console.log(result); // { success: true, message: "...", synced_count: 1 }
```

### 2. Client ID Mapping

If your Make.com scenarios only have client slugs, use the helper function:

```typescript
import { getClientIdBySlug } from '@/utils/makeOperationsSync';

const clientId = await getClientIdBySlug('client-slug');
```

### 3. Webhook Processing

For real-time webhook data:

```typescript
import { calculateOperationsFromWebhook } from '@/utils/makeOperationsSync';

const webhookData = {
  scenario_id: "12345",
  scenario_name: "Lead Processing",
  executions: [
    {
      status: 'success',
      operations_consumed: 5,
      cost_usd: 0.25,
      timestamp: '2025-01-22T10:30:00Z'
    }
  ]
};

const operationsData = calculateOperationsFromWebhook(webhookData);
```

## Dashboard Features

The OperationsTab component provides:

### 1. Metrics Overview
- Total operations count
- Total cost in USD
- Success rate percentage
- Daily average operations

### 2. Scenario Performance
- Individual scenario metrics
- Status indicators (active, paused, error, disabled)
- Success rates and cost breakdown
- Daily averages per scenario

### 3. Date Range Filtering
- Last 24 hours
- Last 7 days
- Last 30 days
- Last 90 days

## API Endpoints

### Sync Operations Data
```
POST /api/make-operations/sync
Content-Type: application/json

{
  "operations": [
    {
      "client_id": "uuid",
      "scenario_name": "Lead Processing",
      "date": "2025-01-22",
      "operations_count": 150,
      "cost_usd": 7.50,
      "success_count": 145,
      "error_count": 5,
      "status": "active"
    }
  ]
}
```

### Get Operations Metrics
```
GET /api/make-operations/metrics?client_id=uuid&start_date=2025-01-15&end_date=2025-01-22
```

## Security Considerations

1. **Authentication**: Ensure Make.com requests are authenticated
2. **Rate Limiting**: Implement rate limiting for sync endpoints
3. **Data Validation**: Validate all incoming operations data
4. **RLS Policies**: Database policies ensure users only see their client's data

## Monitoring and Alerts

Consider setting up alerts for:
- High error rates (>10% failures)
- Operations approaching limits (>80% of daily limit)
- Scenarios in error status
- Unusual cost spikes
- Missing daily sync data

## Troubleshooting

### Common Issues

1. **Missing Client ID**: Ensure client_id is correctly mapped from Make.com
2. **Date Format**: Use YYYY-MM-DD format for dates
3. **Negative Values**: Ensure all counts and costs are non-negative
4. **Sync Failures**: Check database connectivity and RLS policies

### Debug Mode

Enable debug logging in Make.com scenarios to track data flow and identify issues.

## Future Enhancements

Potential improvements:
- Real-time operations monitoring
- Predictive cost analysis
- Automated scenario optimization suggestions
- Integration with billing systems
- Custom alert thresholds per client