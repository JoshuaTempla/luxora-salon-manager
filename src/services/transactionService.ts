// Transaction/Sales operations

import { apiClient } from './api';

export interface Transaction {
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

export interface CreateTransactionDto {
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

export const transactionService = {
  // Get all transactions with optional filters
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.serviceId) params.append('serviceId', filters.serviceId);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Transaction[]>(`/transactions${query}`);
  },

  // Get single transaction by ID
  async getById(id: string): Promise<Transaction> {
    return apiClient.get<Transaction>(`/transactions/${id}`);
  },

  // Create new transaction (record a sale)
  async create(data: CreateTransactionDto): Promise<Transaction> {
    return apiClient.post<Transaction>('/transactions', data);
  },

  // Delete transaction
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/transactions/${id}`);
  },

  // Get transactions by employee
  async getByEmployee(employeeId: string, filters?: Omit<TransactionFilters, 'employeeId'>): Promise<Transaction[]> {
    return this.getAll({ ...filters, employeeId });
  },

  // Get daily sales summary
  async getDailySummary(date?: string): Promise<{
    totalSales: number;
    totalCommissions: number;
    transactionCount: number;
    transactions: Transaction[];
  }> {
    const query = date ? `?date=${date}` : '';
    return apiClient.get(`/transactions/summary/daily${query}`);
  },
};