// User Types
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

// Employee Types
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  hourlyRate: number;
  baseCommission: number;
  isActive: boolean;
  createdAt: Date;
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
  totalTransactions?: number;
  totalCommissions?: number;
  totalSales?: number;
}

// Service Types
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

// Transaction Types
export interface Transaction {
  id: string;
  createdAt: Date;
  employeeId: string;
  serviceId: string;
  soldPrice: number;
  commissionAmount: number;
}

export interface TransactionWithDetails extends Transaction {
  employee?: Employee;
  service?: Service;
}

export interface TransactionInput {
  employeeId: string;
  serviceId: string;
  soldPrice: number;
  commissionAmount: number;
}

// Expense Types
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE';
  date: Date;
  isRecurring: boolean;
}

export interface ExpenseInput {
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE';
  date?: Date;
  isRecurring?: boolean;
}

// Payroll Types
export interface Payroll {
  id: string;
  payrollDate: Date;
  startDate: Date;
  endDate: Date;
  totalHoursWorked: number;
  commissionsEarned: number;
  grossSalary: number;
  taxDeductions: number;
  netSalary: number;
  employeeId: string;
}

export interface PayrollWithEmployee extends Payroll {
  employee?: Employee;
}

export interface PayrollInput {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  totalHoursWorked: number;
  commissionsEarned: number;
  grossSalary: number;
  taxDeductions: number;
  netSalary: number;
}

// Analytics & Report Types
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

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}