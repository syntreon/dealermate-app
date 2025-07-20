# Call Details Popup Height Consistency Implementation Plan

## Task List

- [ ] 1. Update dialog container structure for fixed height
  - Modify DialogContent to use fixed height instead of max-height
  - Implement flexbox layout for proper content distribution
  - Set consistent height across all screen sizes
  - _Requirements: 1.1, 1.2, 3.1_

- [ ] 2. Restructure tab content areas with proper scrolling
  - Wrap each TabsContent in a ScrollArea component
  - Set fixed height for content areas
  - Ensure independent scrolling for each tab
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3. Update Details tab layout for fixed height
  - Ensure card layout works within allocated space
  - Maintain responsive grid behavior
  - Test content overflow scenarios
  - _Requirements: 1.4, 3.2_

- [ ] 4. Fix Recording tab spacing and layout
  - Center audio controls within fixed height
  - Add proper spacing to prevent cramped appearance
  - Maintain consistent visual balance
  - _Requirements: 3.4, 4.2_

- [ ] 5. Update Transcript tab with proper scrolling
  - Implement fixed-height scrollable text area
  - Maintain copy/download button accessibility
  - Ensure smooth scrolling for long content
  - _Requirements: 2.1, 2.4_

- [ ] 6. Fix Evaluation tab grid layout and scrolling
  - Ensure score cards grid works within fixed height
  - Implement smooth scrolling for multiple cards
  - Maintain card layout integrity during scroll
  - _Requirements: 2.4, 4.1_

- [ ] 7. Update loading and empty states
  - Ensure skeleton loaders fit within fixed height
  - Center empty state messages properly
  - Maintain consistent spacing for all states
  - _Requirements: 4.3, 4.4_

- [ ] 8. Implement responsive height adjustments
  - Add responsive height classes for different screen sizes
  - Test mobile and tablet layouts
  - Ensure proper spacing on all devices
  - _Requirements: 3.2, 3.3_

- [ ] 9. Add smooth transitions and polish
  - Implement smooth tab switching without layout shifts
  - Add proper focus management for scrollable areas
  - Test keyboard navigation within fixed height
  - _Requirements: 4.1, 4.2_

- [ ] 10. Test and validate height consistency
  - Verify height remains constant across all tabs
  - Test with various content lengths
  - Validate responsive behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4_