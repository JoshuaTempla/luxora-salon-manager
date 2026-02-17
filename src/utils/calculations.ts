// Business logic calculations

import { CommissionType } from '@/types';

/**
 * Calculate commission amount based on commission type
 * - PERCENTAGE: commission = price * rate / 100
 * - FIXED: commission = flat rate amount (ignores price)
 */
export function calculateCommission(
  price: number,
  commissionRate: number,
  commissionType: CommissionType = 'PERCENTAGE'
): number {
  if (commissionType === 'FIXED') {
    return commissionRate;
  }
  return (price * commissionRate) / 100;
}

/**
 * Calculate tax amount
 */
export function calculateTax(amount: number, taxRate: number): number {
  return amount * taxRate;
}

/**
 * Calculate net salary (gross - tax)
 */
export function calculateNetSalary(grossSalary: number, taxDeductions: number): number {
  return grossSalary - taxDeductions;
}

/**
 * Calculate gross salary (hourly rate * hours + commissions)
 */
export function calculateGrossSalary(
  hourlyRate: number,
  hoursWorked: number,
  commissionsEarned: number
): number {
  return hourlyRate * hoursWorked + commissionsEarned;
}

/**
 * Calculate profit (revenue - expenses - commissions)
 */
export function calculateProfit(
  revenue: number,
  expenses: number,
  commissions: number
): number {
  return revenue - expenses - commissions;
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(profit: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (profit / revenue) * 100;
}

/**
 * Calculate average transaction value
 */
export function calculateAverageTransaction(
  totalRevenue: number,
  transactionCount: number
): number {
  if (transactionCount === 0) return 0;
  return totalRevenue / transactionCount;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate total from array of numbers
 */
export function calculateTotal(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return calculateTotal(numbers) / numbers.length;
}