// src/components/transactions/TransactionForm.tsx
// Form for recording sales/transactions

import React, { useEffect, useState } from 'react';
import { Select, Input, Button, ModalFooter, Alert } from '@/components/common';
import { useForm } from '@/hooks';
import { useEmployees, useServices } from '@/hooks';
import { CreateTransactionDto } from '@/types';
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
  const [selectedService, setSelectedService] = useState<any>(null);
  const [calculatedCommission, setCalculatedCommission] = useState(0);

  const form = useForm<CreateTransactionDto>(
    {
      employeeId: '',
      serviceId: '',
      soldPrice: 0,
    },
    {
      employeeId: {
        required: true,
      },
      serviceId: {
        required: true,
      },
      soldPrice: {
        required: true,
        min: 0,
        custom: (value) => {
          if (value === undefined || value === null) return null;
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
      const commission = calculateCommission(form.values.soldPrice, selectedService.commissionRate);
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

  return (
    <div className="space-y-4">
      {activeEmployees.length === 0 && (
        <Alert variant="warning">
          No active employees found. Please create and activate employees first.
        </Alert>
      )}

      {activeServices.length === 0 && (
        <Alert variant="warning">
          No active services found. Please create and activate services first.
        </Alert>
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
        disabled={activeEmployees.length === 0}
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
        disabled={activeServices.length === 0}
      />

      <Input
        label="Sold Price (₱)"
        type="number"
        step="0.01"
        value={form.values.soldPrice}
        onChange={(e) => form.handleChange('soldPrice', parseFloat(e.target.value) || 0)}
        onBlur={() => form.handleBlur('soldPrice')}
        error={form.touched.soldPrice ? form.errors.soldPrice : undefined}
        required
        fullWidth
        placeholder="0.00"
        helperText={selectedService ? `Default price: ${formatCurrency(selectedService.price)}` : undefined}
      />

      {selectedService && form.values.soldPrice !== undefined && form.values.soldPrice > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Commission Rate:</span>
            <span className="font-medium text-gray-900">{selectedService.commissionRate}%</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-700">Calculated Commission:</span>
            <span className="font-semibold text-blue-600 text-lg">
              {formatCurrency(calculatedCommission)}
            </span>
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
          disabled={!form.isValid || isSubmitting || activeEmployees.length === 0 || activeServices.length === 0}
        >
          Record Sale
        </Button>
      </ModalFooter>
    </div>
  );
}