/**
 * Timezone utility functions for UTC
 * Handles all operations in coordinated universal time
 */

const UTC_TIMEZONE = "UTC";

/**
 * Get the current date in UTC as YYYY-MM-DD string
 * @returns {string} Date string in YYYY-MM-DD format for UTC
 */
export function getUtcDateString(): string {
  const now = new Date();
  const utcDate = new Date(
    now.toLocaleString("en-US", { timeZone: UTC_TIMEZONE })
  );

  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, "0");
  const day = String(utcDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Get the current date and time in UTC
 * @returns {Date} Date object representing current time in UTC
 */
export function getUtcDate(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: UTC_TIMEZONE }));
}

/**
 * Convert a date string to UTC date
 * @param {string} dateString - Date string in any format
 * @returns {Date} Date object in UTC
 */
export function toUtcDate(dateString: string): Date {
  const date = new Date(dateString);
  return new Date(date.toLocaleString("en-US", { timeZone: UTC_TIMEZONE }));
}

/**
 * Get start and end of day in UTC
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {object} Object with startOfDay and endOfDay Date objects
 */
export function getUtcDayBounds(dateString: string): {
  startOfDay: Date;
  endOfDay: Date;
} {
  const [year, month, day] = dateString.split("-").map(Number);

  const startOfDay = new Date();
  startOfDay.setFullYear(year, month - 1, day);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

/**
 * Get the start and end of the current week in UTC
 * @returns {object} Object with startOfWeek and endOfWeek Date objects
 */
export function getUtcWeekBounds(): {
  startOfWeek: Date;
  endOfWeek: Date;
} {
  const today = getUtcDate();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
}

/**
 * Check if a date string represents today in UTC
 * @param {string} dateString - Date string to check
 * @returns {boolean} True if the date is today in UTC
 */
export function isToday(dateString: string): boolean {
  const today = getUtcDateString();
  const checkDate = dateString.split("T")[0];
  return checkDate === today;
}

/**
 * Format a date for UTC display
 * @param {Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatUtcDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return date.toLocaleDateString("en-US", {
    timeZone: UTC_TIMEZONE,
    ...options,
  });
}

/**
 * Format a time for UTC display
 * @param {Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time string
 */
export function formatUtcTime(
  date: Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: UTC_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
}
