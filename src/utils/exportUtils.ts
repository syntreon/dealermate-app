/**
 * Utility functions for exporting data
 */

/**
 * Download data as a file
 * @param data The data to download (string or Blob)
 * @param filename The name of the file
 * @param mimeType The MIME type of the file (for string data)
 */
export function downloadFile(data: string | Blob, filename: string, mimeType?: string): void {
  // Create a blob if data is a string
  const blob = typeof data === 'string' 
    ? new Blob([data], { type: mimeType || 'text/plain' }) 
    : data;
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to the document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  URL.revokeObjectURL(url);
}

/**
 * Format a date as YYYY-MM-DD for use in filenames
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDateForFilename(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate a filename for exported data
 * @param prefix The prefix for the filename
 * @param extension The file extension
 * @returns A filename with the current date
 */
export function generateExportFilename(prefix: string, extension: string): string {
  const date = formatDateForFilename();
  return `${prefix}_${date}.${extension}`;
}