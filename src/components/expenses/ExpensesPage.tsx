// src/components/expenses/ExpensesPage.tsx
// Expenses page with tabs: Business Expenses | Employee Deductions

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  Button,
  Modal,
  LoadingSpinner,
  Alert,
  Select,
  Input,
} from '@/components/common';
import { ExpenseList } from './ExpenseList';
import { ExpenseForm } from './ExpenseForm';
import { BatchExpenseForm } from './BatchExpenseForm';
import { DeductionList } from './DeductionList';
import { DeductionForm } from './DeductionForm';
import { BatchDeductionForm } from './BatchDeductionForm';
import { useExpenses, useExpenseSummary, useDeductions, useEmployees } from '@/hooks';
import {
  Expense,
  CreateExpenseDto,
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
  EmployeeDeduction,
  CreateDeductionDto,
} from '@/types';
import { formatCurrency, getDateRange, getToday } from '@/utils';
import { DATE_RANGE_PRESETS } from '@/types';

type ActiveTab = 'business' | 'deductions';

export function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('business');

  // ── Business Expense state ──────────────────────────────────────────────
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isBatchExpenseModalOpen, setIsBatchExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseSuccess, setExpenseSuccess] = useState('');
  const [dateRange, setDateRange] = useState<string>(DATE_RANGE_PRESETS.THIS_MONTH);
  const [customStartDate, setCustomStartDate] = useState(getToday());
  const [customEndDate, setCustomEndDate] = useState(getToday());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [recurringFilter, setRecurringFilter] = useState('');

  // ── Deduction state ─────────────────────────────────────────────────────
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
  const [isBatchDeductionModalOpen, setIsBatchDeductionModalOpen] = useState(false);
  const [deductionSuccess, setDeductionSuccess] = useState('');
  const [deductionEmployeeFilter, setDeductionEmployeeFilter] = useState('');
  const [deductionStatusFilter, setDeductionStatusFilter] = useState('');

  // ── Shared data ─────────────────────────────────────────────────────────
  const { employees } = useEmployees();

  // ── Business expense filters ────────────────────────────────────────────
  const expenseFilters = useMemo(() => {
    const f: any = {};
    if (dateRange === 'custom') {
      f.startDate = customStartDate;
      f.endDate = customEndDate;
    } else {
      const range = getDateRange(dateRange);
      f.startDate = range.startDate;
      f.endDate = range.endDate;
    }
    if (categoryFilter) f.category = categoryFilter as ExpenseCategory;
    if (recurringFilter) f.isRecurring = recurringFilter === 'true';
    return f;
  }, [dateRange, customStartDate, customEndDate, categoryFilter, recurringFilter]);

  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
    createExpense,
    bulkCreateExpenses,
    updateExpense,
    deleteExpense,
  } = useExpenses(expenseFilters);

  const { summary } = useExpenseSummary(
    expenseFilters.startDate || getToday(),
    expenseFilters.endDate || getToday()
  );

  // ── Deduction filters ───────────────────────────────────────────────────
  const deductionFilters = useMemo(() => {
    const f: any = {};
    if (deductionEmployeeFilter) f.employeeId = deductionEmployeeFilter;
    if (deductionStatusFilter !== '') f.isDeducted = deductionStatusFilter === 'true';
    return f;
  }, [deductionEmployeeFilter, deductionStatusFilter]);

  const {
    deductions,
    loading: deductionsLoading,
    error: deductionsError,
    createDeduction,
    bulkCreateDeductions,
    deleteDeduction,
  } = useDeductions(deductionFilters);

  // ── Business expense handlers ───────────────────────────────────────────
  const handleOpenExpenseModal = (expense?: Expense) => {
    setSelectedExpense(expense || null);
    setIsExpenseModalOpen(true);
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setSelectedExpense(null);
  };

  const handleExpenseSubmit = async (data: CreateExpenseDto) => {
    try {
      if (selectedExpense) {
        await updateExpense(selectedExpense.id, data);
        setExpenseSuccess('Expense updated successfully!');
      } else {
        await createExpense(data);
        setExpenseSuccess('Expense created successfully!');
      }
      handleCloseExpenseModal();
      setTimeout(() => setExpenseSuccess(''), 3000);
    } catch {
      // error handled by hook
    }
  };

  const handleBatchExpenseSubmit = async (data: CreateExpenseDto[]) => {
    const ok = await bulkCreateExpenses(data);
    if (ok) {
      setIsBatchExpenseModalOpen(false);
      setExpenseSuccess(`${data.length} expense${data.length !== 1 ? 's' : ''} added successfully!`);
      setTimeout(() => setExpenseSuccess(''), 3000);
    }
  };

  const handleExpenseDelete = async (expense: Expense) => {
    await deleteExpense(expense.id);
    setExpenseSuccess('Expense deleted successfully!');
    setTimeout(() => setExpenseSuccess(''), 3000);
  };

  // ── Deduction handlers ──────────────────────────────────────────────────
  const handleDeductionSubmit = async (data: CreateDeductionDto) => {
    try {
      await createDeduction(data);
      setDeductionSuccess('Deduction added successfully!');
      setIsDeductionModalOpen(false);
      setTimeout(() => setDeductionSuccess(''), 3000);
    } catch {
      // error handled by hook
    }
  };

  const handleBatchDeductionSubmit = async (data: CreateDeductionDto[]) => {
    const ok = await bulkCreateDeductions(data);
    if (ok) {
      setIsBatchDeductionModalOpen(false);
      setDeductionSuccess(`${data.length} deduction${data.length !== 1 ? 's' : ''} added successfully!`);
      setTimeout(() => setDeductionSuccess(''), 3000);
    }
  };

  const handleDeductionDelete = async (deduction: EmployeeDeduction) => {
    await deleteDeduction(deduction.id);
    setDeductionSuccess('Deduction deleted successfully!');
    setTimeout(() => setDeductionSuccess(''), 3000);
  };

  // ── Shared options ──────────────────────────────────────────────────────
  const dateRangeOptions = [
    { label: 'Today', value: DATE_RANGE_PRESETS.TODAY },
    { label: 'This Week', value: DATE_RANGE_PRESETS.THIS_WEEK },
    { label: 'This Month', value: DATE_RANGE_PRESETS.THIS_MONTH },
    { label: 'Last Month', value: DATE_RANGE_PRESETS.LAST_MONTH },
    { label: 'This Year', value: DATE_RANGE_PRESETS.THIS_YEAR },
    { label: 'Custom', value: 'custom' },
  ];

  const categoryOptions = [
    { label: 'All Categories', value: '' },
    { label: EXPENSE_CATEGORY_LABELS[ExpenseCategory.FIXED], value: ExpenseCategory.FIXED },
    { label: EXPENSE_CATEGORY_LABELS[ExpenseCategory.VARIABLE], value: ExpenseCategory.VARIABLE },
  ];

  const recurringOptions = [
    { label: 'All Types', value: '' },
    { label: 'Recurring', value: 'true' },
    { label: 'One-time', value: 'false' },
  ];

  const employeeOptions = [
    { label: 'All Employees', value: '' },
    ...employees.map((e) => ({
      label: `${e.firstName} ${e.lastName}`,
      value: e.id,
    })),
  ];

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'false' },
    { label: 'Deducted', value: 'true' },
  ];

  const pendingDeductions = deductions.filter((d) => !d.isDeducted);
  const pendingTotal = pendingDeductions.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Track business expenses and employee deductions</p>
        </div>

        {activeTab === 'business' ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBatchExpenseModalOpen(true)}>
              Batch Entry
            </Button>
            <Button variant="primary" onClick={() => handleOpenExpenseModal()}>
              + Add Expense
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBatchDeductionModalOpen(true)}>
              Batch Entry
            </Button>
            <Button variant="primary" onClick={() => setIsDeductionModalOpen(true)}>
              + Add Deduction
            </Button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit bg-white">
        <button
          onClick={() => setActiveTab('business')}
          className={`px-6 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'business'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Business Expenses
        </button>
        <button
          onClick={() => setActiveTab('deductions')}
          className={`px-6 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'deductions'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Employee Deductions
          {pendingDeductions.length > 0 && (
            <span className="ml-2 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
              {pendingDeductions.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Business Expenses Tab ── */}
      {activeTab === 'business' && (
        <>
          {expenseSuccess && <Alert variant="success">{expenseSuccess}</Alert>}
          {expensesError && <Alert variant="danger">{expensesError}</Alert>}
          {/* Filters */}
          <Card>
            <CardHeader title="Filters" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              title="Business Expenses"
              subtitle={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`}
            />
            {expensesLoading ? (
              <LoadingSpinner message="Loading..." />
            ) : (
              <ExpenseList
                expenses={expenses}
                onEdit={handleOpenExpenseModal}
                onDelete={handleExpenseDelete}
              />
            )}
          </Card>
        </>
      )}

      {/* ── Employee Deductions Tab ── */}
      {activeTab === 'deductions' && (
        <>
          {deductionSuccess && <Alert variant="success">{deductionSuccess}</Alert>}
          {deductionsError && <Alert variant="danger">{deductionsError}</Alert>}

          {pendingDeductions.length > 0 && (
            <Alert variant="warning">
              {pendingDeductions.length} pending deduction{pendingDeductions.length !== 1 ? 's' : ''} totalling {formatCurrency(pendingTotal)} — will be applied on next payroll.
            </Alert>
          )}

          {/* Filters */}
          <Card>
            <CardHeader title="Filters" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Employee"
                value={deductionEmployeeFilter}
                onChange={(e) => setDeductionEmployeeFilter(e.target.value)}
                options={employeeOptions}
                fullWidth
              />
              <Select
                label="Status"
                value={deductionStatusFilter}
                onChange={(e) => setDeductionStatusFilter(e.target.value)}
                options={statusOptions}
                fullWidth
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Employee Deductions"
              subtitle={`${deductions.length} deduction${deductions.length !== 1 ? 's' : ''}`}
            />
            {deductionsLoading ? (
              <LoadingSpinner message="Loading..." />
            ) : (
              <DeductionList
                deductions={deductions}
                onDelete={handleDeductionDelete}
              />
            )}
          </Card>
        </>
      )}

      {/* ── Modals ── */}

      {/* Single expense */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        title={selectedExpense ? 'Edit Expense' : 'Add Business Expense'}
        size="lg"
      >
        <ExpenseForm
          expense={selectedExpense}
          onSubmit={handleExpenseSubmit}
          onCancel={handleCloseExpenseModal}
          isSubmitting={expensesLoading}
        />
      </Modal>

      {/* Batch expenses */}
      <Modal
        isOpen={isBatchExpenseModalOpen}
        onClose={() => setIsBatchExpenseModalOpen(false)}
        title="Batch Expense Entry"
        size="xl"
      >
        <BatchExpenseForm
          onSubmit={handleBatchExpenseSubmit}
          onCancel={() => setIsBatchExpenseModalOpen(false)}
          isSubmitting={expensesLoading}
        />
      </Modal>

      {/* Single deduction */}
      <Modal
        isOpen={isDeductionModalOpen}
        onClose={() => setIsDeductionModalOpen(false)}
        title="Add Employee Deduction"
        size="lg"
      >
        <DeductionForm
          onSubmit={handleDeductionSubmit}
          onCancel={() => setIsDeductionModalOpen(false)}
          isSubmitting={deductionsLoading}
        />
      </Modal>

      {/* Batch deductions */}
      <Modal
        isOpen={isBatchDeductionModalOpen}
        onClose={() => setIsBatchDeductionModalOpen(false)}
        title="Batch Deduction Entry"
        size="xl"
      >
        <BatchDeductionForm
          onSubmit={handleBatchDeductionSubmit}
          onCancel={() => setIsBatchDeductionModalOpen(false)}
          isSubmitting={deductionsLoading}
        />
      </Modal>
    </div>
  );
}