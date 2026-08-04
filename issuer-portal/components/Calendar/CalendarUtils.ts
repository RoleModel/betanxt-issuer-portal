/**
 * Calendar utilities for date calculations and task organization
 * Handles date parsing, range calculations, and calendar grid generation
 */

// Re-export calendar types for convenience

/**
 * Shift weekend dates to next Monday
 * Saturday (6) and Sunday (0) get moved to Monday
 */
export const shiftWeekendToMonday = (date: Date): Date => {
  const dayOfWeek = date.getDay();
  const shiftedDate = new Date(date);

  if (dayOfWeek === 0) {
    // Sunday - move to Monday (+1 day)
    shiftedDate.setDate(date.getDate() + 1);
  } else if (dayOfWeek === 6) {
    // Saturday - move to Monday (+2 days)
    shiftedDate.setDate(date.getDate() + 2);
  }

  return shiftedDate;
};

/**
 * Parse date string to Date object
 * Supports formats: "Friday, Aug 16", "Aug 20", "Sep 1", etc.
 */
export const parseTaskDate = (dateString: string): Date | null => {
  if (!dateString) {
    return null;
  }

  try {
    // Parse the date string
    const parsed = new Date(`${dateString}, 2025`);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Ignore parsing errors and fall back to null
  }

  return null;
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Format date to display string
 */
export const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/**
 * Get week number of the year
 */
export const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear =
    (date.getTime() - firstDayOfYear.getTime()) / 86_400_000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs(date1.getTime() - date2.getTime()) / oneDay);
};

export {
  type CalendarDate,
  type CalendarWeek,
  type CalendarMonth,
} from "@/types/common";
