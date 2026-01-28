// src/types/index.ts
// Central export point for all types

// Re-export service types for convenience
export type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '../services/employeeService';

export type {
  CreateServiceDto,
  UpdateServiceDto,
} from '../services/serviceService';

export type {
  CreateTransactionDto,
}from '../services/transactionService'


export type {
  CreateExpenseDto,
  UpdateExpenseDto,
} from '../services/expenseService';

export type {
  CreatePayrollDto,
  UpdatePayrollDto,
} from '../services/payrollService';

export type {
  LoginDto,
  RegisterDto,
} from '../services/authService';

// ============================================
// ENUMS & CONSTANTS
// ============================================
export * from './enums';

// ============================================
// COMMON UTILITY TYPES
// ============================================
export * from './common';

// ============================================
// USER TYPES
// ============================================
export interface User {
  id: string;
  username: string;
  password: string;
  role: string;
}

export interface UserInput {
  username: string;
  password: string;
  role?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// ============================================
// EMPLOYEE TYPES
// ============================================
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  hourlyRate: number;
  baseCommission: number;
  isActive: boolean;
  createdAt: string; // ISO date string from API
}

export interface EmployeeInput {
  firstName: string;
  lastName: string;
  position: string;
  hourlyRate?: number;
  baseCommission?: number;
  isActive?: boolean;
}

export interface EmployeeWithStats extends Employee {
  fullName?: string;
  totalTransactions?: number;
  totalCommissions?: number;
  totalSales?: number;
  currentMonthSales?: number;
  currentMonthCommissions?: number;
  transactionCount?: number;
}

// ============================================
// SERVICE TYPES
// ============================================
export interface Service {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  isActive: boolean;
}

export interface ServiceInput {
  name: string;
  price: number;
  commissionRate?: number;
  isActive?: boolean;
}

export interface ServiceWithStats extends Service {
  timesProvided?: number;
  totalRevenue?: number;
  lastUsed?: string;
}

// ============================================
// TRANSACTION TYPES
// ============================================
export interface Transaction {
  id: string;
  createdAt: string; // ISO date string
  employeeId: string;
  serviceId: string;
  soldPrice: number;
  commissionAmount: number;
}

export interface TransactionWithDetails extends Transaction {
  employee?: {
    firstName: string;
    lastName: string;
  };
  service?: {
    name: string;
  };
}

export interface TransactionInput {
  employeeId: string;
  serviceId: string;
  soldPrice?: number; // Optional, will use service price if not provided
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  serviceId?: string;
}

// ============================================
// EXPENSE TYPES
// ============================================
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE';
  date: string; // ISO date string
  isRecurring: boolean;
}

export interface ExpenseInput {
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE';
  date?: string;
  isRecurring?: boolean;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: 'FIXED' | 'VARIABLE';
  isRecurring?: boolean;
}

// ============================================
// PAYROLL TYPES
// ============================================
export interface Payroll {
  id: string;
  payrollDate: string; // ISO date string
  startDate: string;
  endDate: string;
  totalHoursWorked: number;
  commissionsEarned: number;
  grossSalary: number;
  taxDeductions: number;
  netSalary: number;
  employeeId: string;
}

export interface PayrollWithEmployee extends Payroll {
  employee?: {
    firstName: string;
    lastName: string;
    position: string;
  };
}

export interface PayrollInput {
  employeeId: string;
  startDate: string;
  endDate: string;
  totalHoursWorked: number;
  taxDeductions: number;
}

export interface PayrollFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
}

// ============================================
// DASHBOARD & ANALYTICS TYPES
// ============================================
export interface DashboardStats {
  todaySales: {
    total: number;
    count: number;
    commissions: number;
  };
  monthSales: {
    total: number;
    count: number;
    commissions: number;
  };
  todayExpenses: {
    total: number;
    count: number;
  };
  monthExpenses: {
    total: number;
    fixed: number;
    variable: number;
  };
  activeEmployees: number;
  activeServices: number;
  // Legacy fields for compatibility
  totalRevenue?: number;
  servicesToday?: number;
  monthlyExpenses?: number;
  revenueChange?: string;
  employeeChange?: string;
  serviceChange?: string;
  expenseChange?: string;
}

export interface SalesChart {
  date: string;
  sales: number;
  transactions: number;
}

export interface TopPerformer {
  employeeId: string;
  employeeName: string;
  totalSales: number;
  transactionCount: number;
  commissionsEarned: number;
}

export interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  timesProvided: number;
  totalRevenue: number;
}

export interface SalesReport {
  totalRevenue: number;
  totalTransactions: number;
  totalCommissions: number;
  averageTransactionValue: number;
  topServices: Array<{
    serviceName: string;
    count: number;
    revenue: number;
  }>;
  topEmployees: Array<{
    employeeName: string;
    transactionCount: number;
    totalSales: number;
    totalCommissions: number;
  }>;
}

export interface ExpenseReport {
  totalExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  expensesByCategory: Record<string, number>;
}

// ============================================
// AUTHENTICATION TYPES
// ============================================
export interface AuthResponse {
  user: User;
  token?: string;
}

// ============================================
// FORM & UI TYPES
// ============================================
export type FormMode = 'create' | 'edit';