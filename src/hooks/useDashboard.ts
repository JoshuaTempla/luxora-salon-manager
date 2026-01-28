// src/hooks/useDashboard.ts
// Hook for dashboard and analytics

import { useEffect, useCallback } from 'react';
import { dashboardService } from '@/services/dashboardService';
import {
  DashboardStats,
  SalesChart,
  TopPerformer,
  ServicePerformance,
} from '@/types';
import { useApi } from './useApi';

export function useDashboardStats() {
  const { data, loading, error, execute } = useApi<DashboardStats>();

  const fetchStats = useCallback(async () => {
    await execute(() => dashboardService.getStats());
  }, [execute]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats: data,
    loading,
    error,
    refetch: fetchStats,
  };
}

export function useSalesChart(startDate: string, endDate: string) {
  const { data, loading, error, execute } = useApi<SalesChart[]>();

  const fetchChart = useCallback(async () => {
    await execute(() => dashboardService.getSalesChart(startDate, endDate));
  }, [execute, startDate, endDate]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  return {
    chartData: data,
    loading,
    error,
    refetch: fetchChart,
  };
}

export function useTopPerformers(startDate: string, endDate: string, limit = 5) {
  const { data, loading, error, execute } = useApi<TopPerformer[]>();

  const fetchTopPerformers = useCallback(async () => {
    await execute(() => dashboardService.getTopPerformers(startDate, endDate, limit));
  }, [execute, startDate, endDate, limit]);

  useEffect(() => {
    fetchTopPerformers();
  }, [fetchTopPerformers]);

  return {
    topPerformers: data,
    loading,
    error,
    refetch: fetchTopPerformers,
  };
}

export function useServicePerformance(startDate: string, endDate: string) {
  const { data, loading, error, execute } = useApi<ServicePerformance[]>();

  const fetchPerformance = useCallback(async () => {
    await execute(() => dashboardService.getServicePerformance(startDate, endDate));
  }, [execute, startDate, endDate]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return {
    servicePerformance: data,
    loading,
    error,
    refetch: fetchPerformance,
  };
}

export function useProfitLoss(startDate: string, endDate: string) {
  const { data, loading, error, execute } = useApi<{
    totalRevenue: number;
    totalExpenses: number;
    totalCommissions: number;
    netProfit: number;
    profitMargin: number;
  }>();

  const fetchProfitLoss = useCallback(async () => {
    await execute(() => dashboardService.getProfitLoss(startDate, endDate));
  }, [execute, startDate, endDate]);

  useEffect(() => {
    fetchProfitLoss();
  }, [fetchProfitLoss]);

  return {
    profitLoss: data,
    loading,
    error,
    refetch: fetchProfitLoss,
  };
}