// Display top performing employees

import React from 'react';
import { Card, CardHeader, Badge } from '@/components/common';
import { TopPerformer } from '@/types';
import { formatCurrency } from '@/utils';

interface TopPerformersProps {
  performers: TopPerformer[];
  loading?: boolean;
}

export function TopPerformers({ performers, loading }: TopPerformersProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Top Performers" subtitle="Loading..." />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Top Performers"
        subtitle="Highest sales this period"
      />
      
      {performers.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No data available</p>
      ) : (
        <div className="space-y-3">
          {performers.map((performer, index) => (
            <div
              key={performer.employeeId}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0
                      ? 'bg-yellow-500'
                      : index === 1
                      ? 'bg-gray-400'
                      : index === 2
                      ? 'bg-orange-600'
                      : 'bg-gray-300'
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {performer.employeeName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {performer.transactionCount} transaction{performer.transactionCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {formatCurrency(performer.totalSales)}
                </p>
                <p className="text-sm text-green-600">
                  {formatCurrency(performer.commissionsEarned)} commission
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}