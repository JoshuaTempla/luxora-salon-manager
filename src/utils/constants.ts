// Application-wide constants

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

/**
 * Tax rates (Philippines)
 */
export const TAX_RATES = {
  SSS_RATE: 0.045, // 4.5%
  PHILHEALTH_RATE: 0.045, // 4.5%
  PAGIBIG_RATE: 0.02, // 2%
  WITHHOLDING_TAX_RATE: 0.12, // 12% (simplified)
} as const;

/**
 * Date formats
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  FULL: 'MMMM DD, YYYY',
  DATETIME: 'MMM DD, YYYY hh:mm A',
} as const;

/**
 * Currency settings
 */
export const CURRENCY = {
  CODE: 'PHP',
  SYMBOL: '₱',
  LOCALE: 'en-PH',
} as const;

/**
 * Input validation limits
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_HOURLY_RATE: 0,
  MAX_HOURLY_RATE: 10000,
  MIN_COMMISSION_RATE: 0,
  MAX_COMMISSION_RATE: 100,
  MIN_SERVICE_PRICE: 0,
  MAX_SERVICE_PRICE: 100000,
} as const;

/**
 * Status colors for UI
 */
export const STATUS_COLORS = {
  active: '#22c55e', // green
  inactive: '#ef4444', // red
  pending: '#f59e0b', // amber
  completed: '#3b82f6', // blue
} as const;

/**
 * Chart colors
 */
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  gray: '#6b7280',
} as const;

/**
 * Debounce delay for search inputs (ms)
 */
export const DEBOUNCE_DELAY = 300;

/**
 * API request timeout (ms)
 */
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created!',
  UPDATED: 'Successfully updated!',
  DELETED: 'Successfully deleted!',
  SAVED: 'Successfully saved!',
} as const;