// Hook for employee deduction operations

import { useState, useEffect, useCallback } from 'react';
import { deductionService } from '@/services/deductionService';
import {
  EmployeeDeduction,
  CreateDeductionDto,
  UpdateDeductionDto,
  DeductionFilters,
} from '@/services/deductionService';
import { useApi } from './useApi';

export function useDeductions(filters?: DeductionFilters) {
  const [deductions, setDeductions] = useState<EmployeeDeduction[]>([]);
  const { loading, error, execute } = useApi<EmployeeDeduction[]>();
  const singleApi = useApi<EmployeeDeduction>();

  // Stringify filters for stable dependency
  const filtersKey = JSON.stringify(filters);

  const fetchDeductions = useCallback(async () => {
    const result = await execute(() => deductionService.getAll(filters));
    if (result) {
      setDeductions(result);
    }
  }, [execute, filtersKey]);

  useEffect(() => {
    fetchDeductions();
  }, [fetchDeductions]);

  const createDeduction = async (data: CreateDeductionDto): Promise<EmployeeDeduction | null> => {
    const result = await singleApi.execute(() => deductionService.create(data));
    if (result) {
      setDeductions((prev) => [result, ...prev]);
    }
    return result;
  };

  const updateDeduction = async (id: string, data: UpdateDeductionDto): Promise<EmployeeDeduction | null> => {
    const result = await singleApi.execute(() => deductionService.update(id, data));
    if (result) {
      setDeductions((prev) => prev.map((d) => (d.id === id ? result : d)));
    }
    return result;
  };

  const deleteDeduction = async (id: string): Promise<boolean> => {
    try {
      await deductionService.delete(id);
      setDeductions((prev) => prev.filter((d) => d.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  return {
    deductions,
    loading: loading || singleApi.loading,
    error: error || singleApi.error,
    refetch: fetchDeductions,
    createDeduction,
    updateDeduction,
    deleteDeduction,
  };
}

// Specialized hook for pending deductions of a specific employee
export function usePendingDeductions(employeeId: string) {
  const { data, loading, error, execute } = useApi<{
    total: number;
    count: number;
    deductions: EmployeeDeduction[];
  }>();

  const fetchPending = useCallback(async () => {
    if (!employeeId) return;
    await execute(() => deductionService.getPendingTotal(employeeId));
  }, [execute, employeeId]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return {
    pendingTotal: data?.total ?? 0,
    pendingCount: data?.count ?? 0,
    pendingDeductions: data?.deductions ?? [],
    loading,
    error,
    refetch: fetchPending,
  };
}