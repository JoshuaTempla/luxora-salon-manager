// Display services in a table

import React from 'react';
import { Table, Badge, Button } from '@/components/common';
import { Service } from '@/types';
import { formatCurrency } from '@/utils';

interface ServiceListProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onToggleActive: (service: Service) => void;
}

export function ServiceList({
  services,
  onEdit,
  onDelete,
  onToggleActive,
}: ServiceListProps) {
  const columns = [
    {
      key: 'name',
      label: 'Service Name',
      sortable: true,
      render: (service: Service) => (
        <span className="font-medium text-gray-900">{service.name}</span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (service: Service) => (
        <span className="text-gray-900">{formatCurrency(service.price)}</span>
      ),
    },
    {
      key: 'commissionRate',
      label: 'Commission Rate',
      sortable: true,
      render: (service: Service) => (
        <span className="text-gray-900">{service.commissionRate}%</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (service: Service) => (
        <Badge variant={service.isActive ? 'success' : 'danger'}>
          {service.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (service: Service) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(service);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant={service.isActive ? 'secondary' : 'success'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(service);
            }}
          >
            {service.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete ${service.name}?`)) {
                onDelete(service);
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
      data={services}
      columns={columns}
      emptyMessage="No services found. Create your first service to get started."
    />
  );
}