// Central export point for all custom hooks

// Base hooks
export { useApi } from './useApi';
export { useForm } from './useForm';

// Data hooks
export { useEmployees } from './useEmployees';
export { useServices } from './useServices';
export { useTransactions, useDailySummary } from './useTransactions';
export { useExpenses, useExpenseSummary } from './useExpenses';
export { usePayroll, usePayrollCalculator } from './usePayroll';
export { useDeductions, usePendingDeductions } from './useDeductions';

// Dashboard hooks
export {
  useDashboardStats,
  useSalesChart,
  useTopPerformers,
  useServicePerformance,
  useProfitLoss,
} from './useDashboard';