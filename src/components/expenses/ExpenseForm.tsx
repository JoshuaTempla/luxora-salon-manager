import React, { useState, useEffect } from 'react';
import { FormInput } from '../common/FormInput';
import { FormSelect } from '../common/FormSelect';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface Expense {
  id?: string;
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE';
  date: string;
  isRecurring: boolean;
}

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Expense) => void;
  initialData?: Expense;
  mode: 'create' | 'edit';
}

const CATEGORIES = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'VARIABLE', label: 'Variable' },
];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const [formData, setFormData] = useState<Expense>({
    description: '',
    amount: 0,
    category: 'VARIABLE',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date.split('T')[0], // Format date for input
      });
    } else {
      setFormData({
        description: '',
        amount: 0,
        category: 'VARIABLE',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleCancel = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={mode === 'create' ? 'Add New Expense' : 'Edit Expense'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          error={errors.description}
          placeholder="e.g., Rent, Utilities, Supplies"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Amount ($)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            required
            min={0}
            step={0.01}
            error={errors.amount}
            placeholder="0.00"
          />

          <FormSelect
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={CATEGORIES}
            required
            error={errors.category}
          />
        </div>

        <FormInput
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          required
          error={errors.date}
        />

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Recurring Expense</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Check this if this expense occurs regularly (e.g., monthly rent)
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-blue-800 text-sm">
            <strong>Fixed:</strong> Costs that don't change (rent, insurance)<br />
            <strong>Variable:</strong> Costs that fluctuate (supplies, utilities)
          </p>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            {mode === 'create' ? 'Create Expense' : 'Update Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};