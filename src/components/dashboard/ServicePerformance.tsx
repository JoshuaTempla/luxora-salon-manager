// Display service performance metrics

import React from 'react';
import { Card, CardHeader } from '@/components/common';
import { ServicePerformance as ServicePerformanceType } from '@/types';
import { formatCurrency } from '@/utils';

interface ServicePerformanceProps {
  services: ServicePerformanceType[];
  loading?: boolean;
}

export function ServicePerformance({ services, loading }: ServicePerformanceProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Service Performance" subtitle="Loading..." />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  // Calculate total for percentage
  const totalRevenue = services.reduce((sum, s) => sum + s.totalRevenue, 0);

  return (
    <Card>
      <CardHeader
        title="Service Performance"
        subtitle="Most popular services"
      />

      {services.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No data available</p>
      ) : (
        <div className="space-y-4">
          {services.map((service) => {
            const percentage = totalRevenue > 0 
              ? ((service.totalRevenue / totalRevenue) * 100).toFixed(1)
              : 0;

            return (
              <div key={service.serviceId}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {service.serviceName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {service.timesProvided} time{service.timesProvided !== 1 ? 's' : ''} provided
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(service.totalRevenue)}
                    </p>
                    <p className="text-sm text-gray-500">{percentage}%</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}