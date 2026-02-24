// Central export point for all types

// ============================================
// ENUMS & CONSTANTS
// ============================================
export * from './enums';

// ============================================
// COMMON UTILITY TYPES
// ============================================
export * from './common';

// ============================================
// RE-EXPORT SERVICE TYPES (DTOs)
// ============================================
export type {
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '../services/employeeService';

export type {
  Service,
  CreateServiceDto,
  UpdateServiceDto,
  CommissionType,
} from '../services/serviceService';

export type {
  Transaction,
  CreateTransactionDto,
  TransactionFilters,
} from '../services/transactionService';

export type {
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseFilters,
} from '../services/expenseService';

export type {
  Payroll,
  CreatePayrollDto,
  UpdatePayrollDto,
  PayrollFilters,
} from '../services/payrollService';

export type {
  EmployeeDeduction,
  CreateDeductionDto,
  UpdateDeductionDto,
  DeductionFilters,
  DeductionType,
} from '../services/deductionService';

export { DEDUCTION_TYPE_LABELS } from '../services/deductionService';

export type {
  User,
  LoginDto,
  RegisterDto,
  AuthResponse,
} from '../services/authService';

export type {
  DashboardStats,
  SalesChart,
  TopPerformer,
  ServicePerformance,
} from '../services/dashboardService';

// ============================================
// ADDITIONAL USER TYPES
// ============================================
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
// EXTENDED EMPLOYEE TYPES
// ============================================
export interface EmployeeInput {
  firstName: string;
  lastName: string;
  position: string;
  hourlyRate?: number;
  // baseCommission removed - commission is per-service only
  isActive?: boolean;
}

export interface EmployeeWithStats {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  hourlyRate: number;
  // baseCommission removed - commission is per-service only
  isActive: boolean;
  createdAt: string;
  fullName?: string;
  totalTransactions?: number;
  totalCommissions?: number;
  totalSales?: number;
  currentMonthSales?: number;
  currentMonthCommissions?: number;
  transactionCount?: number;
}

// ============================================
// EXTENDED SERVICE TYPES
// ============================================
export interface ServiceInput {
  name: string;
  price: number;
  commissionRate?: number;
  commissionType?: 'PERCENTAGE' | 'FIXED';
  isActive?: boolean;
}

export interface ServiceWithStats {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  commissionType: 'PERCENTAGE' | 'FIXED';
  isActive: boolean;
  timesProvided?: number;
  totalRevenue?: number;
  lastUsed?: string;
}

// ============================================
// EXTENDED TRANSACTION TYPES
// ============================================
export interface TransactionWithDetails {
  id: string;
  createdAt: string;
  employeeId: string;
  serviceId: string;
  soldPrice: number;
  commissionAmount: number;
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
  soldPrice?: number;
}

// ============================================
// EXTENDED EXPENSE TYPES
// ============================================
export interface ExpenseInput {
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE';
  date?: string;
  isRecurring?: boolean;
}

// ============================================
// EXTENDED PAYROLL TYPES
// ============================================
export interface PayrollWithEmployee {
  id: string;
  payrollDate: string;
  startDate: string;
  endDate: string;
  totalHoursWorked: number;
  commissionsEarned: number;
  grossSalary: number;
  taxDeductions: number;
  netSalary: number;
  employeeId: string;
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

// ============================================
// REPORT TYPES
// ============================================
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
// FORM & UI TYPES
// ============================================
export type FormMode = 'create' | 'edit';