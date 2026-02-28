// Batch entry form — log multiple employee deductions at once

import React, { useState } from 'react';
import { Select, Button, ModalFooter, Alert } from '@/components/common';
import { Input } from '@/components/common';
import { useEmployees } from '@/hooks';
import { CreateDeductionDto, DeductionType, DEDUCTION_TYPE_LABELS } from '@/types';
import { getToday, formatCurrency } from '@/utils';

interface DeductionRow {
  id: number;
  employeeId: string;
  type: DeductionType;
  description: string;
  amount: number;
}

interface BatchDeductionFormProps {
  onSubmit: (deductions: CreateDeductionDto[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

let rowCounter = 0;
const newRow = (): DeductionRow => ({
  id: ++rowCounter,
  employeeId: '',
  type: 'CASH_ADVANCE',
  description: '',
  amount: 0,
});

const typeOptions = (Object.keys(DEDUCTION_TYPE_LABELS) as DeductionType[]).map((key) => ({
  label: DEDUCTION_TYPE_LABELS[key],
  value: key,
}));

export function BatchDeductionForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BatchDeductionFormProps) {
  const { employees } = useEmployees();
  const [date, setDate] = useState(getToday());
  const [dateError, setDateError] = useState('');
  const [rows, setRows] = useState<DeductionRow[]>([newRow()]);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  const activeEmployees = employees.filter((e) => e.isActive);
  const employeeOptions = [
    { label: 'Select employee…', value: '' },
    ...activeEmployees.map((e) => ({
      label: `${e.firstName} ${e.lastName} — ${e.position}`,
      value: e.id,
    })),
  ];

  // ── Row handlers ──────────────────────────────────────────────────────────

  const updateRow = (id: number, patch: Partial<DeductionRow>) => {
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

  const filledRows = rows.filter((r) => r.employeeId && r.description.trim() && r.amount > 0);
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
      if (!row.employeeId) {
        newRowErrors[row.id] = 'Select an employee';
        valid = false;
      } else if (!row.description.trim()) {
        newRowErrors[row.id] = 'Description is required';
        valid = false;
      } else if (row.amount <= 0) {
        newRowErrors[row.id] = 'Amount must be greater than ₱0';
        valid = false;
      }
    });
    setRowErrors(newRowErrors);

    if (!valid) return;

    const deductions: CreateDeductionDto[] = rows.map((row) => ({
      employeeId: row.employeeId,
      type: row.type,
      description: row.description.trim(),
      amount: row.amount,
      date,
    }));

    await onSubmit(deductions);
  };

  return (
    <div className="space-y-5">
      {activeEmployees.length === 0 && (
        <Alert variant="warning">No active employees found.</Alert>
      )}

      {/* Shared date for all rows */}
      <Input
        label="Deduction Date"
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
          <span className="col-span-3">Employee</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-4">Description</span>
          <span className="col-span-2">Amount (₱)</span>
          <span className="col-span-1" />
        </div>

        {rows.map((row) => (
          <div key={row.id} className="space-y-1">
            <div className="grid grid-cols-12 gap-2 items-start">
              {/* Employee */}
              <div className="col-span-3">
                <select
                  value={row.employeeId}
                  onChange={(e) => updateRow(row.id, { employeeId: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                    rowErrors[row.id] && !row.employeeId ? 'border-red-400' : 'border-gray-300'
                  }`}
                >
                  {employeeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="col-span-2">
                <select
                  value={row.type}
                  onChange={(e) => updateRow(row.id, { type: e.target.value as DeductionType })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="col-span-4">
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateRow(row.id, { description: e.target.value })}
                  placeholder="e.g., Cash advance Feb 10"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    rowErrors[row.id] && row.employeeId && !row.description.trim() ? 'border-red-400' : 'border-gray-300'
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
                    rowErrors[row.id] && row.employeeId && row.description.trim() ? 'border-red-400' : 'border-gray-300'
                  }`}
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
        + Add Another Deduction
      </Button>

      {/* Running total */}
      {filledRows.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <p className="text-gray-500 text-xs mb-1">Entries</p>
              <p className="font-bold text-gray-900">{filledRows.length}</p>
            </div>
            <div className="text-center border-x border-orange-200">
              <p className="text-gray-500 text-xs mb-1">Employees</p>
              <p className="font-bold text-gray-900">
                {new Set(filledRows.map((r) => r.employeeId)).size}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs mb-1">Total</p>
              <p className="font-bold text-orange-600">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
        All deductions will be automatically applied on each employee's next payroll.
      </div>

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
          Save {filledRows.length > 0 ? `${filledRows.length} Deduction${filledRows.length !== 1 ? 's' : ''}` : 'Deductions'}
        </Button>
      </ModalFooter>
    </div>
  );
}