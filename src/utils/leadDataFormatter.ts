/**
 * Utility functions for formatting lead data
 */

/**
 * Format custom lead data JSON as readable notes
 * @param customData The custom lead data as a JSON object or string
 * @returns Formatted string for notes
 */
export function formatCustomLeadData(customData: any): string {
  if (!customData) return '';
  
  try {
    // If customData is a string, try to parse it as JSON
    const data = typeof customData === 'string' ? JSON.parse(customData) : customData;
    
    // Format the data as a readable string
    let formattedData = '--- Custom Lead Data ---\n';
    
    // Process each key in the data
    Object.entries(data).forEach(([key, value]) => {
      // Format key with proper capitalization and replace underscores with spaces
      const formattedKey = key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Format value based on type
      let formattedValue = value;
      if (typeof value === 'object' && value !== null) {
        formattedValue = JSON.stringify(value, null, 2);
      }
      
      formattedData += `${formattedKey}: ${formattedValue}\n`;
    });
    
    return formattedData;
  } catch (error) {
    console.error('Error formatting custom lead data:', error);
    return 'Error formatting custom lead data';
  }
}

/**
 * Combine existing notes with formatted custom lead data
 * @param existingNotes Existing notes string
 * @param customData Custom lead data to format
 * @returns Combined notes string
 */
export function combineNotesWithCustomData(existingNotes: string | undefined, customData: any): string {
  const formattedCustomData = formatCustomLeadData(customData);
  
  if (!formattedCustomData) return existingNotes || '';
  if (!existingNotes) return formattedCustomData;
  
  return `${existingNotes}\n\n${formattedCustomData}`;
}