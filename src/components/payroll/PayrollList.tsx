// Display payroll records in a table

import React from 'react';
import { Table, Button } from '@/components/common';
import { Payroll } from '@/types';
import { formatCurrency, formatDate } from '@/utils';

interface PayrollListProps {
  payrolls: Payroll[];
  onEdit: (payroll: Payroll) => void;
  onDelete: (payroll: Payroll) => void;
}

export function PayrollList({
  payrolls,
  onEdit,
  onDelete,
}: PayrollListProps) {
  const columns = [
    {
      key: 'payrollDate',
      label: 'Payroll Date',
      sortable: true,
      render: (payroll: Payroll) => (
        <span className="font-medium text-gray-900">
          {formatDate(payroll.payrollDate, 'short')}
        </span>
      ),
    },
    {
      key: 'period',
      label: 'Period',
      render: (payroll: Payroll) => (
        <div className="text-sm">
          <div className="text-gray-900">
            {formatDate(payroll.startDate, 'short')}
          </div>
          <div className="text-gray-500">
            to {formatDate(payroll.endDate, 'short')}
          </div>
        </div>
      ),
    },
    {
      key: 'employee',
      label: 'Employee',
      render: (payroll: Payroll) => (
        <span className="text-gray-900">
          {payroll.employee
            ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'totalHoursWorked',
      label: 'Hours',
      sortable: true,
      render: (payroll: Payroll) => (
        <span className="text-gray-900">{payroll.totalHoursWorked} hrs</span>
      ),
    },
    {
      key: 'grossSalary',
      label: 'Gross Salary',
      sortable: true,
      render: (payroll: Payroll) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(payroll.grossSalary)}
        </span>
      ),
    },
    {
      key: 'deductions',
      label: 'Deductions',
      sortable: true,
      render: (payroll: Payroll) => {
        // Calculate total deductions: tax + employee deductions
        const employeeDeductionTotal = payroll.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;
        const totalDeductions = payroll.taxDeductions + employeeDeductionTotal;

        return (
          <div className="text-sm">
            <div className="font-semibold text-red-600">
              -{formatCurrency(totalDeductions)}
            </div>
            {(payroll.taxDeductions > 0 || employeeDeductionTotal > 0) && (
              <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                {payroll.taxDeductions > 0 && (
                  <div>Tax: {formatCurrency(payroll.taxDeductions)}</div>
                )}
                {employeeDeductionTotal > 0 && (
                  <div>
                    Employee: {formatCurrency(employeeDeductionTotal)}
                    {payroll.deductions && payroll.deductions.length > 1 && (
                      <span className="ml-1">({payroll.deductions.length})</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'netSalary',
      label: 'Net Salary',
      sortable: true,
      render: (payroll: Payroll) => (
        <span className="font-bold text-green-600">
          {formatCurrency(payroll.netSalary)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (payroll: Payroll) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(payroll);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this payroll record?')) {
                onDelete(payroll);
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
      data={payrolls}
      columns={columns}
      emptyMessage="No payroll records found. Create your first payroll to get started."
    />
  );
}