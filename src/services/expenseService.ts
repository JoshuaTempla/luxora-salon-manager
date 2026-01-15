// Expense tracking operations

import { apiClient } from './api';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE';
  date: string;
  isRecurring: boolean;
}

export interface CreateExpenseDto {
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE';
  date?: string; // Optional, defaults to now
  isRecurring?: boolean;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: 'FIXED' | 'VARIABLE';
  isRecurring?: boolean;
}

export const expenseService = {
  // Get all expenses with optional filters
  async getAll(filters?: ExpenseFilters): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.isRecurring !== undefined) {
      params.append('isRecurring', filters.isRecurring.toString());
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Expense[]>(`/expenses${query}`);
  },

  // Get single expense by ID
  async getById(id: string): Promise<Expense> {
    return apiClient.get<Expense>(`/expenses/${id}`);
  },

  // Create new expense
  async create(data: CreateExpenseDto): Promise<Expense> {
    return apiClient.post<Expense>('/expenses', data);
  },

  // Update expense
  async update(id: string, data: UpdateExpenseDto): Promise<Expense> {
    return apiClient.put<Expense>(`/expenses/${id}`, data);
  },

  // Delete expense
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/expenses/${id}`);
  },

  // Get expense summary for a period
  async getSummary(startDate: string, endDate: string): Promise<{
    totalFixed: number;
    totalVariable: number;
    total: number;
    breakdown: Array<{ category: string; total: number }>;
  }> {
    return apiClient.get(`/expenses/summary?startDate=${startDate}&endDate=${endDate}`);
  },
};