# Call Details Popup Height Consistency Requirements

## Introduction

The Call Details Popup currently has inconsistent height behavior across different tabs, causing the dialog to resize when switching between tabs. This creates a poor user experience with jarring layout shifts.

## Requirements

### Requirement 1: Consistent Dialog Height

**User Story:** As a user viewing call details, I want the popup dialog to maintain a consistent size when switching between tabs, so that the interface feels stable and professional.

#### Acceptance Criteria

1. WHEN the call details popup is opened THEN the dialog SHALL maintain a fixed height regardless of content
2. WHEN switching between tabs (Details, Recording, Transcript, Evaluation) THEN the dialog height SHALL NOT change
3. WHEN content exceeds the available space THEN individual tab content areas SHALL scroll independently
4. WHEN the dialog is opened THEN it SHALL use a consistent height that accommodates the largest content (Evaluation tab)

### Requirement 2: Proper Content Scrolling

**User Story:** As a user viewing lengthy content in any tab, I want to be able to scroll within the tab content area without affecting the overall dialog size.

#### Acceptance Criteria

1. WHEN content in any tab exceeds the available height THEN the content area SHALL scroll vertically
2. WHEN scrolling within a tab THEN the dialog header and tab navigation SHALL remain fixed
3. WHEN switching tabs THEN the scroll position SHALL reset to the top of the new tab content
4. WHEN viewing the evaluation tab with many score cards THEN the content SHALL scroll smoothly within the allocated space

### Requirement 3: Responsive Behavior

**User Story:** As a user on different screen sizes, I want the call details popup to maintain appropriate proportions while keeping consistent height behavior.

#### Acceptance Criteria

1. WHEN viewing on desktop THEN the dialog SHALL use a fixed height that works well for all tabs
2. WHEN viewing on mobile/tablet THEN the dialog SHALL adapt appropriately while maintaining height consistency
3. WHEN the viewport is small THEN the dialog SHALL not exceed reasonable screen real estate
4. WHEN content is minimal (like recording tab) THEN empty space SHALL be maintained to keep consistent height

### Requirement 4: Visual Polish

**User Story:** As a user, I want the call details popup to feel polished and professional with smooth transitions and proper spacing.

#### Acceptance Criteria

1. WHEN switching between tabs THEN transitions SHALL be smooth without layout shifts
2. WHEN content is shorter than available space THEN proper spacing SHALL be maintained
3. WHEN loading states are shown THEN they SHALL fit within the consistent height framework
4. WHEN error states are displayed THEN they SHALL maintain the same height consistency