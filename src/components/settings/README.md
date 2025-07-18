# Settings Module

This module implements the user settings functionality for the DealerMate application, allowing users to manage their profile information, notification preferences, and view client settings.

## Components

### 1. UserSettingsForm
Allows users to edit their personal information including:
- Full name
- Phone number
- Email (read-only)

Features:
- Form validation using Zod schema
- Error handling and feedback
- Real-time updates to user profile

### 2. NotificationPreferences
Enables users to configure their notification settings:
- Email notifications toggle
- Lead alerts toggle
- System alerts toggle
- Management of notification recipient emails

### 3. ClientSettings (BusinessSettings)
Provides a read-only view of client-level settings for regular users:
- Client information display
- Subscription plan details
- Client configuration
- Admin message for non-admin users

### 4. SettingsOptions
Contains account-related actions and admin-specific options:
- Account settings buttons
- Admin settings panel access (for admin users only)
- Webhook configuration
- User management

## Database Schema

The user preferences are stored in the `preferences` JSONB column in the `users` table with the following structure:

```json
{
  "notifications": {
    "email": boolean,
    "leadAlerts": boolean,
    "systemAlerts": boolean,
    "notificationEmails": string[]
  },
  "displaySettings": {
    "theme": "light" | "dark" | "system",
    "dashboardLayout": "compact" | "detailed"
  }
}
```

## Example User Preferences JSONB

```json
{
  "notifications": {
    "email": true,
    "leadAlerts": false,
    "systemAlerts": true,
    "notificationEmails": []
  },
  "displaySettings": {
    "theme": "dark",
    "dashboardLayout": "compact"
  },
  "language": "en",
  "timezone": "America/Toronto"
}
```
notificationEmails": ["user@example.com", "manager@example.com"]
## Usage

The settings module is integrated into the main Settings page with a tabbed interface:
1. Profile - Personal information and settings
2. Account - Account management options
3. Notifications - Notification preferences
4. Client - Client-level settings (if applicable)

## Implementation Notes

- All forms include proper validation and error handling
- Changes are saved to the Supabase database
- The user context is updated in real-time when settings are changed
- Admin-specific options are conditionally rendered based on user role
