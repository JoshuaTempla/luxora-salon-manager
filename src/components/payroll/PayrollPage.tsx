// Main page for managing payroll

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  Button,
  Modal,
  LoadingSpinner,
  ErrorMessage,
  Alert,
  Select,
  Input,
} from '@/components/common';
import { PayrollList } from './PayrollList';
import { PayrollForm } from './PayrollForm';
import { usePayroll, useEmployees } from '@/hooks';
import { Payroll, CreatePayrollDto, PayrollFilters } from '@/types';
import { formatCurrency, getDateRange, getToday } from '@/utils';
import { DATE_RANGE_PRESETS } from '@/types';

export function PayrollPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [dateRange, setDateRange] = useState<string>(DATE_RANGE_PRESETS.THIS_MONTH);
  const [customStartDate, setCustomStartDate] = useState(getToday());
  const [customEndDate, setCustomEndDate] = useState(getToday());
  const [employeeFilter, setEmployeeFilter] = useState('');

  const { employees } = useEmployees();

  // Get filters
  const filters: PayrollFilters = useMemo(() => {
    const baseFilters: PayrollFilters = {};

    // Date range
    if (dateRange === 'custom') {
      baseFilters.startDate = customStartDate;
      baseFilters.endDate = customEndDate;
    } else {
      const range = getDateRange(dateRange);
      baseFilters.startDate = range.startDate;
      baseFilters.endDate = range.endDate;
    }

    // Employee filter
    if (employeeFilter) {
      baseFilters.employeeId = employeeFilter;
    }

    return baseFilters;
  }, [dateRange, customStartDate, customEndDate, employeeFilter]);

  const {
    payrolls,
    loading,
    error,
    createPayroll,
    updatePayroll,
    deletePayroll,
  } = usePayroll(filters);

  // Calculate summary
  const summary = useMemo(() => {
    const totalGross = payrolls.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalDeductions = payrolls.reduce((sum, p) => sum + p.taxDeductions, 0);
    const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    
    return {
      totalGross,
      totalDeductions,
      totalNet,
      count: payrolls.length,
    };
  }, [payrolls]);

  const handleOpenModal = (payroll?: Payroll) => {
    setSelectedPayroll(payroll || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayroll(null);
  };

  const handleSubmit = async (data: CreatePayrollDto) => {
    try {
      if (selectedPayroll) {
        await updatePayroll(selectedPayroll.id, data);
        setSuccessMessage('Payroll updated successfully!');
      } else {
        await createPayroll(data);
        setSuccessMessage('Payroll created successfully!');
      }
      handleCloseModal();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save payroll:', err);
    }
  };

  const handleDelete = async (payroll: Payroll) => {
    try {
      await deletePayroll(payroll.id);
      setSuccessMessage('Payroll deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete payroll:', err);
    }
  };

  const dateRangeOptions = [
    { label: 'This Week', value: DATE_RANGE_PRESETS.THIS_WEEK },
    { label: 'This Month', value: DATE_RANGE_PRESETS.THIS_MONTH },
    { label: 'Last Month', value: DATE_RANGE_PRESETS.LAST_MONTH },
    { label: 'This Year', value: DATE_RANGE_PRESETS.THIS_YEAR },
    { label: 'Custom Range', value: 'custom' },
  ];

  const employeeOptions = [
    { label: 'All Employees', value: '' },
    ...employees.map(emp => ({
      label: `${emp.firstName} ${emp.lastName}`,
      value: emp.id,
    })),
  ];

  if (loading && payrolls.length === 0) {
    return <LoadingSpinner fullScreen message="Loading payroll..." />;
  }

  if (error && payrolls.length === 0) {
    return <ErrorMessage message={error} fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600 mt-1">Manage employee payroll and salaries</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Create Payroll
        </Button>
      </div>

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md" hover>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Total Records</span>
            <span className="text-2xl font-bold text-gray-900 mt-1">
              {summary.count}
            </span>
          </div>
        </Card>

        <Card padding="md" hover>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Gross Salary</span>
            <span className="text-2xl font-bold text-blue-600 mt-1">
              {formatCurrency(summary.totalGross)}
            </span>
          </div>
        </Card>

        <Card padding="md" hover>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Deductions</span>
            <span className="text-2xl font-bold text-red-600 mt-1">
              {formatCurrency(summary.totalDeductions)}
            </span>
          </div>
        </Card>

        <Card padding="md" hover>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Net Salary</span>
            <span className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(summary.totalNet)}
            </span>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Filter payroll by date or employee" />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Select
            label="Date Range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={dateRangeOptions}
            fullWidth
          />

          {dateRange === 'custom' && (
            <>
              <Input
                label="Start Date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                fullWidth
              />
              <Input
                label="End Date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                fullWidth
              />
            </>
          )}

          <Select
            label="Employee"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            options={employeeOptions}
            fullWidth
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="All Payroll Records"
          subtitle={`${payrolls.length} record${payrolls.length !== 1 ? 's' : ''}`}
        />

        {loading ? (
          <LoadingSpinner message="Updating..." />
        ) : (
          <PayrollList
            payrolls={payrolls}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedPayroll ? 'Edit Payroll' : 'Create New Payroll'}
        size="lg"
      >
        <PayrollForm
          payroll={selectedPayroll}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSubmitting={loading}
        />
      </Modal>
    </div>
  );
}