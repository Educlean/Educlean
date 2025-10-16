/**
 * Timezone utility functions for Vancouver (Pacific Time)
 * Handles both PST (UTC-8) and PDT (UTC-7) automatically
 */

const VANCOUVER_TIMEZONE = 'UTC';

/**
 * Get the current date in Vancouver timezone as YYYY-MM-DD string
 * @returns {string} Date string in YYYY-MM-DD format for Vancouver timezone
 */
export function getVancouverDateString(): string {
  const now = new Date();
  const vancouverDate = new Date(now.toLocaleString("en-US", { timeZone: VANCOUVER_TIMEZONE }));
  
  const year = vancouverDate.getFullYear();
  const month = String(vancouverDate.getMonth() + 1).padStart(2, '0');
  const day = String(vancouverDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get the current date and time in Vancouver timezone
 * @returns {Date} Date object representing current time in Vancouver
 */
export function getVancouverDate(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: VANCOUVER_TIMEZONE }));
}

/**
 * Convert a date string to Vancouver timezone date
 * @param {string} dateString - Date string in any format
 * @returns {Date} Date object in Vancouver timezone
 */
export function toVancouverDate(dateString: string): Date {
  const date = new Date(dateString);
  return new Date(date.toLocaleString("en-US", { timeZone: VANCOUVER_TIMEZONE }));
}

/**
 * Get start and end of day in Vancouver timezone
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {object} Object with startOfDay and endOfDay Date objects
 */
export function getVancouverDayBounds(dateString: string): { startOfDay: Date, endOfDay: Date } {
  // Create date in Vancouver timezone
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create start of day (00:00:00) in Vancouver timezone
  const startOfDay = new Date();
  startOfDay.setFullYear(year, month - 1, day);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  // Convert to Vancouver timezone
  const vancouverStart = new Date(startOfDay.toLocaleString("en-US", { timeZone: VANCOUVER_TIMEZONE }));
  
  // Create end of day (23:59:59.999) in Vancouver timezone
  const endOfDay = new Date(vancouverStart);
  endOfDay.setUTCHours(23, 59, 59, 999);
  
  return { startOfDay: startOfDay, endOfDay };
}

/**
 * Get the start and end of the current week in Vancouver timezone
 * @returns {object} Object with startOfWeek and endOfWeek Date objects
 */
export function getVancouverWeekBounds(): { startOfWeek: Date, endOfWeek: Date } {
  const today = getVancouverDate();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
  endOfWeek.setHours(23, 59, 59, 999);
  
  return { startOfWeek, endOfWeek };
}

/**
 * Check if a date string represents today in Vancouver timezone
 * @param {string} dateString - Date string to check
 * @returns {boolean} True if the date is today in Vancouver timezone
 */
export function isToday(dateString: string): boolean {
  const today = getVancouverDateString();
  const checkDate = dateString.split('T')[0]; // Extract date part if datetime string
  return checkDate === today;
}

/**
 * Format a date for Vancouver timezone display
 * @param {Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatVancouverDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return date.toLocaleDateString("en-US", {
    timeZone: VANCOUVER_TIMEZONE,
    ...options
  });
}

/**
 * Format a time for Vancouver timezone display
 * @param {Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time string
 */
export function formatVancouverTime(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: VANCOUVER_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options
  });
}