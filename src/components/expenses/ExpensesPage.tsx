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
import { DeductionList } from './DeductionList';
import { DeductionForm } from './DeductionForm';
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
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseSuccess, setExpenseSuccess] = useState('');
  const [dateRange, setDateRange] = useState<string>(DATE_RANGE_PRESETS.THIS_MONTH);
  const [customStartDate, setCustomStartDate] = useState(getToday());
  const [customEndDate, setCustomEndDate] = useState(getToday());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [recurringFilter, setRecurringFilter] = useState('');

  // ── Deduction state ─────────────────────────────────────────────────────
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
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

  // Summary stats for deductions tab
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
          <Button variant="primary" onClick={() => handleOpenExpenseModal()}>
            + Add Expense
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setIsDeductionModalOpen(true)}>
            + Add Deduction
          </Button>
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
          className={`px-6 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'deductions'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Employee Deductions
          {pendingDeductions.length > 0 && activeTab !== 'deductions' && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
              {pendingDeductions.length}
            </span>
          )}
        </button>
      </div>

      {/* ── BUSINESS EXPENSES TAB ── */}
      {activeTab === 'business' && (
        <>
          {expenseSuccess && <Alert variant="success">{expenseSuccess}</Alert>}

          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.total ?? 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Fixed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.totalFixed ?? 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Variable</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.totalVariable ?? 0)}
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader title="Filters" />
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
                  <Input label="Start Date" type="date" value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)} fullWidth />
                  <Input label="End Date" type="date" value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)} fullWidth />
                </>
              )}
              <Select label="Category" value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categoryOptions} fullWidth />
              <Select label="Type" value={recurringFilter}
                onChange={(e) => setRecurringFilter(e.target.value)}
                options={recurringOptions} fullWidth />
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

      {/* ── EMPLOYEE DEDUCTIONS TAB ── */}
      {activeTab === 'deductions' && (
        <>
          {deductionSuccess && <Alert variant="success">{deductionSuccess}</Alert>}

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Deductions Shown</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(deductions.reduce((s, d) => s + d.amount, 0))}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
              <p className="text-sm text-yellow-700">Pending (not yet deducted)</p>
              <p className="text-2xl font-bold text-yellow-800 mt-1">
                {formatCurrency(pendingTotal)}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                {pendingDeductions.length} deduction{pendingDeductions.length !== 1 ? 's' : ''} pending
              </p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <p className="text-sm text-green-700">Already Deducted</p>
              <p className="text-2xl font-bold text-green-800 mt-1">
                {formatCurrency(deductions.filter(d => d.isDeducted).reduce((s, d) => s + d.amount, 0))}
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader title="Filters" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              subtitle={`${deductions.length} record${deductions.length !== 1 ? 's' : ''}`}
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

      {/* Business Expense Modal */}
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

      {/* Deduction Modal */}
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
    </div>
  );
}