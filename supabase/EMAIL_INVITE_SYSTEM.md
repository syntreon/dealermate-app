# Email Invitation System

This document outlines how the user invitation system works in Dealermate, including the email templates, edge functions, and data flow.

## Overview

The invitation system allows administrators to invite new users to join the platform. The system:
1. Sends a branded email with an invitation link
2. Handles user signup and account creation
3. Sets appropriate permissions based on the inviter's role and client association

## Email Templates

### `invite-user.html`
- **Purpose**: Sent when an admin invites a new user
- **Location**: `/supabase/email-templates/invite-user.html`
- **Features**:
  - Clean, responsive design
  - Dynamic organization name based on inviter's client
  - 60-minute expiration notice
  - Direct link to accept invitation
  - Fallback URL for email clients that block buttons

### Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ .SiteURL }}` | Base URL of the application | `https://app.dealermate.ca` |
| `{{ .Token }}` | Unique invitation token | `abc123...` |
| `{{ .Data.inviter_name }}` | Full name of the person who sent the invite | `John Smith` |
| `{{ .Data.organization }}` | Organization name (client name or "Dealermate AI") | `ABC Motors` |

## Edge Function: `invite-user`

### Flow
1. Admin initiates invite from the dashboard
2. Frontend calls the `invite-user` edge function with the invitee's email
3. Edge function:
   - Validates the request
   - Looks up the inviter's client information
   - Sends the invitation email with appropriate organization context
   - Returns success/error response

### Required Environment Variables
```env
APP_URL=https://app.dealermate.ca
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=your-password
SMTP_SENDER=no-reply@dealermate.ca
```

## Client-Specific Invitations

### How It Works
1. When an admin with a `client_id` invites a user:
   - The system includes the client's name in the email
   - The new user is automatically associated with that client

2. When a platform admin (no `client_id`) invites a user:
   - Shows "Dealermate AI" as the organization
   - No automatic client association

## Testing Invitations

### Local Testing
1. Use the Supabase dashboard to send a test invite
2. Check the email logs in the Supabase dashboard

### Production Testing
1. Use the staging environment first
2. Verify:
   - Email rendering in different clients
   - Link functionality
   - Expiration behavior

## Troubleshooting

### Common Issues
1. **Emails not sending**
   - Check Supabase logs for SMTP errors
   - Verify environment variables are set correctly

2. **Links not working**
   - Ensure `APP_URL` is correct
   - Check token generation and validation

3. **Incorrect organization name**
   - Verify the inviter's `client_id` in the database
   - Check client name in the `clients` table

## Maintenance

### Updating Email Templates
1. Make changes in the HTML files
2. Test thoroughly before deploying
3. Consider email client compatibility (use inline styles, test in Litmus/Email on Acid)

### Adding New Template Variables
1. Update the edge function to pass the new variables
2. Document them in this file
3. Update any related tests

## Security Considerations

- Invitation links expire after 60 minutes
- Tokens are single-use
- Rate limiting is enforced by Supabase Auth
- Sensitive data is not included in email templates
