// Date manipulation utilities

import { DateRange, DATE_RANGE_PRESETS } from '@/types';

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date in ISO format
 */
export function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Get number of days between two dates
 */
export function daysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date
 */
export function addDays(date: string | Date, days: number): string {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj.toISOString().split('T')[0];
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: string | Date, days: number): string {
  return addDays(date, -days);
}

/**
 * Get start of week (Monday)
 */
export function getStartOfWeek(date?: Date): string {
  const d = date || new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Get end of week (Sunday)
 */
export function getEndOfWeek(date?: Date): string {
  const startOfWeek = getStartOfWeek(date);
  return addDays(startOfWeek, 6);
}

/**
 * Get start of month
 */
export function getStartOfMonth(date?: Date): string {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

/**
 * Get end of month
 */
export function getEndOfMonth(date?: Date): string {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
}

/**
 * Get start of year
 */
export function getStartOfYear(date?: Date): string {
  const d = date || new Date();
  return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0];
}

/**
 * Get end of year
 */
export function getEndOfYear(date?: Date): string {
  const d = date || new Date();
  return new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0];
}

/**
 * Get date range based on preset
 */
export function getDateRange(preset: string): DateRange {
  const today = new Date();
  
  switch (preset) {
    case DATE_RANGE_PRESETS.TODAY:
      return {
        startDate: getToday(),
        endDate: getToday(),
      };
      
    case DATE_RANGE_PRESETS.YESTERDAY:
      const yesterday = getYesterday();
      return {
        startDate: yesterday,
        endDate: yesterday,
      };
      
    case DATE_RANGE_PRESETS.THIS_WEEK:
      return {
        startDate: getStartOfWeek(),
        endDate: getEndOfWeek(),
      };
      
    case DATE_RANGE_PRESETS.LAST_WEEK:
      const lastWeekDate = new Date();
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      return {
        startDate: getStartOfWeek(lastWeekDate),
        endDate: getEndOfWeek(lastWeekDate),
      };
      
    case DATE_RANGE_PRESETS.THIS_MONTH:
      return {
        startDate: getStartOfMonth(),
        endDate: getEndOfMonth(),
      };
      
    case DATE_RANGE_PRESETS.LAST_MONTH:
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return {
        startDate: getStartOfMonth(lastMonth),
        endDate: getEndOfMonth(lastMonth),
      };
      
    case DATE_RANGE_PRESETS.THIS_YEAR:
      return {
        startDate: getStartOfYear(),
        endDate: getEndOfYear(),
      };
      
    default:
      return {
        startDate: getToday(),
        endDate: getToday(),
      };
  }
}

/**
 * Format date for input[type="date"]
 */
export function formatDateForInput(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
}

/**
 * Get the current payroll cutoff period based on today's date.
 * 1st cutoff: 1–15 of current month
 * 2nd cutoff: 16–end of current month
 * Workdays are Mon–Fri but dates are calendar-based for the range.
 */
export function getPayrollCutoff(): { startDate: string; endDate: string } {
  const today = new Date();
  const day = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth();

  if (day <= 15) {
    // 1st cutoff: 1st to 15th
    const start = new Date(year, month, 1);
    const end = new Date(year, month, 15);
    return {
      startDate: start.toLocaleDateString('en-CA'),
      endDate: end.toLocaleDateString('en-CA'),
    };
  } else {
    // 2nd cutoff: 16th to end of month
    const start = new Date(year, month, 16);
    const end = new Date(year, month + 1, 0); // day 0 = last day of current month
    return {
      startDate: start.toLocaleDateString('en-CA'),
      endDate: end.toLocaleDateString('en-CA'),
    };
  }
}