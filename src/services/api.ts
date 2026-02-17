/// <reference types="vite/client" />

// Base API configuration and HTTP client

import { USE_MOCK_DATA, MOCK_API_DELAY } from '@/config';
import * as mockData from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async mockRequest<T>(endpoint: string, method: string, data?: unknown): Promise<T> {
    await delay(MOCK_API_DELAY);

    // Parse endpoint to determine what data to return
    if (endpoint.includes('/employees')) {
      if (method === 'GET') return mockData.mockEmployees as T;
      if (method === 'POST' && data) {
        const newEmployee = { ...(data as object), id: Date.now().toString(), createdAt: new Date().toISOString(), isActive: true } as any;
        mockData.mockEmployees.push(newEmployee);
        return newEmployee as T;
      }
    }

    if (endpoint.includes('/services')) {
      if (method === 'GET') return mockData.mockServices as T;
      if (method === 'POST' && data) {
        const newService = { ...(data as object), id: Date.now().toString(), isActive: true } as any;
        mockData.mockServices.push(newService);
        return newService as T;
      }
    }

    if (endpoint.includes('/transactions')) {
      if (method === 'GET') return mockData.mockTransactions as T;
      if (method === 'POST' && data) {
        const newTransaction = { ...(data as object), id: Date.now().toString(), createdAt: new Date().toISOString() } as any;
        mockData.mockTransactions.unshift(newTransaction);
        return newTransaction as T;
      }
    }

    if (endpoint.includes('/expenses')) {
      if (method === 'GET') return mockData.mockExpenses as T;
      if (method === 'POST' && data) {
        const newExpense = { ...(data as object), id: Date.now().toString() } as any;
        mockData.mockExpenses.unshift(newExpense);
        return newExpense as T;
      }
    }

    if (endpoint.includes('/payroll')) {
      if (method === 'GET') return mockData.mockPayrolls as T;
      if (method === 'POST' && data) {
        const newPayroll = { ...(data as object), id: Date.now().toString(), payrollDate: new Date().toISOString() } as any;
        mockData.mockPayrolls.unshift(newPayroll);
        return newPayroll as T;
      }
    }

    if (endpoint.includes('/dashboard/stats')) {
      return mockData.mockDashboardStats as T;
    }

    if (endpoint.includes('/dashboard/top-performers')) {
      return mockData.mockTopPerformers as T;
    }

    if (endpoint.includes('/dashboard/service-performance')) {
      return mockData.mockServicePerformance as T;
    }

    // Default empty response
    return [] as T;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    // Use mock data if configured
    if (USE_MOCK_DATA) {
      return this.mockRequest<T>(endpoint, options?.method || 'GET', options?.body ? JSON.parse(options.body as string) : undefined);
    }

    // Real API call
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'An error occurred',
        }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Backend returns { success: true, data: ... }, so unwrap it
      if (result && result.success && result.data !== undefined) {
        return result.data as T;
      }
      
      // If no data field, return the whole result
      return result as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);