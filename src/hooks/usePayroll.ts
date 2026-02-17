// src/hooks/usePayroll.ts
// Hook for payroll-related operations

import { useState, useEffect, useCallback } from 'react';
import { payrollService } from '@/services/payrollService';
import { Payroll, CreatePayrollDto, UpdatePayrollDto, PayrollFilters } from '@/types';
import { useApi } from './useApi';

export function usePayroll(filters?: PayrollFilters) {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const { loading, error, execute } = useApi<Payroll[]>();
  const singleApi = useApi<Payroll>();

  const fetchPayrolls = useCallback(async () => {
    const result = await execute(() => payrollService.getAll(filters));
    if (result) {
      setPayrolls(result);
    }
  }, [execute, filters]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const createPayroll = async (data: CreatePayrollDto): Promise<Payroll | null> => {
    const result = await singleApi.execute(() => payrollService.create(data));
    if (result) {
      setPayrolls((prev) => [result, ...prev]);
    }
    return result;
  };

  const updatePayroll = async (id: string, data: UpdatePayrollDto): Promise<Payroll | null> => {
    const result = await singleApi.execute(() => payrollService.update(id, data));
    if (result) {
      setPayrolls((prev) => prev.map((pay) => (pay.id === id ? result : pay)));
    }
    return result;
  };

  const deletePayroll = async (id: string): Promise<boolean> => {
    try {
      await payrollService.delete(id);
      setPayrolls((prev) => prev.filter((pay) => pay.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  return {
    payrolls,
    loading: loading || singleApi.loading,
    error: error || singleApi.error,
    refetch: fetchPayrolls,
    createPayroll,
    updatePayroll,
    deletePayroll,
  };
}

// Hook for payroll calculation — type must match payrollService.calculatePayroll return shape
export function usePayrollCalculator() {
  const { data, loading, error, execute } = useApi<{
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
  }>();

  const calculatePayroll = useCallback(
    async (
      employeeId: string,
      startDate: string,
      endDate: string,
      hoursWorked: number,
      taxRate: number
    ) => {
      return await execute(() =>
        payrollService.calculatePayroll(employeeId, startDate, endDate, hoursWorked, taxRate)
      );
    },
    [execute]
  );

  return {
    calculation: data,
    loading,
    error,
    calculatePayroll,
  };
}