// Display employees in a table

import React from 'react';
import { Table, Badge, Button } from '@/components/common';
import { Employee } from '@/types';
import { formatCurrency, getFullName } from '@/utils';

interface EmployeeListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleActive: (employee: Employee) => void;
}

export function EmployeeList({
  employees,
  onEdit,
  onDelete,
  onToggleActive,
}: EmployeeListProps) {
  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (employee: Employee) => (
        <div>
          <div className="font-medium text-gray-900">
            {getFullName(employee.firstName, employee.lastName)}
          </div>
          <div className="text-sm text-gray-500">{employee.position}</div>
        </div>
      ),
    },
    {
      key: 'hourlyRate',
      label: 'Hourly Rate',
      sortable: true,
      render: (employee: Employee) => (
        <span className="text-gray-900">{formatCurrency(employee.hourlyRate)}</span>
      ),
    },
    {
      key: 'baseCommission',
      label: 'Commission',
      sortable: true,
      render: (employee: Employee) => (
        <span className="text-gray-900">{employee.baseCommission}%</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (employee: Employee) => (
        <Badge variant={employee.isActive ? 'success' : 'danger'}>
          {employee.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (employee: Employee) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(employee);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant={employee.isActive ? 'secondary' : 'success'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(employee);
            }}
          >
            {employee.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete ${getFullName(employee.firstName, employee.lastName)}?`)) {
                onDelete(employee);
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
      data={employees}
      columns={columns}
      emptyMessage="No employees found. Create your first employee to get started."
    />
  );
}