// Common enums and constants used throughout the app

export enum ExpenseCategory {
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FIXED]: 'Fixed Expense',
  [ExpenseCategory.VARIABLE]: 'Variable Expense',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.STAFF]: 'Staff',
};

// Common positions in a salon
export const SALON_POSITIONS = [
  'Hair Stylist',
  'Colorist',
  'Nail Technician',
  'Makeup Artist',
  'Esthetician',
  'Receptionist',
  'Manager',
  'Assistant',
] as const;

export type SalonPosition = typeof SALON_POSITIONS[number];

// Date range presets for filtering
export const DATE_RANGE_PRESETS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  CUSTOM: 'custom',
} as const;

export type DateRangePreset = typeof DATE_RANGE_PRESETS[keyof typeof DATE_RANGE_PRESETS];