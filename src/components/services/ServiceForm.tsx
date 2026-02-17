// Form for creating/editing services

import React, { useEffect } from 'react';
import { Input, Button, ModalFooter } from '@/components/common';
import { useForm } from '@/hooks';
import { Service, CreateServiceDto, CommissionType } from '@/types';

interface ServiceFormProps {
  service?: Service | null;
  onSubmit: (data: CreateServiceDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ServiceForm({
  service,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ServiceFormProps) {
  const isEditMode = !!service;

  const form = useForm<CreateServiceDto>(
    {
      name: service?.name || '',
      price: service?.price || 0,
      commissionRate: service?.commissionRate || 0,
      commissionType: service?.commissionType || 'PERCENTAGE',
    },
    {
      name: {
        required: true,
        custom: (value) =>
          value.trim().length < 2 ? 'Service name must be at least 2 characters' : null,
      },
      price: {
        required: true,
        min: 0,
        custom: (value) =>
          value <= 0 ? 'Price must be greater than 0' : null,
      },
      commissionRate: {
        required: true,
        min: 0,
        custom: (value) => {
          if (value < 0) return 'Commission cannot be negative';
          // Only enforce 100 max for percentage type
          if (form.values.commissionType === 'PERCENTAGE' && value > 100) {
            return 'Percentage must be between 0 and 100';
          }
          return null;
        },
      },
    }
  );

  useEffect(() => {
    if (service) {
      form.setValues({
        name: service.name,
        price: service.price,
        commissionRate: service.commissionRate,
        commissionType: service.commissionType || 'PERCENTAGE',
      });
    }
  }, [service]);

  const handleSubmit = async () => {
    await form.handleSubmit(async (values) => {
      await onSubmit(values);
      form.reset();
    });
  };

  const isPercentage = form.values.commissionType === 'PERCENTAGE';

  return (
    <div className="space-y-4">
      <Input
        label="Service Name"
        value={form.values.name}
        onChange={(e) => form.handleChange('name', e.target.value)}
        onBlur={() => form.handleBlur('name')}
        error={form.touched.name ? form.errors.name : undefined}
        required
        fullWidth
        placeholder="e.g., Haircut, Hair Color, Manicure"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Price (₱)"
          type="number"
          step="0.01"
          value={form.values.price}
          onChange={(e) => form.handleChange('price', parseFloat(e.target.value) || 0)}
          onBlur={() => form.handleBlur('price')}
          error={form.touched.price ? form.errors.price : undefined}
          required
          fullWidth
          placeholder="0.00"
        />

        {/* Commission section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Commission <span className="text-red-500">*</span>
          </label>

          {/* Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden w-fit">
            <button
              type="button"
              onClick={() => {
                form.handleChange('commissionType', 'PERCENTAGE' as CommissionType);
                form.handleChange('commissionRate', 0);
              }}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                isPercentage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              % Percentage
            </button>
            <button
              type="button"
              onClick={() => {
                form.handleChange('commissionType', 'FIXED' as CommissionType);
                form.handleChange('commissionRate', 0);
              }}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                !isPercentage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              ₱ Fixed
            </button>
          </div>

          {/* Commission value input */}
          <Input
            type="number"
            step="0.01"
            value={form.values.commissionRate}
            onChange={(e) => form.handleChange('commissionRate', parseFloat(e.target.value) || 0)}
            onBlur={() => form.handleBlur('commissionRate')}
            error={form.touched.commissionRate ? form.errors.commissionRate : undefined}
            fullWidth
            placeholder={isPercentage ? '10.00' : '50.00'}
            helperText={
              isPercentage
                ? 'Percentage of the sold price (e.g., 15 = 15%)'
                : 'Fixed peso amount per transaction (e.g., 50 = ₱50)'
            }
          />
        </div>
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
          {isEditMode ? 'Update Service' : 'Create Service'}
        </Button>
      </ModalFooter>
    </div>
  );
}