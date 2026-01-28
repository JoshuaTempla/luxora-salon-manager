// Input validation utilities

/**
 * Check if a string is not empty
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Philippine phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it matches Philippine format
  // +63 9XX XXX XXXX (12 digits starting with 63)
  // 09XX XXX XXXX (11 digits starting with 0)
  return (
    (cleaned.startsWith('63') && cleaned.length === 12) ||
    (cleaned.startsWith('0') && cleaned.length === 11)
  );
}

/**
 * Validate number is positive
 */
export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Validate number is non-negative
 */
export function isNonNegativeNumber(value: number): boolean {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
}

/**
 * Validate number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate percentage (0-100)
 */
export function isValidPercentage(value: number): boolean {
  return isInRange(value, 0, 100);
}

/**
 * Validate date is not in the future
 */
export function isNotFutureDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj <= new Date();
}

/**
 * Validate date is valid
 */
export function isValidDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
}

/**
 * Validate start date is before end date
 */
export function isValidDateRange(startDate: string | Date, endDate: string | Date): boolean {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  return start <= end;
}

/**
 * Validate password strength
 * Requires: min 8 characters, at least 1 uppercase, 1 lowercase, 1 number
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber;
}

/**
 * Validate username (alphanumeric, 3-20 characters)
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}