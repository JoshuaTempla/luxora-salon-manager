// Batch entry form — log multiple services for one employee at once

import React, { useState, useCallback } from 'react';
import { Select, Input, Button, ModalFooter, Alert } from '@/components/common';
import { useEmployees, useServices } from '@/hooks';
import { CreateTransactionDto, Service } from '@/types';
import { formatCurrency, calculateCommission, getToday } from '@/utils';

interface BatchRow {
  id: number;
  serviceId: string;
  soldPrice: number;
  service: Service | null;
}

interface BatchTransactionFormProps {
  onSubmit: (transactions: CreateTransactionDto[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

let rowCounter = 0;
const newRow = (): BatchRow => ({ id: ++rowCounter, serviceId: '', soldPrice: 0, service: null });

export function BatchTransactionForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BatchTransactionFormProps) {
  const { employees } = useEmployees();
  const { services } = useServices();

  const [employeeId, setEmployeeId] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [date, setDate] = useState(getToday());
  const [dateError, setDateError] = useState('');
  const [rows, setRows] = useState<BatchRow[]>([newRow()]);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  const activeEmployees = employees.filter((e) => e.isActive);
  const activeServices = services.filter((s) => s.isActive);

  const employeeOptions = activeEmployees.map((emp) => ({
    label: `${emp.firstName} ${emp.lastName} — ${emp.position}`,
    value: emp.id,
  }));

  const serviceOptions = [
    { label: 'Select service…', value: '' },
    ...activeServices.map((svc) => ({
      label: `${svc.name} — ${formatCurrency(svc.price)}`,
      value: svc.id,
    })),
  ];

  // ── Row handlers ──────────────────────────────────────────────────────────

  const handleServiceChange = useCallback((rowId: number, serviceId: string) => {
    const service = activeServices.find((s) => s.id === serviceId) ?? null;
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, serviceId, service, soldPrice: service ? service.price : 0 }
          : r
      )
    );
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  }, [activeServices]);

  const handlePriceChange = useCallback((rowId: number, value: string) => {
    const soldPrice = value === '' ? 0 : (parseFloat(value) || 0);
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, soldPrice } : r)));
  }, []);

  const handleAddRow = () => setRows((prev) => [...prev, newRow()]);

  const handleRemoveRow = (rowId: number) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  // ── Totals ────────────────────────────────────────────────────────────────

  const totals = rows.reduce(
    (acc, row) => {
      if (!row.service) return acc;
      const commission = calculateCommission(
        row.soldPrice,
        row.service.commissionRate,
        row.service.commissionType
      );
      return {
        sales: acc.sales + row.soldPrice,
        commissions: acc.commissions + commission,
      };
    },
    { sales: 0, commissions: 0 }
  );

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    let valid = true;

    if (!employeeId) {
      setEmployeeError('Please select an employee');
      valid = false;
    } else {
      setEmployeeError('');
    }

    if (!date) {
      setDateError('Please select a date');
      valid = false;
    } else {
      setDateError('');
    }

    const newRowErrors: Record<number, string> = {};
    rows.forEach((row) => {
      if (!row.serviceId) {
        newRowErrors[row.id] = 'Select a service';
        valid = false;
      } else if (row.soldPrice <= 0) {
        newRowErrors[row.id] = 'Price must be greater than ₱0';
        valid = false;
      }
    });
    setRowErrors(newRowErrors);

    if (!valid) return;

    const transactions: CreateTransactionDto[] = rows.map((row) => ({
      employeeId,
      serviceId: row.serviceId,
      soldPrice: row.soldPrice,
      date, // same date applied to all rows in the batch
    }));

    await onSubmit(transactions);
  };

  const filledRows = rows.filter((r) => r.serviceId);

  return (
    <div className="space-y-5">
      {activeEmployees.length === 0 && (
        <Alert variant="warning">
          No active employees found. Please activate an employee first.
        </Alert>
      )}

      {/* Date — single date applies to all rows */}
      <Input
        label="Transaction Date"
        type="date"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          setDateError('');
        }}
        error={dateError || undefined}
        required
        fullWidth
        helperText="Defaults to today — change to backdate all entries in this batch"
      />

      {/* Employee selector */}
      <Select
        label="Employee"
        value={employeeId}
        onChange={(e) => {
          setEmployeeId(e.target.value);
          setEmployeeError('');
        }}
        onBlur={() => {
          if (!employeeId) setEmployeeError('Please select an employee');
        }}
        error={employeeError}
        options={employeeOptions}
        placeholder="Select employee"
        required
        fullWidth
        disabled={activeEmployees.length === 0}
      />

      {/* Service rows */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
          <span className="col-span-6">Service</span>
          <span className="col-span-4">Price Sold (₱)</span>
          <span className="col-span-2" />
        </div>

        {rows.map((row) => (
          <div key={row.id} className="space-y-1">
            <div className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-6">
                <select
                  value={row.serviceId}
                  onChange={(e) => handleServiceChange(row.id, e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                    rowErrors[row.id] ? 'border-red-400' : 'border-gray-300'
                  }`}
                >
                  {serviceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-4">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.soldPrice || ''}
                  onChange={(e) => handlePriceChange(row.id, e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    rowErrors[row.id] && row.serviceId ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
              </div>

              <div className="col-span-2 flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => handleRemoveRow(row.id)}
                  disabled={rows.length === 1}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
                  title="Remove row"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                {rowErrors[row.id] && (
                  <p className="text-xs text-red-500 pl-1">{rowErrors[row.id]}</p>
                )}
              </div>
              <div className="col-span-4">
                {row.service && row.soldPrice > 0 && (
                  <p className="text-xs text-green-600 pl-1">
                    Commission:{' '}
                    {formatCurrency(
                      calculateCommission(
                        row.soldPrice,
                        row.service.commissionRate,
                        row.service.commissionType
                      )
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={handleAddRow} fullWidth>
        + Add Another Service
      </Button>

      {/* Running totals */}
      {filledRows.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <p className="text-gray-500 text-xs mb-1">Services</p>
              <p className="font-bold text-gray-900">{filledRows.length}</p>
            </div>
            <div className="text-center border-x border-blue-200">
              <p className="text-gray-500 text-xs mb-1">Total Sales</p>
              <p className="font-bold text-gray-900">{formatCurrency(totals.sales)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs mb-1">Total Commission</p>
              <p className="font-bold text-green-600">{formatCurrency(totals.commissions)}</p>
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
          Save {filledRows.length > 0 ? `${filledRows.length} Transaction${filledRows.length !== 1 ? 's' : ''}` : 'Transactions'}
        </Button>
      </ModalFooter>
    </div>
  );
}