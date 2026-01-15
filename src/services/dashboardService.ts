// Dashboard and analytics operations

import { apiClient } from './api';

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

export const dashboardService = {
  // Get overview statistics
  async getStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/dashboard/stats');
  },

  // Get sales chart data for a period
  async getSalesChart(startDate: string, endDate: string): Promise<SalesChart[]> {
    return apiClient.get<SalesChart[]>(
      `/dashboard/sales-chart?startDate=${startDate}&endDate=${endDate}`
    );
  },

  // Get top performing employees
  async getTopPerformers(
    startDate: string,
    endDate: string,
    limit = 5
  ): Promise<TopPerformer[]> {
    return apiClient.get<TopPerformer[]>(
      `/dashboard/top-performers?startDate=${startDate}&endDate=${endDate}&limit=${limit}`
    );
  },

  // Get service performance
  async getServicePerformance(
    startDate: string,
    endDate: string
  ): Promise<ServicePerformance[]> {
    return apiClient.get<ServicePerformance[]>(
      `/dashboard/service-performance?startDate=${startDate}&endDate=${endDate}`
    );
  },

  // Get profit/loss summary
  async getProfitLoss(startDate: string, endDate: string): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    totalCommissions: number;
    netProfit: number;
    profitMargin: number;
  }> {
    return apiClient.get(
      `/dashboard/profit-loss?startDate=${startDate}&endDate=${endDate}`
    );
  },
};