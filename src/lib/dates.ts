import { format, toZonedTime } from "date-fns-tz";

const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";
const DAILY_DEADLINE_HOUR = parseInt(
  process.env.DAILY_DEADLINE_HOUR || "23",
  10
);

/**
 * Get today's date string in YYYY-MM-DD format (in the configured timezone).
 */
export function getTodayDateString(timezone: string = DEFAULT_TIMEZONE): string {
  const now = new Date();
  const zoned = toZonedTime(now, timezone);
  return format(zoned, "yyyy-MM-dd", { timeZone: timezone });
}

/**
 * Get the current time in the configured timezone.
 */
export function getNowInTimezone(timezone: string = DEFAULT_TIMEZONE): Date {
  return toZonedTime(new Date(), timezone);
}

/**
 * Check if the daily deadline has passed for the given date.
 * Deadline is DAILY_DEADLINE_HOUR:59:59 in the configured timezone.
 */
export function isDeadlinePassed(
  dateStr: string,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const now = getNowInTimezone(timezone);
  const today = getTodayDateString(timezone);

  // If dateStr is in the past, deadline has passed
  if (dateStr < today) return true;

  // If dateStr is today, check the hour
  if (dateStr === today) {
    const currentHour = parseInt(format(now, "HH", { timeZone: timezone }), 10);
    return currentHour >= DAILY_DEADLINE_HOUR;
  }

  // Future date — deadline hasn't passed
  return false;
}

/**
 * Parse a date string and return a human-readable format.
 */
export function formatDateDisplay(dateStr: string): string {
  // dateStr is YYYY-MM-DD
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return format(date, "MMMM d, yyyy");
}

/**
 * Get the week number string for a date (for weekly quizzes).
 * Format: YYYY-WW
 */
export function getWeekString(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  const zoned = toZonedTime(date, timezone);
  return format(zoned, "yyyy-II", { timeZone: timezone });
}

/**
 * Check if two date strings are consecutive calendar days.
 */
export function areConsecutiveDays(date1: string, date2: string): boolean {
  const d1 = new Date(date1 + "T00:00:00Z");
  const d2 = new Date(date2 + "T00:00:00Z");
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

/**
 * Get the last N dates ending at (and including) today.
 */
export function getLastNDates(
  n: number,
  timezone: string = DEFAULT_TIMEZONE
): string[] {
  const today = getTodayDateString(timezone);
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}
