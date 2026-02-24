// src/components/transactions/TransactionsPage.tsx
// Main page for managing transactions/sales

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
import { TransactionList } from './TransactionList';
import { TransactionForm } from './TransactionForm';
import { BatchTransactionForm } from './BatchTransactionForm';
import { TransactionSummary } from './TransactionSummary';
import { useTransactions, useEmployees, useServices } from '@/hooks';
import { CreateTransactionDto, TransactionFilters } from '@/types';
import { getDateRange, getToday } from '@/utils';
import { DATE_RANGE_PRESETS } from '@/types';


export function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState(getToday());
  const [customEndDate, setCustomEndDate] = useState(getToday());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  // Get filters based on selections
  const filters: TransactionFilters = useMemo(() => {
    const baseFilters: TransactionFilters = {};

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
    if (selectedEmployeeId) {
      baseFilters.employeeId = selectedEmployeeId;
    }

    // Service filter
    if (selectedServiceId) {
      baseFilters.serviceId = selectedServiceId;
    }

    return baseFilters;
  }, [dateRange, customStartDate, customEndDate, selectedEmployeeId, selectedServiceId]);

  const {
    transactions,
    loading,
    error,
    createTransaction,
    bulkCreateTransactions,
    deleteTransaction,
    refetch,
  } = useTransactions(filters);

  const { employees } = useEmployees();
  const { services } = useServices();

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalSales = transactions.reduce((sum, t) => sum + t.soldPrice, 0);
    const totalCommissions = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    return {
      totalSales,
      totalCommissions,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleOpenBatchModal = () => setIsBatchModalOpen(true);
  const handleCloseBatchModal = () => setIsBatchModalOpen(false);

  const handleSubmit = async (data: CreateTransactionDto) => {
    try {
      await createTransaction(data);
      setSuccessMessage('Transaction recorded successfully!');
      handleCloseModal();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to create transaction:', err);
    }
  };

  const handleBatchSubmit = async (transactions: CreateTransactionDto[]) => {
    try {
      await bulkCreateTransactions(transactions);
      setSuccessMessage(`${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} recorded successfully!`);
      handleCloseBatchModal();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to batch create transactions:', err);
    }
  };

  const handleDelete = async (transaction: any) => {
    try {
      await deleteTransaction(transaction.id);
      setSuccessMessage('Transaction deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const dateRangeOptions = [
    { label: 'Today', value: DATE_RANGE_PRESETS.TODAY },
    { label: 'Yesterday', value: DATE_RANGE_PRESETS.YESTERDAY },
    { label: 'This Week', value: DATE_RANGE_PRESETS.THIS_WEEK },
    { label: 'Last Week', value: DATE_RANGE_PRESETS.LAST_WEEK },
    { label: 'This Month', value: DATE_RANGE_PRESETS.THIS_MONTH },
    { label: 'Last Month', value: DATE_RANGE_PRESETS.LAST_MONTH },
    { label: 'Custom Range', value: 'custom' },
  ];

  const employeeOptions = [
    { label: 'All Employees', value: '' },
    ...employees.map(emp => ({
      label: `${emp.firstName} ${emp.lastName}`,
      value: emp.id,
    })),
  ];

  const serviceOptions = [
    { label: 'All Services', value: '' },
    ...services.map(svc => ({
      label: svc.name,
      value: svc.id,
    })),
  ];

  if (loading && transactions.length === 0) {
    return <LoadingSpinner fullScreen message="Loading transactions..." />;
  }

  if (error && transactions.length === 0) {
    return <ErrorMessage message={error} fullScreen onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">Record and manage daily sales</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOpenBatchModal}>
            + Batch Entry
          </Button>
          <Button variant="primary" onClick={handleOpenModal}>
            + Record Sale
          </Button>
        </div>
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

      <TransactionSummary {...summary} />

      <Card>
        <CardHeader
          title="Filters"
          subtitle="Filter transactions by date, employee, or service"
        />
        
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
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            options={employeeOptions}
            fullWidth
          />

          <Select
            label="Service"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            options={serviceOptions}
            fullWidth
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="All Transactions"
          subtitle={`${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`}
        />

        {loading ? (
          <LoadingSpinner message="Updating..." />
        ) : (
          <TransactionList
            transactions={transactions}
            onDelete={handleDelete}
          />
        )}
      </Card>

      {/* Single transaction modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Record New Sale"
        size="lg"
      >
        <TransactionForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSubmitting={loading}
        />
      </Modal>

      {/* Batch entry modal */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={handleCloseBatchModal}
        title="Batch Transaction Entry"
        size="lg"
      >
        <BatchTransactionForm
          onSubmit={handleBatchSubmit}
          onCancel={handleCloseBatchModal}
          isSubmitting={loading}
        />
      </Modal>
    </div>
  );
}