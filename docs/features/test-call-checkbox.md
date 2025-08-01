# Test Call Checkbox Feature

## Overview
The Test Call Checkbox feature replaces the previous "Actions" column in the Call Logs Table with a checkbox that allows users to mark calls as test calls or live calls. This feature provides a more intuitive way to manage test calls directly from the call logs interface.

## Implementation Details

### Components
- **TestCallCheckbox**: A reusable component that displays a checkbox to toggle the test status of a call
- **CallLogsTable**: Updated to replace the Actions column with a Test column that uses the TestCallCheckbox component

### Database Integration
- Uses the `is_test_call` boolean field in the calls table
- Updates are made through the `updateCallTestStatus` method in the CallLogsService

### User Experience
- Clicking the checkbox opens a confirmation dialog before changing the call status
- Success or error messages are displayed using toast notifications
- Call rows remain clickable for viewing call details, with a tooltip indicating this functionality

### Security and Permissions
- The component respects the same permission model as the rest of the call logs interface
- Changes to call status are tracked and can be audited if needed

## Usage
1. Navigate to the Call Logs page
2. Locate the "Test" column on the right side of the table
3. Click the checkbox to toggle a call between test and live status
4. Confirm the change in the dialog that appears
5. The change will be reflected immediately in the UI and persisted to the database

## Related Features
- **Global Call Type Filter**: The default filter is now set to "Live Calls" (`'live'`), which filters out test calls by default
- **Call Details**: Click anywhere on a call row (except the checkbox) to view detailed call information

## Technical Notes
- The checkbox state is managed locally and synced with the backend
- Optimistic UI updates are applied before backend confirmation
- Error handling includes fallbacks and user notifications
- The component is designed to be reusable across different call-related interfaces

## Future Enhancements
- Batch operations to mark multiple calls as test/live at once
- Additional filtering options specific to test calls
- Integration with test call analytics and reporting
