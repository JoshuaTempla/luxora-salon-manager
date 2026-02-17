// src/services/mockData.ts
// Mock data for testing without backend

import { 
  Employee, 
  Service, 
  Transaction, 
  Expense, 
  Payroll,
  DashboardStats,
  TopPerformer,
  ServicePerformance
} from '@/types';

// Mock Employees
export const mockEmployees: Employee[] = [
  {
    id: '1',
    firstName: 'Maria',
    lastName: 'Santos',
    position: 'Hair Stylist',
    hourlyRate: 150,
    baseCommission: 15,
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    firstName: 'Juan',
    lastName: 'Cruz',
    position: 'Nail Technician',
    hourlyRate: 120,
    baseCommission: 10,
    isActive: true,
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    firstName: 'Ana',
    lastName: 'Reyes',
    position: 'Makeup Artist',
    hourlyRate: 180,
    baseCommission: 20,
    isActive: true,
    createdAt: '2024-02-01',
  },
];

// Mock Services
export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Haircut',
    price: 300,
    commissionRate: 15,
    isActive: true,
  },
  {
    id: '2',
    name: 'Hair Color',
    price: 1500,
    commissionRate: 20,
    isActive: true,
  },
  {
    id: '3',
    name: 'Manicure',
    price: 250,
    commissionRate: 10,
    isActive: true,
  },
  {
    id: '4',
    name: 'Pedicure',
    price: 350,
    commissionRate: 10,
    isActive: true,
  },
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    createdAt: new Date().toISOString(),
    employeeId: '1',
    serviceId: '1',
    soldPrice: 300,
    commissionAmount: 45,
    employee: { firstName: 'Maria', lastName: 'Santos' },
    service: { name: 'Haircut' },
  },
  {
    id: '2',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    employeeId: '2',
    serviceId: '3',
    soldPrice: 250,
    commissionAmount: 25,
    employee: { firstName: 'Juan', lastName: 'Cruz' },
    service: { name: 'Manicure' },
  },
  {
    id: '3',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    employeeId: '1',
    serviceId: '2',
    soldPrice: 1500,
    commissionAmount: 300,
    employee: { firstName: 'Maria', lastName: 'Santos' },
    service: { name: 'Hair Color' },
  },
];

// Mock Expenses
export const mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Rent Payment',
    amount: 15000,
    category: 'FIXED',
    date: '2024-02-01',
    isRecurring: true,
  },
  {
    id: '2',
    description: 'Hair Products Supply',
    amount: 3500,
    category: 'VARIABLE',
    date: '2024-02-10',
    isRecurring: false,
  },
];

// Mock Payroll
export const mockPayrolls: Payroll[] = [
  {
    id: '1',
    payrollDate: '2024-02-15',
    startDate: '2024-02-01',
    endDate: '2024-02-15',
    totalHoursWorked: 80,
    commissionsEarned: 2500,
    grossSalary: 14500,
    taxDeductions: 1740,
    netSalary: 12760,
    employeeId: '1',
    employee: {
      firstName: 'Maria',
      lastName: 'Santos',
      position: 'Hair Stylist',
    },
  },
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  todaySales: {
    total: 2050,
    count: 3,
    commissions: 370,
  },
  monthSales: {
    total: 45000,
    count: 87,
    commissions: 8100,
  },
  todayExpenses: {
    total: 500,
    count: 2,
  },
  monthExpenses: {
    total: 18500,
    fixed: 15000,
    variable: 3500,
  },
  activeEmployees: 3,
  activeServices: 4,
};

// Mock Top Performers
export const mockTopPerformers: TopPerformer[] = [
  {
    employeeId: '1',
    employeeName: 'Maria Santos',
    totalSales: 18500,
    transactionCount: 35,
    commissionsEarned: 3200,
  },
  {
    employeeId: '3',
    employeeName: 'Ana Reyes',
    totalSales: 15200,
    transactionCount: 28,
    commissionsEarned: 2850,
  },
  {
    employeeId: '2',
    employeeName: 'Juan Cruz',
    totalSales: 11300,
    transactionCount: 24,
    commissionsEarned: 2050,
  },
];

// Mock Service Performance
export const mockServicePerformance: ServicePerformance[] = [
  {
    serviceId: '2',
    serviceName: 'Hair Color',
    timesProvided: 42,
    totalRevenue: 28500,
  },
  {
    serviceId: '1',
    serviceName: 'Haircut',
    timesProvided: 38,
    totalRevenue: 11400,
  },
  {
    serviceId: '4',
    serviceName: 'Pedicure',
    timesProvided: 15,
    totalRevenue: 5250,
  },
  {
    serviceId: '3',
    serviceName: 'Manicure',
    timesProvided: 12,
    totalRevenue: 3000,
  },
];