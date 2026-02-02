// Display expenses in a table

import React from 'react';
import { Table, Badge, Button } from '@/components/common';
import { Expense, EXPENSE_CATEGORY_LABELS } from '@/types';
import { formatCurrency, formatDate } from '@/utils';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseList({
  expenses,
  onEdit,
  onDelete,
}: ExpenseListProps) {
  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (expense: Expense) => (
        <span className="font-medium text-gray-900">
          {formatDate(expense.date, 'short')}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (expense: Expense) => (
        <div>
          <div className="font-medium text-gray-900">{expense.description}</div>
          {expense.isRecurring && (
            <Badge variant="info" size="sm">
              Recurring
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (expense: Expense) => (
        <Badge variant={expense.category === 'FIXED' ? 'default' : 'warning'}>
          {EXPENSE_CATEGORY_LABELS[expense.category]}
        </Badge>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (expense: Expense) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(expense.amount)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (expense: Expense) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(expense);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete this expense?`)) {
                onDelete(expense);
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      data={expenses}
      columns={columns}
      emptyMessage="No expenses found. Create your first expense to get started."
    />
  );
}