// Table displaying employee deductions

import React from 'react';
import { Table, Badge, Button } from '@/components/common';
import { EmployeeDeduction, DEDUCTION_TYPE_LABELS } from '@/types';
import { formatCurrency, formatDate } from '@/utils';

interface DeductionListProps {
  deductions: EmployeeDeduction[];
  onDelete: (deduction: EmployeeDeduction) => void;
}

export function DeductionList({ deductions, onDelete }: DeductionListProps) {
  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (d: EmployeeDeduction) => (
        <span className="font-medium text-gray-900">
          {d.employee
            ? `${d.employee.firstName} ${d.employee.lastName}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (d: EmployeeDeduction) => (
        <Badge variant="info">
          {DEDUCTION_TYPE_LABELS[d.type] ?? d.type}
        </Badge>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (d: EmployeeDeduction) => (
        <span className="text-gray-700">{d.description}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (d: EmployeeDeduction) => (
        <span className="font-semibold text-red-600">
          -{formatCurrency(d.amount)}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (d: EmployeeDeduction) => (
        <span className="text-gray-600">{formatDate(d.date)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (d: EmployeeDeduction) =>
        d.isDeducted ? (
          <Badge variant="success">Deducted</Badge>
        ) : (
          <Badge variant="warning">Pending</Badge>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (d: EmployeeDeduction) => (
        <Button
          size="sm"
          variant="danger"
          disabled={d.isDeducted}
          onClick={(e) => {
            e.stopPropagation();
            if (
              confirm(
                `Delete deduction of ${formatCurrency(d.amount)} for ${
                  d.employee ? `${d.employee.firstName} ${d.employee.lastName}` : 'this employee'
                }?`
              )
            ) {
              onDelete(d);
            }
          }}
        >
          {d.isDeducted ? 'Applied' : 'Delete'}
        </Button>
      ),
    },
  ];

  return (
    <Table
      data={deductions}
      columns={columns}
      emptyMessage="No deductions found. Add a deduction to get started."
    />
  );
}