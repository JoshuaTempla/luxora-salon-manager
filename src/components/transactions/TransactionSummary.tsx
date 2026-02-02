// Display transaction summary stats

import React from 'react';
import { Card } from '@/components/common';
import { formatCurrency } from '@/utils';

interface TransactionSummaryProps {
  totalSales: number;
  totalCommissions: number;
  transactionCount: number;
}

export function TransactionSummary({
  totalSales,
  totalCommissions,
  transactionCount,
}: TransactionSummaryProps) {
  const averageTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card padding="md" hover>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-600">Total Sales</span>
          <span className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(totalSales)}
          </span>
        </div>
      </Card>

      <Card padding="md" hover>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-600">Total Commissions</span>
          <span className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(totalCommissions)}
          </span>
        </div>
      </Card>

      <Card padding="md" hover>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-600">Transactions</span>
          <span className="text-2xl font-bold text-gray-900 mt-1">
            {transactionCount}
          </span>
        </div>
      </Card>

      <Card padding="md" hover>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-600">Average Sale</span>
          <span className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(averageTransaction)}
          </span>
        </div>
      </Card>
    </div>
  );
}