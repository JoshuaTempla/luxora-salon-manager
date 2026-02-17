// Form for creating/editing employees

import React, { useEffect } from 'react';
import { Input, Select, Button, ModalFooter } from '@/components/common';
import { useForm } from '@/hooks';
import { Employee, CreateEmployeeDto, SALON_POSITIONS } from '@/types';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (data: CreateEmployeeDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EmployeeForm({
  employee,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EmployeeFormProps) {
  const isEditMode = !!employee;

  const form = useForm<CreateEmployeeDto>(
    {
      firstName: employee?.firstName || '',
      lastName: employee?.lastName || '',
      position: employee?.position || '',
      hourlyRate: employee?.hourlyRate || 0,
    },
    {
      firstName: {
        required: true,
        custom: (value) =>
          value.trim().length < 2 ? 'First name must be at least 2 characters' : null,
      },
      lastName: {
        required: true,
        custom: (value) =>
          value.trim().length < 2 ? 'Last name must be at least 2 characters' : null,
      },
      position: {
        required: true,
      },
      hourlyRate: {
        required: true,
        min: 0,
        custom: (value) =>
          value < 0 ? 'Hourly rate cannot be negative' : null,
      },
    }
  );

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      form.setValues({
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        hourlyRate: employee.hourlyRate,
      });
    }
  }, [employee]);

  const handleSubmit = async () => {
    await form.handleSubmit(async (values) => {
      await onSubmit(values);
      form.reset();
    });
  };

  const positionOptions = SALON_POSITIONS.map((position) => ({
    label: position,
    value: position,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={form.values.firstName}
          onChange={(e) => form.handleChange('firstName', e.target.value)}
          onBlur={() => form.handleBlur('firstName')}
          error={form.touched.firstName ? form.errors.firstName : undefined}
          required
          fullWidth
          placeholder="Juan"
        />

        <Input
          label="Last Name"
          value={form.values.lastName}
          onChange={(e) => form.handleChange('lastName', e.target.value)}
          onBlur={() => form.handleBlur('lastName')}
          error={form.touched.lastName ? form.errors.lastName : undefined}
          required
          fullWidth
          placeholder="Dela Cruz"
        />
      </div>

      <Select
        label="Position"
        value={form.values.position}
        onChange={(e) => form.handleChange('position', e.target.value)}
        onBlur={() => form.handleBlur('position')}
        error={form.touched.position ? form.errors.position : undefined}
        options={positionOptions}
        placeholder="Select position"
        required
        fullWidth
      />

      <Input
        label="Hourly Rate (₱)"
        type="number"
        step="0.01"
        value={form.values.hourlyRate}
        onChange={(e) => form.handleChange('hourlyRate', parseFloat(e.target.value) || 0)}
        onBlur={() => form.handleBlur('hourlyRate')}
        error={form.touched.hourlyRate ? form.errors.hourlyRate : undefined}
        required
        fullWidth
        placeholder="0.00"
        helperText="Used to calculate gross salary during payroll"
      />

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
          {isEditMode ? 'Update Employee' : 'Create Employee'}
        </Button>
      </ModalFooter>
    </div>
  );
}