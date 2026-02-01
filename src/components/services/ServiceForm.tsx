// Form for creating/editing services

import React, { useEffect } from 'react';
import { Input, Button, ModalFooter } from '@/components/common';
import { useForm } from '@/hooks';
import { Service, CreateServiceDto } from '@/types';

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
        max: 100,
        custom: (value) =>
          value < 0 || value > 100
            ? 'Commission rate must be between 0 and 100'
            : null,
      },
    }
  );

  useEffect(() => {
    if (service) {
      form.setValues({
        name: service.name,
        price: service.price,
        commissionRate: service.commissionRate,
      });
    }
  }, [service]);

  const handleSubmit = async () => {
    await form.handleSubmit(async (values) => {
      await onSubmit(values);
      form.reset();
    });
  };

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

        <Input
          label="Commission Rate (%)"
          type="number"
          step="0.01"
          value={form.values.commissionRate}
          onChange={(e) => form.handleChange('commissionRate', parseFloat(e.target.value) || 0)}
          onBlur={() => form.handleBlur('commissionRate')}
          error={form.touched.commissionRate ? form.errors.commissionRate : undefined}
          required
          fullWidth
          placeholder="10.00"
          helperText="Commission percentage for employees providing this service"
        />
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