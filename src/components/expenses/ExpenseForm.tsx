// src/components/expenses/ExpenseForm.tsx
// Form for creating/editing expenses

import React, { useEffect } from 'react';
import { Input, Select, Button, ModalFooter, Textarea } from '@/components/common';
import { useForm } from '@/hooks';
import { Expense, CreateExpenseDto, ExpenseCategory, EXPENSE_CATEGORY_LABELS } from '@/types';
import { getToday } from '@/utils';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSubmit: (data: CreateExpenseDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ExpenseForm({
  expense,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ExpenseFormProps) {
  const isEditMode = !!expense;

  const form = useForm<CreateExpenseDto>(
    {
      description: expense?.description || '',
      amount: expense?.amount || 0,
      category: expense?.category || ExpenseCategory.VARIABLE,
      date: expense?.date || getToday(),
      isRecurring: expense?.isRecurring || false,
    },
    {
      description: {
        required: true,
        custom: (value) => {
          if (value === undefined || value === null) return null;
          return value.trim().length < 3 ? 'Description must be at least 3 characters' : null;
        },
      },
      amount: {
        required: true,
        min: 0,
        custom: (value) => {
           if (value === undefined || value === null || isNaN(value)) return 'Amount is required';
          return value <= 0 ? 'Amount must be greater than 0' : null;
        },
      },
      category: { required: true },
      date: { required: true },
    }
  );

  useEffect(() => {
    if (expense) {
      form.setValues({
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        isRecurring: expense.isRecurring,
      });
    }
  }, [expense]);

  const handleSubmit = async () => {
    await form.handleSubmit(async (values) => {
      await onSubmit(values);
      form.reset();
    });
  };

  const categoryOptions = [
    { label: EXPENSE_CATEGORY_LABELS[ExpenseCategory.FIXED], value: ExpenseCategory.FIXED },
    { label: EXPENSE_CATEGORY_LABELS[ExpenseCategory.VARIABLE], value: ExpenseCategory.VARIABLE },
  ];

  return (
    <div className="space-y-4">
      <Textarea
        label="Description"
        value={form.values.description}
        onChange={(e) => form.handleChange('description', e.target.value)}
        onBlur={() => form.handleBlur('description')}
        error={form.touched.description ? form.errors.description : undefined}
        required
        fullWidth
        placeholder="e.g., Electricity bill, Shampoo supplies"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Amount (₱)"
          type="number"
          step="0.01"
          value={form.values.amount || ''}
          onChange={(e) => form.handleChange('amount', e.target.value === '' ? '' : parseFloat(e.target.value))}
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

      <Select
        label="Category"
        value={form.values.category}
        onChange={(e) => form.handleChange('category', e.target.value as ExpenseCategory)}
        onBlur={() => form.handleBlur('category')}
        error={form.touched.category ? form.errors.category : undefined}
        options={categoryOptions}
        required
        fullWidth
      />

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.values.isRecurring}
          onChange={(e) => form.handleChange('isRecurring', e.target.checked)}
          className="rounded border-gray-300"
        />
        Recurring expense (monthly)
      </label>

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
          {isEditMode ? 'Update Expense' : 'Add Expense'}
        </Button>
      </ModalFooter>
    </div>
  );
}