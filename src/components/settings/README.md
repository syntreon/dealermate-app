# Settings Module

This module implements the user settings functionality for the DealerMate application, allowing users to manage their profile information, notification preferences, view business settings, and agent configuration.

## Components

### 1. UserSettingsForm
Allows users to view their personal information:
- Full name
- Phone number
- Email (read-only)

Features:
- Read-only display of user info
- Real-time updates if profile changes elsewhere

### 2. NotificationSettings
Enables users to configure their notification preferences:
- Email notifications toggle
- Lead alerts toggle
- System alerts toggle
- Management of notification recipient emails

Features:
- Form validation and error handling
- Preferences saved to the database
- Real-time updates to user context

### 3. BusinessSettings
Displays business/client information:
- Business name
- Address
- Main contact person
- Main contact phone and email

Features:
- All users with client ID can view business settings
- Editing is restricted to admins via the admin panel

### 4. AgentSettings
Shows agent configuration and status:
- Agent status (pulled from top bar)
- Lead capture required fields
- Conversation quality config (persona, speech style, business context, call objectives, identity/personality)

Data Source:
- Pulled from `config_json` JSONB column in the `clients` table:
  ```json
  {
    "lead_capture_config": {
      "required_fields": "name, phone, trade_in, payment plan, vehicle_details"
    },
    "conversation_quality_config": {
      "client_name": "Premier Chevrolet Buick GMC",
      "persona_name": "Jordan",
      "persona_speech_style": "Uses natural, conversational, short sentences, and asks one question at a time. Favors phrases like ''Yeah, for sure!'', ''Totally!'', and ''Right on!''. Avoids formal language like ''Certainly'' or ''May I inquire''.",
      "client_business_context": "Sells new GM vehicles (Chevrolet, Buick, GMC) and used vehicles of any make. Redirects non-GM new vehicle requests to GM options or used inventory.",
      "primary_call_objectives": "Welcome callers enthusiastically, answer questions about vehicles/services, capture lead information (name, phone, callback timing, trade-in, purchase method), and make callers feel good about calling.",
      "persona_identity_and_personality": "Jordan is a 28-year-old female with a Canadian accent. She is optimistic, warm, approachable, genuinely enthusiastic, patient, and curious about caller needs."
    }
  }
  ```

## Usage

The settings module is integrated into the main Settings page with a tabbed interface:
1. User - Personal information (read-only)
2. Notifications - Notification preferences
3. Business - Business/client information (viewable for all users, editable by admins via admin panel)
4. Agent - Agent status and configuration (from client config JSONB)

## Implementation Notes

- All forms include proper validation and error handling where applicable
- Changes are saved to the Supabase database
- The user context is updated in real-time when settings are changed
- Admin-specific editing is handled via the admin panel, not the main settings page
