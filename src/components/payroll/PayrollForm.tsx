// Form for creating/editing payroll

import React, { useEffect, useState } from 'react';
import { Input, Select, Button, ModalFooter, Alert } from '@/components/common';
import { useForm, usePayrollCalculator, useEmployees } from '@/hooks';
import { Payroll, CreatePayrollDto } from '@/types';
import { formatCurrency, getToday, getStartOfMonth, getEndOfMonth } from '@/utils';

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
      startDate: payroll?.startDate || getStartOfMonth(),
      endDate: payroll?.endDate || getEndOfMonth(),
      totalHoursWorked: payroll?.totalHoursWorked || 0,
      taxDeductions: payroll?.taxDeductions || 0,
    },
    {
      employeeId: {
        required: true,
      },
      startDate: {
        required: true,
      },
      endDate: {
        required: true,
      },
      totalHoursWorked: {
        required: true,
        min: 0,
        custom: (value) => {
          if (value === undefined || value === null) return null;
          return value < 0 ? 'Hours worked cannot be negative' : null;
        },
      },
      taxDeductions: {
        required: true,
        min: 0,
        custom: (value) => {
          if (value === undefined || value === null) return null;
          return value < 0 ? 'Tax deductions cannot be negative' : null;
        },
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
        taxDeductions: payroll.taxDeductions,
      });
      setHasCalculated(true);
    }
  }, [payroll]);

  const handleCalculate = async () => {
    if (!form.values.employeeId || !form.values.startDate || !form.values.endDate || form.values.totalHoursWorked <= 0) {
      return;
    }

    // Calculate with 12% tax rate (simplified)
    const taxRate = 0.12;
    await calculatePayroll(
      form.values.employeeId,
      form.values.startDate,
      form.values.endDate,
      form.values.totalHoursWorked,
      taxRate
    );
    setHasCalculated(true);
  };

  const handleSubmit = async () => {
    await form.handleSubmit(async (values) => {
      await onSubmit(values);
      form.reset();
      setHasCalculated(false);
    });
  };

  const activeEmployees = employees.filter(emp => emp.isActive);
  const employeeOptions = activeEmployees.map((emp) => ({
    label: `${emp.firstName} ${emp.lastName} - ${emp.position}`,
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
        value={form.values.totalHoursWorked}
        onChange={(e) => {
          form.handleChange('totalHoursWorked', parseFloat(e.target.value) || 0);
          setHasCalculated(false);
        }}
        onBlur={() => form.handleBlur('totalHoursWorked')}
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

      {calculation && hasCalculated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 mb-3">Payroll Calculation</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-700">Hours Worked:</span>
            <span className="font-medium text-gray-900 text-right">{calculation.hoursWorked} hrs</span>

            <span className="text-gray-700">Hourly Earnings:</span>
            <span className="font-medium text-gray-900 text-right">
              {formatCurrency(calculation.hourlyEarnings)}
            </span>

            <span className="text-gray-700">Commissions:</span>
            <span className="font-medium text-green-600 text-right">
              {formatCurrency(calculation.commissionsEarned)}
            </span>

            <span className="text-gray-700 font-semibold">Gross Salary:</span>
            <span className="font-semibold text-gray-900 text-right">
              {formatCurrency(calculation.grossSalary)}
            </span>

            <span className="text-gray-700">Tax Deductions (12%):</span>
            <span className="font-medium text-red-600 text-right">
              -{formatCurrency(calculation.taxDeductions)}
            </span>

            <div className="col-span-2 border-t border-blue-300 my-2"></div>

            <span className="text-gray-700 font-bold text-lg">Net Salary:</span>
            <span className="font-bold text-blue-600 text-lg text-right">
              {formatCurrency(calculation.netSalary)}
            </span>
          </div>
        </div>
      )}

      {hasCalculated && calculation && (
        <Input
          label="Tax Deductions (₱)"
          type="number"
          step="0.01"
          value={calculation.taxDeductions}
          onChange={(e) => form.handleChange('taxDeductions', parseFloat(e.target.value) || 0)}
          onBlur={() => form.handleBlur('taxDeductions')}
          error={form.touched.taxDeductions ? form.errors.taxDeductions : undefined}
          required
          fullWidth
          placeholder="0.00"
          helperText="You can adjust the calculated tax deduction if needed"
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
          disabled={!form.isValid || isSubmitting || !hasCalculated || activeEmployees.length === 0}
        >
          {isEditMode ? 'Update Payroll' : 'Create Payroll'}
        </Button>
      </ModalFooter>
    </div>
  );
}