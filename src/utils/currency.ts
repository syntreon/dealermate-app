/**
 * Currency utility functions
 * Provides consistent currency conversion throughout the application
 */

/**
 * Fixed USD to CAD exchange rate
 * This is used throughout the application for consistent currency conversion
 */
export const USD_TO_CAD_RATE = 1.35;

/**
 * Convert USD amount to CAD
 * @param amountUsd Amount in USD
 * @returns Amount in CAD
 */
export function convertUsdToCad(amountUsd: number | null | undefined): number {
  if (amountUsd === null || amountUsd === undefined) return 0;
  return amountUsd * USD_TO_CAD_RATE;
}

/**
 * Format currency value with appropriate symbol and decimals
 * @param amount Amount to format
 * @param currency Currency code (USD or CAD)
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | null | undefined, 
  currency: 'USD' | 'CAD' = 'USD', 
  decimals: number = 2
): string {
  if (amount === null || amount === undefined) return `$0.00 ${currency}`;
  
  return `$${amount.toFixed(decimals)} ${currency}`;
}
