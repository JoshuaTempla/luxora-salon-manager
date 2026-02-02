// Display transactions in a table

import React from 'react';
import { Table, Button, Badge } from '@/components/common';
import { Transaction } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/utils';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (transaction: Transaction) => void;
}

export function TransactionList({
  transactions,
  onDelete,
}: TransactionListProps) {
  const columns = [
    {
      key: 'createdAt',
      label: 'Date & Time',
      sortable: true,
      render: (transaction: Transaction) => (
        <div>
          <div className="font-medium text-gray-900">
            {formatDate(transaction.createdAt, 'short')}
          </div>
          <div className="text-sm text-gray-500">
            {formatTime(transaction.createdAt)}
          </div>
        </div>
      ),
    },
    {
      key: 'employee',
      label: 'Employee',
      render: (transaction: Transaction) => (
        <span className="text-gray-900">
          {transaction.employee
            ? `${transaction.employee.firstName} ${transaction.employee.lastName}`
            : '-'}
        </span>
      ),
    },
    {
      key: 'service',
      label: 'Service',
      render: (transaction: Transaction) => (
        <span className="font-medium text-gray-900">
          {transaction.service?.name || '-'}
        </span>
      ),
    },
    {
      key: 'soldPrice',
      label: 'Price',
      sortable: true,
      render: (transaction: Transaction) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(transaction.soldPrice)}
        </span>
      ),
    },
    {
      key: 'commissionAmount',
      label: 'Commission',
      sortable: true,
      render: (transaction: Transaction) => (
        <span className="text-green-600 font-medium">
          {formatCurrency(transaction.commissionAmount)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (transaction: Transaction) => (
        <Button
          size="sm"
          variant="danger"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
              onDelete(transaction);
            }
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Table
      data={transactions}
      columns={columns}
      emptyMessage="No transactions found. Record your first sale to get started."
    />
  );
}