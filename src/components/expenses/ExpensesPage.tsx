// Main page for managing expenses

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  Button,
  Modal,
  LoadingSpinner,
  ErrorMessage,
  Alert,
  Select,
  Input,
} from '@/components/common';
import { ExpenseList } from './ExpenseList';
import { ExpenseForm } from './ExpenseForm';
import { useExpenses, useExpenseSummary } from '@/hooks';
import { Expense, CreateExpenseDto, ExpenseCategory, EXPENSE_CATEGORY_LABELS } from '@/types';
import { formatCurrency, getDateRange, getToday } from '@/utils';
import { DATE_RANGE_PRESETS } from '@/types';

export function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [dateRange, setDateRange] = useState<string>(DATE_RANGE_PRESETS.THIS_MONTH);
  const [customStartDate, setCustomStartDate] = useState(getToday());
  const [customEndDate, setCustomEndDate] = useState(getToday());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [recurringFilter, setRecurringFilter] = useState('');

  // Get filters
  const filters = useMemo(() => {
    const baseFilters: any = {};

    // Date range
    if (dateRange === 'custom') {
      baseFilters.startDate = customStartDate;
      baseFilters.endDate = customEndDate;
    } else {
      const range = getDateRange(dateRange);
      baseFilters.startDate = range.startDate;
      baseFilters.endDate = range.endDate;
    }

    // Category filter
    if (categoryFilter) {
      baseFilters.category = categoryFilter as ExpenseCategory;
    }

    // Recurring filter
    if (recurringFilter) {
      baseFilters.isRecurring = recurringFilter === 'true';
    }

    return baseFilters;
  }, [dateRange, customStartDate, customEndDate, categoryFilter, recurringFilter]);

  const {
    expenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses(filters);

  // Get summary for current filters
  const { summary } = useExpenseSummary(
    filters.startDate || getToday(),
    filters.endDate || getToday()
  );

  const handleOpenModal = (expense?: Expense) => {
    setSelectedExpense(expense || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExpense(null);
  };

  const handleSubmit = async (data: CreateExpenseDto) => {
    try {
      if (selectedExpense) {
        await updateExpense(selectedExpense.id, data);
        setSuccessMessage('Expense updated successfully!');
      } else {
        await createExpense(data);
        setSuccessMessage('Expense created successfully!');
      }
      handleCloseModal();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save expense:', err);
    }
  };

  const handleDelete = async (expense: Expense) => {
    try {
      await deleteExpense(expense.id);
      setSuccessMessage('Expense deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const dateRangeOptions = [
    { label: 'Today', value: DATE_RANGE_PRESETS.TODAY },
    { label: 'This Week', value: DATE_RANGE_PRESETS.THIS_WEEK },
    { label: 'This Month', value: DATE_RANGE_PRESETS.THIS_MONTH },
    { label: 'Last Month', value: DATE_RANGE_PRESETS.LAST_MONTH },
    { label: 'This Year', value: DATE_RANGE_PRESETS.THIS_YEAR },
    { label: 'Custom Range', value: 'custom' },
  ];

  const categoryOptions = [
    { label: 'All Categories', value: '' },
    { label: EXPENSE_CATEGORY_LABELS[ExpenseCategory.FIXED], value: ExpenseCategory.FIXED },
    { label: EXPENSE_CATEGORY_LABELS[ExpenseCategory.VARIABLE], value: ExpenseCategory.VARIABLE },
  ];

  const recurringOptions = [
    { label: 'All Expenses', value: '' },
    { label: 'Recurring Only', value: 'true' },
    { label: 'One-time Only', value: 'false' },
  ];

  if (loading && expenses.length === 0) {
    return <LoadingSpinner fullScreen message="Loading expenses..." />;
  }

  if (error && expenses.length === 0) {
    return <ErrorMessage message={error} fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Track and manage business expenses</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Add Expense
        </Button>
      </div>

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="md" hover>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600">Total Expenses</span>
              <span className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary.total)}
              </span>
            </div>
          </Card>

          <Card padding="md" hover>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600">Fixed Expenses</span>
              <span className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(summary.totalFixed)}
              </span>
            </div>
          </Card>

          <Card padding="md" hover>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600">Variable Expenses</span>
              <span className="text-2xl font-bold text-yellow-600 mt-1">
                {formatCurrency(summary.totalVariable)}
              </span>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader title="Filters" subtitle="Filter expenses by date, category, or type" />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Select
            label="Date Range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={dateRangeOptions}
            fullWidth
          />

          {dateRange === 'custom' && (
            <>
              <Input
                label="Start Date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                fullWidth
              />
              <Input
                label="End Date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                fullWidth
              />
            </>
          )}

          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={categoryOptions}
            fullWidth
          />

          <Select
            label="Type"
            value={recurringFilter}
            onChange={(e) => setRecurringFilter(e.target.value)}
            options={recurringOptions}
            fullWidth
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="All Expenses"
          subtitle={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`}
        />

        {loading ? (
          <LoadingSpinner message="Updating..." />
        ) : (
          <ExpenseList
            expenses={expenses}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedExpense ? 'Edit Expense' : 'Create New Expense'}
        size="lg"
      >
        <ExpenseForm
          expense={selectedExpense}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSubmitting={loading}
        />
      </Modal>
    </div>
  );
}