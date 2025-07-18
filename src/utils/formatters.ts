/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (USD, CAD, etc.)
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a number as a percentage
 * @param value - The value to format as percentage
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

/**
 * Format a date with options
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale: string = 'en-US'
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Format a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2m 30s" or "1h 15m 30s")
 */
export const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '0s';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes}m`);
  }
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(' ');
};

/**
 * Format a number with thousands separators
 * @param value - The number to format
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale).format(value);
};

/**
 * Truncate a string to a maximum length and add ellipsis if needed
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (!str || str.length <= maxLength) {
    return str;
  }
  return `${str.substring(0, maxLength)}...`;
};