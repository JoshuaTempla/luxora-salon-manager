// Batch entry form — log multiple business expenses at once

import React, { useState } from 'react';
import { Input, Select, Button, ModalFooter, Alert } from '@/components/common';
import { CreateExpenseDto, ExpenseCategory, EXPENSE_CATEGORY_LABELS } from '@/types';
import { getToday, formatCurrency } from '@/utils';

interface ExpenseRow {
  id: number;
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE';
  isRecurring: boolean;
}

interface BatchExpenseFormProps {
  onSubmit: (expenses: CreateExpenseDto[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

let rowCounter = 0;
const newRow = (): ExpenseRow => ({
  id: ++rowCounter,
  description: '',
  amount: 0,
  category: 'VARIABLE',
  isRecurring: false,
});

const categoryOptions = [
  { label: EXPENSE_CATEGORY_LABELS[ExpenseCategory.VARIABLE], value: 'VARIABLE' },
  { label: EXPENSE_CATEGORY_LABELS[ExpenseCategory.FIXED], value: 'FIXED' },
];

export function BatchExpenseForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BatchExpenseFormProps) {
  const [date, setDate] = useState(getToday());
  const [dateError, setDateError] = useState('');
  const [rows, setRows] = useState<ExpenseRow[]>([newRow()]);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  // ── Row handlers ──────────────────────────────────────────────────────────

  const updateRow = (id: number, patch: Partial<ExpenseRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleAddRow = () => setRows((prev) => [...prev, newRow()]);

  const handleRemoveRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // ── Totals ────────────────────────────────────────────────────────────────

  const filledRows = rows.filter((r) => r.description.trim() && r.amount > 0);
  const total = filledRows.reduce((sum, r) => sum + r.amount, 0);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    let valid = true;

    if (!date) {
      setDateError('Please select a date');
      valid = false;
    } else {
      setDateError('');
    }

    const newRowErrors: Record<number, string> = {};
    rows.forEach((row) => {
      if (!row.description.trim()) {
        newRowErrors[row.id] = 'Description is required';
        valid = false;
      } else if (row.amount <= 0) {
        newRowErrors[row.id] = 'Amount must be greater than ₱0';
        valid = false;
      }
    });
    setRowErrors(newRowErrors);

    if (!valid) return;

    const expenses: CreateExpenseDto[] = rows.map((row) => ({
      description: row.description.trim(),
      amount: row.amount,
      category: row.category,
      isRecurring: row.isRecurring,
      date,
    }));

    await onSubmit(expenses);
  };

  return (
    <div className="space-y-5">
      {/* Shared date for all rows */}
      <Input
        label="Expense Date"
        type="date"
        value={date}
        onChange={(e) => { setDate(e.target.value); setDateError(''); }}
        error={dateError || undefined}
        required
        fullWidth
        helperText="Defaults to today — change to backdate all entries in this batch"
      />

      {/* Row headers */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
          <span className="col-span-4">Description</span>
          <span className="col-span-2">Amount (₱)</span>
          <span className="col-span-3">Category</span>
          <span className="col-span-2">Recurring</span>
          <span className="col-span-1" />
        </div>

        {rows.map((row) => (
          <div key={row.id} className="space-y-1">
            <div className="grid grid-cols-12 gap-2 items-start">
              {/* Description */}
              <div className="col-span-4">
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateRow(row.id, { description: e.target.value })}
                  placeholder="e.g., Electricity bill"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    rowErrors[row.id] && !row.description.trim() ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
              </div>

              {/* Amount */}
              <div className="col-span-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.amount || ''}
                  onChange={(e) => updateRow(row.id, { amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    rowErrors[row.id] && row.description.trim() ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
              </div>

              {/* Category */}
              <div className="col-span-3">
                <select
                  value={row.category}
                  onChange={(e) => updateRow(row.id, { category: e.target.value as 'FIXED' | 'VARIABLE' })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Recurring checkbox */}
              <div className="col-span-2 flex items-center justify-center pt-2">
                <input
                  type="checkbox"
                  checked={row.isRecurring}
                  onChange={(e) => updateRow(row.id, { isRecurring: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600"
                />
              </div>

              {/* Remove */}
              <div className="col-span-1 flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => handleRemoveRow(row.id)}
                  disabled={rows.length === 1}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {rowErrors[row.id] && (
              <p className="text-xs text-red-500 pl-1">{rowErrors[row.id]}</p>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={handleAddRow} fullWidth>
        + Add Another Expense
      </Button>

      {/* Running total */}
      {filledRows.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <p className="text-gray-500 text-xs mb-1">Entries</p>
              <p className="font-bold text-gray-900">{filledRows.length}</p>
            </div>
            <div className="text-center border-x border-blue-200">
              <p className="text-gray-500 text-xs mb-1">Fixed</p>
              <p className="font-bold text-gray-900">
                {formatCurrency(filledRows.filter(r => r.category === 'FIXED').reduce((s, r) => s + r.amount, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs mb-1">Total</p>
              <p className="font-bold text-blue-600">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>
      )}

      <ModalFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={isSubmitting || rows.length === 0}
        >
          Save {filledRows.length > 0 ? `${filledRows.length} Expense${filledRows.length !== 1 ? 's' : ''}` : 'Expenses'}
        </Button>
      </ModalFooter>
    </div>
  );
}