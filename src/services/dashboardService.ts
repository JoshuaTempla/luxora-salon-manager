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
  // Get overview statistics - maps to /analytics/dashboard
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<any>('/analytics/dashboard');
    
    // Transform backend response to match frontend interface
    return {
      todaySales: {
        total: response.overview?.totalRevenue || 0,
        count: response.overview?.transactionCount || 0,
        commissions: response.overview?.totalCommissions || 0,
      },
      monthSales: {
        total: response.overview?.totalRevenue || 0,
        count: response.overview?.transactionCount || 0,
        commissions: response.overview?.totalCommissions || 0,
      },
      todayExpenses: {
        total: response.expenses?.total || 0,
        count: 0,
      },
      monthExpenses: {
        total: response.expenses?.total || 0,
        fixed: response.expenses?.fixed || 0,
        variable: response.expenses?.variable || 0,
      },
      activeEmployees: response.resources?.activeEmployees || 0,
      activeServices: response.resources?.activeServices || 0,
    };
  },

  // Get sales chart data - maps to /analytics/revenue-trends
  async getSalesChart(startDate: string, endDate: string): Promise<SalesChart[]> {
    const response = await apiClient.get<any>(
      `/analytics/revenue-trends?startDate=${startDate}&endDate=${endDate}&groupBy=day`
    );
    
    return (response.trends || []).map((trend: any) => ({
      date: trend.period,
      sales: trend.revenue,
      transactions: trend.transactions,
    }));
  },

  // Get top performing employees - maps to /analytics/employee-comparison
  async getTopPerformers(
    startDate: string,
    endDate: string,
    limit = 5
  ): Promise<TopPerformer[]> {
    const response = await apiClient.get<any[]>(
      `/analytics/employee-comparison?startDate=${startDate}&endDate=${endDate}`
    );
    
    return (response || []).slice(0, limit).map((item: any) => ({
      employeeId: item.employee.id,
      employeeName: `${item.employee.firstName} ${item.employee.lastName}`,
      totalSales: item.performance.totalRevenue,
      transactionCount: item.performance.transactionCount,
      commissionsEarned: item.performance.totalCommissions,
    }));
  },

  // Get service performance - maps to /analytics/service-performance
  async getServicePerformance(
    startDate: string,
    endDate: string
  ): Promise<ServicePerformance[]> {
    const response = await apiClient.get<any[]>(
      `/analytics/service-performance?startDate=${startDate}&endDate=${endDate}`
    );
    
    return (response || []).map((item: any) => ({
      serviceId: item.service.id,
      serviceName: item.service.name,
      timesProvided: item.performance.transactionCount,
      totalRevenue: item.performance.totalRevenue,
    }));
  },

  // Get profit/loss summary - maps to /analytics/profit-loss
  async getProfitLoss(startDate: string, endDate: string): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    totalCommissions: number;
    netProfit: number;
    profitMargin: number;
  }> {
    const response = await apiClient.get<any>(
      `/analytics/profit-loss?startDate=${startDate}&endDate=${endDate}`
    );
    
    return {
      totalRevenue: response.revenue?.total || 0,
      totalExpenses: response.costs?.expenses?.total || 0,
      totalCommissions: response.costs?.commissions || 0,
      netProfit: response.profit?.net || 0,
      profitMargin: response.profit?.profitMargin || 0,
    };
  },
};