// Payroll management operations

import { apiClient } from './api';

export interface Payroll {
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

export interface CreatePayrollDto {
  employeeId: string;
  startDate: string;
  endDate: string;
  totalHoursWorked: number;
  taxDeductions: number;
}

export interface UpdatePayrollDto extends Partial<CreatePayrollDto> {}

export interface PayrollFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
}

export const payrollService = {
  // Get all payroll records with optional filters
  async getAll(filters?: PayrollFilters): Promise<Payroll[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Payroll[]>(`/payroll${query}`);
  },

  // Get single payroll record by ID
  async getById(id: string): Promise<Payroll> {
    return apiClient.get<Payroll>(`/payroll/${id}`);
  },

  // Create new payroll record
  async create(data: CreatePayrollDto): Promise<Payroll> {
    return apiClient.post<Payroll>('/payroll', data);
  },

  // Update payroll record
  async update(id: string, data: UpdatePayrollDto): Promise<Payroll> {
    return apiClient.put<Payroll>(`/payroll/${id}`, data);
  },

  // Delete payroll record
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/payroll/${id}`);
  },

  // Get payroll by employee
  async getByEmployee(employeeId: string, filters?: Omit<PayrollFilters, 'employeeId'>): Promise<Payroll[]> {
    return this.getAll({ ...filters, employeeId });
  },

  // Calculate payroll for a period (generates calculation before creating)
  async calculatePayroll(
    employeeId: string,
    startDate: string,
    endDate: string,
    hoursWorked: number,
    taxRate: number
  ): Promise<{
    employeeId: string;
    startDate: string;
    endDate: string;
    hoursWorked: number;
    hourlyEarnings: number;
    commissionsEarned: number;
    grossSalary: number;
    taxDeductions: number;
    netSalary: number;
  }> {
    return apiClient.post('/payroll/calculate', {
      employeeId,
      startDate,
      endDate,
      hoursWorked,
      taxRate,
    });
  },

  // Get payroll summary for a period
  async getSummary(startDate: string, endDate: string): Promise<{
    totalGrossSalary: number;
    totalTaxDeductions: number;
    totalNetSalary: number;
    employeeCount: number;
    payrolls: Payroll[];
  }> {
    return apiClient.get(`/payroll/summary?startDate=${startDate}&endDate=${endDate}`);
  },
};