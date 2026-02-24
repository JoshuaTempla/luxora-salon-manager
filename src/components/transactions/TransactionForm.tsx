// Form for recording sales/transactions

import React, { useEffect, useState } from 'react';
import { Select, Input, Button, ModalFooter, Alert } from '@/components/common';
import { useForm } from '@/hooks';
import { useEmployees, useServices } from '@/hooks';
import { CreateTransactionDto, Service } from '@/types';
import { formatCurrency, calculateCommission } from '@/utils';

interface TransactionFormProps {
  onSubmit: (data: CreateTransactionDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TransactionForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TransactionFormProps) {
  const { employees } = useEmployees();
  const { services } = useServices();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [calculatedCommission, setCalculatedCommission] = useState(0);

  const form = useForm<CreateTransactionDto>(
    {
      employeeId: '',
      serviceId: '',
      soldPrice: 0,
    },
    {
      employeeId: { required: true },
      serviceId: { required: true },
      soldPrice: {
        required: true,
        min: 0,
        custom: (value) => {
          if (value === undefined || value === null || isNaN(value)) return 'Price is required';
          return value <= 0 ? 'Price must be greater than 0' : null;
        },
      },
    }
  );

  // Update sold price when service is selected
  useEffect(() => {
    if (form.values.serviceId) {
      const service = services.find(s => s.id === form.values.serviceId);
      if (service) {
        setSelectedService(service);
        form.setFieldValue('soldPrice', service.price);
      }
    }
  }, [form.values.serviceId, services]);

  // Calculate commission preview
  useEffect(() => {
    if (selectedService && form.values.soldPrice && form.values.soldPrice > 0) {
      const commission = calculateCommission(
        form.values.soldPrice,
        selectedService.commissionRate,
        selectedService.commissionType
      );
      setCalculatedCommission(commission);
    } else {
      setCalculatedCommission(0);
    }
  }, [form.values.soldPrice, selectedService]);

  const handleSubmit = async () => {
    await form.handleSubmit(async (values) => {
      await onSubmit(values);
      form.reset();
      setSelectedService(null);
      setCalculatedCommission(0);
    });
  };

  const activeEmployees = employees.filter(emp => emp.isActive);
  const activeServices = services.filter(svc => svc.isActive);

  const employeeOptions = activeEmployees.map((emp) => ({
    label: `${emp.firstName} ${emp.lastName} - ${emp.position}`,
    value: emp.id,
  }));

  const serviceOptions = activeServices.map((svc) => ({
    label: `${svc.name} - ${formatCurrency(svc.price)}`,
    value: svc.id,
  }));

  const commissionLabel = selectedService
    ? selectedService.commissionType === 'FIXED'
      ? `Fixed commission: ${formatCurrency(selectedService.commissionRate)}`
      : `Commission rate: ${selectedService.commissionRate}%`
    : null;

  return (
    <div className="space-y-4">
      {activeEmployees.length === 0 && (
        <Alert variant="warning">No active employees found.</Alert>
      )}

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
      />

      <Select
        label="Service"
        value={form.values.serviceId}
        onChange={(e) => form.handleChange('serviceId', e.target.value)}
        onBlur={() => form.handleBlur('serviceId')}
        error={form.touched.serviceId ? form.errors.serviceId : undefined}
        options={serviceOptions}
        placeholder="Select service"
        required
        fullWidth
      />

      <Input
        label="Price Sold (₱)"
        type="number"
        step="0.01"
        value={form.values.soldPrice || ''}
        onChange={(e) => form.handleChange('soldPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
        onBlur={(e) => {
          form.handleChange('soldPrice', parseFloat(e.target.value) || 0);
          form.handleBlur('soldPrice');
        }}
        error={form.touched.soldPrice ? form.errors.soldPrice : undefined}
        required
        fullWidth
        placeholder="0.00"
        helperText={commissionLabel ?? undefined}
      />

      {calculatedCommission > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">
          Estimated commission: <span className="font-semibold">{formatCurrency(calculatedCommission)}</span>
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
          disabled={!form.isValid || isSubmitting}
        >
          Record Sale
        </Button>
      </ModalFooter>
    </div>
  );
}