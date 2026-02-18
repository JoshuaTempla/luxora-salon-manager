// Analytics and reporting operations

import { apiClient } from './api';

export interface CutoffSalesReport {
  period: string; // e.g., "2024-02-01 to 2024-02-15"
  startDate: string;
  endDate: string;
  grossSales: number;
  transactionCount: number;
  averageTransactionValue: number;
}

export interface NetSalesReport {
  period: string;
  startDate: string;
  endDate: string;
  grossSales: number;
  businessExpenses: number;
  totalGrossSalaries: number;
  netSales: number;
}

export interface SalesSummaryFilters {
  startDate: string;
  endDate: string;
}

export const analyticsService = {
  // Get gross sales for a specific period
  async getGrossSales(startDate: string, endDate: string): Promise<CutoffSalesReport> {
    return apiClient.get(`/analytics/gross-sales?startDate=${startDate}&endDate=${endDate}`);
  },

  // Get net sales (business owner perspective)
  async getNetSales(startDate: string, endDate: string): Promise<NetSalesReport> {
    return apiClient.get(`/analytics/net-sales?startDate=${startDate}&endDate=${endDate}`);
  },

  // Get both cutoff reports for a given month (1-15 and 16-end)
  async getMonthlyCutoffReports(year: number, month: number): Promise<{
    firstCutoff: CutoffSalesReport;
    secondCutoff: CutoffSalesReport;
    fullMonth: CutoffSalesReport;
  }> {
    return apiClient.get(`/analytics/monthly-cutoffs?year=${year}&month=${month}`);
  },

  // Get net sales breakdown for both cutoffs
  async getMonthlyNetSalesReports(year: number, month: number): Promise<{
    firstCutoff: NetSalesReport;
    secondCutoff: NetSalesReport;
    fullMonth: NetSalesReport;
  }> {
    return apiClient.get(`/analytics/monthly-net-sales?year=${year}&month=${month}`);
  },
};