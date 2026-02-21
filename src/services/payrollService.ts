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
  commissionsEarned: number;
  taxDeductions: number;
}

export interface UpdatePayrollDto extends Partial<CreatePayrollDto> {}

export interface PayrollFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
}

export const payrollService = {
  async getAll(filters?: PayrollFilters): Promise<Payroll[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Payroll[]>(`/payroll${query}`);
  },

  async getById(id: string): Promise<Payroll> {
    return apiClient.get<Payroll>(`/payroll/${id}`);
  },

  async create(data: CreatePayrollDto): Promise<Payroll> {
    return apiClient.post<Payroll>('/payroll', data);
  },

  async update(id: string, data: UpdatePayrollDto): Promise<Payroll> {
    return apiClient.put<Payroll>(`/payroll/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/payroll/${id}`);
  },

  async getByEmployee(employeeId: string, filters?: Omit<PayrollFilters, 'employeeId'>): Promise<Payroll[]> {
    return this.getAll({ ...filters, employeeId });
  },

  // Calculate payroll preview (without saving)
  // Backend route: POST /payroll/preview
  async calculatePayroll(
    employeeId: string,
    startDate: string,
    endDate: string,
    hoursWorked: number,
    taxRate: number
  ): Promise<{
    hoursWorked: number;
    hourlyEarnings: number;
    commissionsEarned: number;
    grossSalary: number;
    taxDeductions: number;
    employeeDeductionAmount: number;
    employeeDeductionCount: number;
    pendingDeductions: Array<{ id: string; description: string; amount: number; type: string }>;
    netSalary: number;
    transactionCount: number;
  }> {
    const response = await apiClient.post<any>('/payroll/preview', {
      employeeId,
      startDate,
      endDate,
      totalHoursWorked: hoursWorked,
      taxRate,
    });

    // Backend wraps in breakdown object
    const b = response.breakdown ?? response;
    return {
      hoursWorked: b.totalHoursWorked ?? hoursWorked,
      hourlyEarnings: b.hourlyPay ?? 0,
      commissionsEarned: b.commissionsEarned ?? 0,
      grossSalary: b.grossSalary ?? 0,
      taxDeductions: b.taxDeductions ?? 0,
      employeeDeductionAmount: b.employeeDeductionAmount ?? 0,
      employeeDeductionCount: b.employeeDeductionCount ?? 0,
      pendingDeductions: b.pendingDeductions ?? [],
      netSalary: b.netSalary ?? 0,
      transactionCount: b.transactionCount ?? 0,
    };
  },

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