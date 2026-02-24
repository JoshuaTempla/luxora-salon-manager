// src/components/payroll/PayrollForm.tsx
// Form for creating/editing payroll

import React, { useEffect, useState } from 'react';
import { Input, Select, Button, ModalFooter, Alert } from '@/components/common';
import { useForm, usePayrollCalculator, useEmployees } from '@/hooks';
import { Payroll, CreatePayrollDto, DEDUCTION_TYPE_LABELS, DeductionType } from '@/types';
import { formatCurrency, getPayrollCutoff } from '@/utils';

interface PayrollFormProps {
  payroll?: Payroll | null;
  onSubmit: (data: CreatePayrollDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PayrollForm({
  payroll,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PayrollFormProps) {
  const isEditMode = !!payroll;
  const { employees } = useEmployees();
  const { calculation, calculatePayroll, loading: calculating } = usePayrollCalculator();
  const [hasCalculated, setHasCalculated] = useState(false);

  const form = useForm<CreatePayrollDto>(
    {
      employeeId: payroll?.employeeId || '',
      startDate: payroll?.startDate || getPayrollCutoff().startDate,
      endDate: payroll?.endDate || getPayrollCutoff().endDate,
      totalHoursWorked: payroll?.totalHoursWorked || 0,
      commissionsEarned: payroll?.commissionsEarned || 0,
      taxDeductions: payroll?.taxDeductions || 0,
    },
    {
      employeeId: { required: true },
      startDate: { required: true },
      endDate: { required: true },
      totalHoursWorked: {
        required: true,
        min: 0,
        custom: (value) =>
          value < 0 ? 'Hours worked cannot be negative' : null,
      },
      commissionsEarned: {
        required: true,
        min: 0,
      },
      taxDeductions: {
        required: false,
        min: 0,
        custom: (value) =>
          value < 0 ? 'Tax deductions cannot be negative' : null,
      },
    }
  );

  useEffect(() => {
    if (payroll) {
      form.setValues({
        employeeId: payroll.employeeId,
        startDate: payroll.startDate,
        endDate: payroll.endDate,
        totalHoursWorked: payroll.totalHoursWorked,
        commissionsEarned: payroll.commissionsEarned,
        taxDeductions: payroll.taxDeductions,
      });
      setHasCalculated(true);
    }
  }, [payroll]);

  const handleCalculate = async () => {
    if (
      !form.values.employeeId ||
      !form.values.startDate ||
      !form.values.endDate ||
      form.values.totalHoursWorked < 0
    ) return;

    const taxRate = 0;
    const result = await calculatePayroll(
      form.values.employeeId,
      form.values.startDate,
      form.values.endDate,
      form.values.totalHoursWorked,
      taxRate
    );

    if (result) {
      form.handleChange('commissionsEarned', result.commissionsEarned);
      form.handleChange('taxDeductions', result.taxDeductions);
    }

    setHasCalculated(true);
  };

  const handleSubmit = async () => {
    await form.handleSubmit(async (values) => {
      await onSubmit(values);
      form.reset();
      setHasCalculated(false);
    });
  };

  const activeEmployees = employees.filter((emp) => emp.isActive);
  const employeeOptions = activeEmployees.map((emp) => ({
    label: `${emp.firstName} ${emp.lastName} — ${emp.position}`,
    value: emp.id,
  }));

  return (
    <div className="space-y-4">
      {activeEmployees.length === 0 && (
        <Alert variant="warning">
          No active employees found. Please create and activate employees first.
        </Alert>
      )}

      <Select
        label="Employee"
        value={form.values.employeeId}
        onChange={(e) => {
          form.handleChange('employeeId', e.target.value);
          setHasCalculated(false);
        }}
        onBlur={() => form.handleBlur('employeeId')}
        error={form.touched.employeeId ? form.errors.employeeId : undefined}
        options={employeeOptions}
        placeholder="Select employee"
        required
        fullWidth
        disabled={activeEmployees.length === 0 || isEditMode}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={form.values.startDate}
          onChange={(e) => {
            form.handleChange('startDate', e.target.value);
            setHasCalculated(false);
          }}
          onBlur={() => form.handleBlur('startDate')}
          error={form.touched.startDate ? form.errors.startDate : undefined}
          required
          fullWidth
        />
        <Input
          label="End Date"
          type="date"
          value={form.values.endDate}
          onChange={(e) => {
            form.handleChange('endDate', e.target.value);
            setHasCalculated(false);
          }}
          onBlur={() => form.handleBlur('endDate')}
          error={form.touched.endDate ? form.errors.endDate : undefined}
          required
          fullWidth
        />
      </div>

      <Input
        label="Total Hours Worked"
        type="number"
        step="0.5"
        value={form.values.totalHoursWorked || ''}
        onChange={(e) => {
          form.handleChange('totalHoursWorked', e.target.value === '' ? '' : parseFloat(e.target.value));
          setHasCalculated(false);
        }}
        onBlur={(e) => {
          form.handleChange('totalHoursWorked', parseFloat(e.target.value) || 0);
          form.handleBlur('totalHoursWorked');
        }}
        error={form.touched.totalHoursWorked ? form.errors.totalHoursWorked : undefined}
        required
        fullWidth
        placeholder="0"
      />

      <Button
        variant="outline"
        onClick={handleCalculate}
        isLoading={calculating}
        disabled={!form.values.employeeId || calculating || activeEmployees.length === 0}
        fullWidth
      >
        Calculate Payroll
      </Button>

      {/* Calculation Preview */}
      {calculation && hasCalculated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 mb-3">Payroll Breakdown</h3>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-700">Hours Worked:</span>
            <span className="font-medium text-gray-900 text-right">
              {calculation.hoursWorked} hrs
            </span>

            <span className="text-gray-700">Hourly Earnings:</span>
            <span className="font-medium text-gray-900 text-right">
              {formatCurrency(calculation.hourlyEarnings)}
            </span>

            <span className="text-gray-700">Commissions ({calculation.transactionCount} txns):</span>
            <span className="font-medium text-green-600 text-right">
              +{formatCurrency(calculation.commissionsEarned)}
            </span>

            <span className="text-gray-700 font-semibold">Gross Salary:</span>
            <span className="font-semibold text-gray-900 text-right">
              {formatCurrency(calculation.grossSalary)}
            </span>

            <span className="text-gray-700">Tax Deductions (0% default):</span>
            <span className="font-medium text-red-500 text-right">
              -{formatCurrency(calculation.taxDeductions)}
            </span>

            {calculation.employeeDeductionCount > 0 && (
              <>
                <div className="col-span-2 border-t border-blue-200 pt-2 mt-1">
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                    Employee Deductions ({calculation.employeeDeductionCount})
                  </p>
                </div>
                {calculation.pendingDeductions.map((d) => (
                  <React.Fragment key={d.id}>
                    <span className="text-gray-600 text-xs pl-2">
                      {DEDUCTION_TYPE_LABELS[d.type as DeductionType] ?? d.type} — {d.description}
                    </span>
                    <span className="font-medium text-orange-600 text-right text-xs">
                      -{formatCurrency(d.amount)}
                    </span>
                  </React.Fragment>
                ))}
                <span className="text-gray-700 font-medium">Total Deductions:</span>
                <span className="font-medium text-orange-600 text-right">
                  -{formatCurrency(calculation.employeeDeductionAmount)}
                </span>
              </>
            )}

            <div className="col-span-2 border-t border-blue-300 my-2" />

            <span className="text-gray-700 font-bold text-lg">Net Salary:</span>
            <span className="font-bold text-blue-600 text-lg text-right">
              {formatCurrency(calculation.netSalary)}
            </span>
          </div>

          {calculation.employeeDeductionCount > 0 && (
            <p className="text-xs text-orange-600 mt-2">
              ⚠️ {calculation.employeeDeductionCount} pending deduction{calculation.employeeDeductionCount !== 1 ? 's' : ''} will be marked as applied when this payroll is saved.
            </p>
          )}
        </div>
      )}

      {/* Tax deductions input (shown after calculate) */}
      {hasCalculated && (
        <Input
          label="Tax Deductions (₱)"
          type="number"
          step="0.01"
          value={form.values.taxDeductions || ''}
          onChange={(e) => form.handleChange('taxDeductions', e.target.value === '' ? '' : parseFloat(e.target.value))}
          onBlur={(e) => {
            form.handleChange('taxDeductions', parseFloat(e.target.value) || 0);
            form.handleBlur('taxDeductions');
          }}
          error={form.touched.taxDeductions ? form.errors.taxDeductions : undefined}
          required
          fullWidth
          helperText="Defaults to ₱0 — adjust if needed"
        />
      )}

      <ModalFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={!form.isValid || isSubmitting || !hasCalculated}
        >
          {isEditMode ? 'Update Payroll' : 'Save Payroll'}
        </Button>
      </ModalFooter>
    </div>
  );
}