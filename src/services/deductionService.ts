// Employee deduction operations

import { apiClient } from './api';

export type DeductionType = 'CASH_ADVANCE' | 'EQUIPMENT' | 'PENALTY' | 'OTHER';

export const DEDUCTION_TYPE_LABELS: Record<DeductionType, string> = {
  CASH_ADVANCE: 'Cash Advance',
  EQUIPMENT: 'Equipment / Supplies',
  PENALTY: 'Penalty',
  OTHER: 'Other',
};

export interface EmployeeDeduction {
  id: string;
  description: string;
  amount: number;
  type: DeductionType;
  date: string;
  isDeducted: boolean;
  employeeId: string;
  employee?: {
    firstName: string;
    lastName: string;
    position: string;
  };
  payrollId?: string | null;
}

export interface CreateDeductionDto {
  employeeId: string;
  type: DeductionType;
  description: string;
  amount: number;
  date?: string;
}

export interface UpdateDeductionDto extends Partial<CreateDeductionDto> {}

export interface DeductionFilters {
  employeeId?: string;
  isDeducted?: boolean;
  type?: DeductionType;
  startDate?: string;
  endDate?: string;
}

export const deductionService = {
  // Get all deductions with optional filters
  async getAll(filters?: DeductionFilters): Promise<EmployeeDeduction[]> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.isDeducted !== undefined) params.append('isDeducted', filters.isDeducted.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<EmployeeDeduction[]>(`/deductions${query}`);
  },

  // Get single deduction by ID
  async getById(id: string): Promise<EmployeeDeduction> {
    return apiClient.get<EmployeeDeduction>(`/deductions/${id}`);
  },

  // Create new deduction
  async create(data: CreateDeductionDto): Promise<EmployeeDeduction> {
    return apiClient.post<EmployeeDeduction>('/deductions', data);
  },

  // Update deduction
  async update(id: string, data: UpdateDeductionDto): Promise<EmployeeDeduction> {
    return apiClient.put<EmployeeDeduction>(`/deductions/${id}`, data);
  },

  // Delete deduction (only if not yet deducted)
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/deductions/${id}`);
  },

  // Get pending deductions total for an employee (used in payroll preview)
  async getPendingTotal(employeeId: string): Promise<{ total: number; count: number; deductions: EmployeeDeduction[] }> {
    return apiClient.get(`/deductions/pending/${employeeId}`);
  },
};