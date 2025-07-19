/**
 * Theme utility functions to help with theme system implementation
 * These functions help identify and replace hardcoded colors with theme variables
 */

/**
 * Maps hardcoded Tailwind color classes to their theme-aware equivalents
 * Use this as a reference when refactoring components
 */
export const colorMappings = {
  // Background colors
  'bg-white': 'bg-background',
  'bg-black': 'bg-background dark:text-foreground',
  'bg-gray-50': 'bg-muted/50',
  'bg-gray-100': 'bg-muted',
  'bg-gray-200': 'bg-muted',
  'bg-zinc-50': 'bg-muted/50',
  'bg-zinc-100': 'bg-muted',
  'bg-zinc-200': 'bg-muted',
  'bg-zinc-800': 'bg-card dark:bg-muted',
  'bg-zinc-900': 'bg-card dark:bg-background',
  'bg-zinc-950': 'bg-background',
  
  // Text colors
  'text-white': 'text-foreground dark:text-foreground',
  'text-black': 'text-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-700': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-900': 'text-foreground',
  'text-zinc-500': 'text-muted-foreground',
  'text-zinc-600': 'text-muted-foreground',
  'text-zinc-700': 'text-foreground',
  'text-zinc-800': 'text-foreground',
  'text-zinc-900': 'text-foreground',
  
  // Border colors
  'border-gray-100': 'border-border/50',
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-zinc-100': 'border-border/50',
  'border-zinc-200': 'border-border',
  'border-zinc-300': 'border-border',
  'border-zinc-700': 'border-border',
  'border-zinc-800': 'border-border',
  
  // Ring colors
  'ring-gray-200': 'ring-border',
  'ring-zinc-200': 'ring-border',
};

/**
 * Identifies common hardcoded color patterns in a component
 * @param componentCode - The component code to analyze
 * @returns Array of identified hardcoded colors
 */
export const identifyHardcodedColors = (componentCode: string): string[] => {
  const hardcodedColors: string[] = [];
  const patterns = Object.keys(colorMappings);
  
  patterns.forEach(pattern => {
    if (componentCode.includes(pattern)) {
      hardcodedColors.push(pattern);
    }
  });
  
  return hardcodedColors;
};

/**
 * Suggests theme-aware replacements for hardcoded colors
 * @param hardcodedColors - Array of hardcoded colors to replace
 * @returns Object mapping hardcoded colors to theme-aware alternatives
 */
export const suggestReplacements = (hardcodedColors: string[]): Record<string, string> => {
  const suggestions: Record<string, string> = {};
  
  hardcodedColors.forEach(color => {
    if (colorMappings[color as keyof typeof colorMappings]) {
      suggestions[color] = colorMappings[color as keyof typeof colorMappings];
    }
  });
  
  return suggestions;
};
