// Hook for transaction-related operations

import { useState, useEffect, useCallback } from 'react';
import { transactionService } from '@/services/transactionService';
import { Transaction, CreateTransactionDto, TransactionFilters } from '@/types';
import { useApi } from './useApi';

export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { loading, error, execute } = useApi<Transaction[]>();
  const singleApi = useApi<Transaction>(); // Separate API hook for single transaction operations

  // Stringify filters to create stable dependency
  const filtersKey = JSON.stringify(filters);

  const fetchTransactions = useCallback(async () => {
    const result = await execute(() => transactionService.getAll(filters));
    if (result) {
      setTransactions(result);
    }
  }, [execute, filtersKey]); // Use filtersKey instead of filters

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (data: CreateTransactionDto): Promise<Transaction | null> => {
    const result = await singleApi.execute(() => transactionService.create(data));
    if (result) {
      setTransactions((prev) => [result, ...prev]);
    }
    return result;
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      await transactionService.delete(id);
      setTransactions((prev) => prev.filter((txn) => txn.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  const bulkCreateTransactions = async (data: CreateTransactionDto[]): Promise<boolean> => {
    try {
      await transactionService.bulkCreate(data);
      await fetchTransactions();
      return true;
    } catch {
      return false;
    }
  };

  return {
    transactions,
    loading: loading || singleApi.loading,
    error: error || singleApi.error,
    refetch: fetchTransactions,
    createTransaction,
    deleteTransaction,
    bulkCreateTransactions,
  };
}

// Specialized hook for daily summary
export function useDailySummary(date?: string) {
  const { data, loading, error, execute } = useApi<{
    totalSales: number;
    totalCommissions: number;
    transactionCount: number;
    transactions: Transaction[];
  }>();

  const fetchSummary = useCallback(async () => {
    await execute(() => transactionService.getDailySummary(date));
  }, [execute, date]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary: data,
    loading,
    error,
    refetch: fetchSummary,
  };
}