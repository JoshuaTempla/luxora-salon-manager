// Display recent transactions

import React from 'react';
import { Card, CardHeader, Badge } from '@/components/common';
import { Transaction } from '@/types';
import { formatCurrency, formatTime, formatDate } from '@/utils';

interface RecentTransactionsProps {
  transactions: Transaction[];
  loading?: boolean;
}

export function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Recent Transactions" subtitle="Loading..." />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  // Get latest 10 transactions
  const recentTransactions = transactions.slice(0, 10);

  return (
    <Card>
      <CardHeader
        title="Recent Transactions"
        subtitle={`Latest ${recentTransactions.length} sales`}
      />

      {recentTransactions.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No transactions yet</p>
      ) : (
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">
                    {transaction.service?.name || 'Unknown Service'}
                  </p>
                  <Badge variant="info" size="sm">
                    {formatCurrency(transaction.soldPrice)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {transaction.employee
                    ? `${transaction.employee.firstName} ${transaction.employee.lastName}`
                    : 'Unknown Employee'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(transaction.createdAt, 'short')} at {formatTime(transaction.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600 font-medium">
                  {formatCurrency(transaction.commissionAmount)}
                </p>
                <p className="text-xs text-gray-500">commission</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}