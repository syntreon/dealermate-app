
import { isNetworkError } from "./authUtils";

/**
 * Implements exponential backoff delay
 * @param ms Time to delay in milliseconds
 * @returns Promise that resolves after the specified delay
 */
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculates backoff time for retries
 * @param retryAttempt Current retry attempt number
 * @returns Time to wait in milliseconds
 */
export const calculateBackoffTime = (retryAttempt: number): number => 
  Math.min(1000 * Math.pow(2, retryAttempt), 5000);

/**
 * Creates a promise that rejects after specified timeout
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise that rejects with timeout error
 */
export const createTimeoutPromise = (timeoutMs: number = 7000): Promise<never> => 
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Network request timed out")), timeoutMs)
  );

/**
 * Creates a fallback user object for network errors
 * @returns Minimal user object
 */
export const createFallbackUserObject = () => ({
  id: "temp-user-id", // Add the required id property
  name: "Temporary User",
  email: "user@example.com",
  phone: "",
});

/**
 * Handles API request errors and implements retry logic
 * @param error The error that occurred
 * @param retryAttempt Current retry attempt number
 * @param retryFn Function to retry
 * @returns Result of retry or fallback object
 */
export const handleRequestError = async <T>(
  error: unknown, 
  retryAttempt: number, 
  retryFn: (attempt: number) => Promise<T>,
  fallbackFn?: () => T
): Promise<T | null> => {
  // Check if it's a network error
  if (isNetworkError(error)) {
    // Only retry a limited number of times with exponential backoff
    if (retryAttempt < 2) {
      const backoffTime = calculateBackoffTime(retryAttempt);
      await delay(backoffTime);
      return retryFn(retryAttempt + 1);
    }
    
    // For network errors, return fallback if provided
    if (fallbackFn) {
      console.log("Network error detected, returning fallback object");
      return fallbackFn();
    }
  }
  
  return null;
};

/**
 * Validates if the provided URL is a valid webhook URL
 * @param url The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export const isValidWebhookUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
  } catch {
    return false;
  }
};
