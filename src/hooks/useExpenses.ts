// Hook for expense-related operations

import { useState, useEffect, useCallback } from 'react';
import { expenseService } from '@/services/expenseService';
import { Expense, CreateExpenseDto, UpdateExpenseDto, ExpenseFilters } from '@/types';
import { useApi } from './useApi';

export function useExpenses(filters?: ExpenseFilters) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { loading, error, execute } = useApi<Expense[]>();
  const singleApi = useApi<Expense>();

  const fetchExpenses = useCallback(async () => {
    const result = await execute(() => expenseService.getAll(filters));
    if (result) setExpenses(result);
  }, [execute, filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = async (data: CreateExpenseDto): Promise<Expense | null> => {
    const result = await singleApi.execute(() => expenseService.create(data));
    if (result) setExpenses((prev) => [result, ...prev]);
    return result;
  };

  const bulkCreateExpenses = async (data: CreateExpenseDto[]): Promise<boolean> => {
    try {
      await expenseService.bulkCreate(data);
      await fetchExpenses();
      return true;
    } catch {
      return false;
    }
  };

  const updateExpense = async (id: string, data: UpdateExpenseDto): Promise<Expense | null> => {
    const result = await singleApi.execute(() => expenseService.update(id, data));
    if (result) setExpenses((prev) => prev.map((exp) => (exp.id === id ? result : exp)));
    return result;
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
      await expenseService.delete(id);
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  return {
    expenses,
    loading: loading || singleApi.loading,
    error: error || singleApi.error,
    refetch: fetchExpenses,
    createExpense,
    bulkCreateExpenses,
    updateExpense,
    deleteExpense,
  };
}

export function useExpenseSummary(startDate: string, endDate: string) {
  const { data, loading, error, execute } = useApi<{
    totalFixed: number;
    totalVariable: number;
    total: number;
    breakdown: Array<{ category: string; total: number }>;
  }>();

  const fetchSummary = useCallback(async () => {
    await execute(() => expenseService.getSummary(startDate, endDate));
  }, [execute, startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary: data, loading, error, refetch: fetchSummary };
}