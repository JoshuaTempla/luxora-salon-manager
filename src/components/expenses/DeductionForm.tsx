// Form for creating/editing employee deductions

import React, { useEffect } from 'react';
import { Input, Select, Button, ModalFooter } from '@/components/common';
import { useForm, useEmployees } from '@/hooks';
import { CreateDeductionDto, DeductionType, DEDUCTION_TYPE_LABELS } from '@/types';
import { getToday } from '@/utils';

interface DeductionFormProps {
  onSubmit: (data: CreateDeductionDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  defaultEmployeeId?: string;
}

export function DeductionForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultEmployeeId,
}: DeductionFormProps) {
  const { employees } = useEmployees();

  const form = useForm<CreateDeductionDto>(
    {
      employeeId: defaultEmployeeId || '',
      type: 'CASH_ADVANCE',
      description: '',
      amount: 0,
      date: getToday(),
    },
    {
      employeeId: { required: true },
      type: { required: true },
      description: {
        required: true,
        custom: (value) =>
          value.trim().length < 3 ? 'Description must be at least 3 characters' : null,
      },
      amount: {
        required: true,
        custom: (value) => {
           if (value === undefined || value === null || isNaN(value)) return 'Amount is required';
          return value <= 0 ? 'Amount must be greater than 0' : null;
        },
      },
      date: { required: true },
    }
  );

  useEffect(() => {
    if (defaultEmployeeId) {
      form.handleChange('employeeId', defaultEmployeeId);
    }
  }, [defaultEmployeeId]);

  const handleSubmit = async () => {
    await form.handleSubmit(async (values) => {
      await onSubmit(values);
      form.reset();
    });
  };

  const activeEmployees = employees.filter((e) => e.isActive);

  const employeeOptions = activeEmployees.map((emp) => ({
    label: `${emp.firstName} ${emp.lastName} — ${emp.position}`,
    value: emp.id,
  }));

  const typeOptions = (Object.keys(DEDUCTION_TYPE_LABELS) as DeductionType[]).map((key) => ({
    label: DEDUCTION_TYPE_LABELS[key],
    value: key,
  }));

  return (
    <div className="space-y-4">
      <Select
        label="Employee"
        value={form.values.employeeId}
        onChange={(e) => form.handleChange('employeeId', e.target.value)}
        onBlur={() => form.handleBlur('employeeId')}
        error={form.touched.employeeId ? form.errors.employeeId : undefined}
        options={employeeOptions}
        placeholder="Select employee"
        required
        fullWidth
        disabled={!!defaultEmployeeId}
      />

      <Select
        label="Deduction Type"
        value={form.values.type}
        onChange={(e) => form.handleChange('type', e.target.value as DeductionType)}
        onBlur={() => form.handleBlur('type')}
        error={form.touched.type ? form.errors.type : undefined}
        options={typeOptions}
        required
        fullWidth
      />

      <Input
        label="Description"
        value={form.values.description}
        onChange={(e) => form.handleChange('description', e.target.value)}
        onBlur={() => form.handleBlur('description')}
        error={form.touched.description ? form.errors.description : undefined}
        required
        fullWidth
        placeholder="e.g., Cash advance on Feb 10"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Amount (₱)"
          type="number"
          step="0.01"
          value={form.values.amount || ''}
          onChange={(e) => form.handleChange('amount', parseFloat(e.target.value))}
          onBlur={(e) => {
            form.handleChange('amount', parseFloat(e.target.value) || 0);
            form.handleBlur('amount');
          }}
          error={form.touched.amount ? form.errors.amount : undefined}
          required
          fullWidth
          placeholder="0.00"
        />

        <Input
          label="Date"
          type="date"
          value={form.values.date}
          onChange={(e) => form.handleChange('date', e.target.value)}
          onBlur={() => form.handleBlur('date')}
          error={form.touched.date ? form.errors.date : undefined}
          required
          fullWidth
        />
      </div>

      <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
        This deduction will be automatically applied and deducted from the employee's next payroll.
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={!form.isValid || isSubmitting}
        >
          Add Deduction
        </Button>
      </ModalFooter>
    </div>
  );
}