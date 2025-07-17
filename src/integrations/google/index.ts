/**
 * Google Sheets API integration
 * This file exports functions for interacting with Google Sheets API
 */
import { google } from 'googleapis';

// Define interfaces for our data models
export interface CallLog {
  id: number;
  callerName: string;
  phoneNumber: string;
  callDate: string;
  callDuration: string;
  notes: string;
}

/**
 * Initialize Google Sheets API client with credentials
 * @returns Google Sheets API client
 */
const initGoogleSheetsClient = async () => {
  try {
    // For client-side applications, we need to use API key authentication
    // or implement a server-side proxy for OAuth2 authentication
    const sheets = google.sheets({ 
      version: 'v4',
      auth: import.meta.env.VITE_GOOGLE_API_KEY
    });
    
    return sheets;
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    throw new Error('Failed to initialize Google Sheets client');
  }
};

/**
 * Fetch call logs from Google Sheets
 * @returns Array of call logs
 */
export const fetchCallLogs = async (): Promise<CallLog[]> => {
  try {
    const sheets = await initGoogleSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: import.meta.env.VITE_GOOGLE_SHEET_ID,
      range: 'CallLogs!A2:F', // Adjust sheet name and range as needed (A1 is header)
    });

    if (!response.data.values || response.data.values.length === 0) {
      return [];
    }

    // Map the rows to our CallLog interface
    const logs: CallLog[] = response.data.values.map((row, index) => ({
      id: index + 1, // Assuming rows are sequential
      callerName: row[0] || '',
      phoneNumber: row[1] || '',
      callDate: row[2] || '',
      callDuration: row[3] || '',
      notes: row[4] || '',
    }));

    return logs;
  } catch (error) {
    console.error('Error fetching call logs from Google Sheets:', error);
    throw new Error('Failed to fetch call logs');
  }
};
