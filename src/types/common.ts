// Common utility types used throughout the app

// Generic API response wrapper
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Date range filter
export interface DateRange {
  startDate: string;
  endDate: string;
}

// Sort options
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Form state
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Generic select option (for dropdowns)
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

// Table column definition
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

// Action result (for optimistic updates, etc.)
export interface ActionResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

// Generic ID type (using string as per Prisma schema)
export type ID = string;