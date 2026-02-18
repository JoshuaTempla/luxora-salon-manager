// Analytics page with cutoff-based sales and net sales reporting

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, LoadingSpinner, Input, Button } from '@/components/common';
import { analyticsService } from '@/services/analyticsService';
import { formatCurrency } from '@/utils';

export function AnalyticsPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-indexed

  const [grossSalesData, setGrossSalesData] = useState<any>(null);
  const [netSalesData, setNetSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [selectedYear, selectedMonth]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [grossSales, netSales] = await Promise.all([
        analyticsService.getMonthlyCutoffReports(selectedYear, selectedMonth),
        analyticsService.getMonthlyNetSalesReports(selectedYear, selectedMonth),
      ]);
      setGrossSalesData(grossSales);
      setNetSalesData(netSales);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', {
    month: 'long',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
        <p className="text-gray-600 mt-1">
          View gross sales and net sales by payroll cutoff periods
        </p>
      </div>

      {/* Date selector */}
      <Card>
        <CardHeader title="Select Period" />
        <div className="flex items-end gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              fullWidth
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={fetchReports} variant="primary">
            Refresh
          </Button>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner message="Loading analytics..." />
      ) : (
        <>
          {/* Gross Sales Section */}
          {grossSalesData && (
            <Card>
              <CardHeader
                title={`Gross Sales — ${monthName} ${selectedYear}`}
                subtitle="Total revenue from all transactions"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1st Cutoff */}
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-1">
                    1st Cutoff (1-15)
                  </p>
                  <p className="text-3xl font-bold text-blue-900 mb-2">
                    {formatCurrency(grossSalesData.firstCutoff.grossSales)}
                  </p>
                  <div className="text-xs text-blue-600 space-y-1">
                    <p>{grossSalesData.firstCutoff.transactionCount} transactions</p>
                    <p>
                      Avg: {formatCurrency(grossSalesData.firstCutoff.averageTransactionValue)}
                    </p>
                  </div>
                </div>

                {/* 2nd Cutoff */}
                <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-1">
                    2nd Cutoff (16-End)
                  </p>
                  <p className="text-3xl font-bold text-green-900 mb-2">
                    {formatCurrency(grossSalesData.secondCutoff.grossSales)}
                  </p>
                  <div className="text-xs text-green-600 space-y-1">
                    <p>{grossSalesData.secondCutoff.transactionCount} transactions</p>
                    <p>
                      Avg: {formatCurrency(grossSalesData.secondCutoff.averageTransactionValue)}
                    </p>
                  </div>
                </div>

                {/* Full Month */}
                <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
                  <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-1">
                    Full Month
                  </p>
                  <p className="text-3xl font-bold text-purple-900 mb-2">
                    {formatCurrency(grossSalesData.fullMonth.grossSales)}
                  </p>
                  <div className="text-xs text-purple-600 space-y-1">
                    <p>{grossSalesData.fullMonth.transactionCount} transactions</p>
                    <p>
                      Avg: {formatCurrency(grossSalesData.fullMonth.averageTransactionValue)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Net Sales Section */}
          {netSalesData && (
            <Card>
              <CardHeader
                title={`Net Sales (Business Owner Perspective) — ${monthName} ${selectedYear}`}
                subtitle="Gross Sales - Business Expenses - Gross Salaries"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1st Cutoff */}
                <div className="bg-white rounded-xl border border-gray-300 p-6">
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    1st Cutoff (1-15)
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Sales:</span>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(netSalesData.firstCutoff.grossSales)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Expenses:</span>
                      <span className="font-semibold text-red-500">
                        -{formatCurrency(netSalesData.firstCutoff.businessExpenses)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Salaries:</span>
                      <span className="font-semibold text-red-500">
                        -{formatCurrency(netSalesData.firstCutoff.totalGrossSalaries)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                      <span className="font-bold text-gray-900">Net Sales:</span>
                      <span
                        className={`font-bold text-lg ${
                          netSalesData.firstCutoff.netSales >= 0
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(netSalesData.firstCutoff.netSales)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2nd Cutoff */}
                <div className="bg-white rounded-xl border border-gray-300 p-6">
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    2nd Cutoff (16-End)
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Sales:</span>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(netSalesData.secondCutoff.grossSales)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Expenses:</span>
                      <span className="font-semibold text-red-500">
                        -{formatCurrency(netSalesData.secondCutoff.businessExpenses)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Salaries:</span>
                      <span className="font-semibold text-red-500">
                        -{formatCurrency(netSalesData.secondCutoff.totalGrossSalaries)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                      <span className="font-bold text-gray-900">Net Sales:</span>
                      <span
                        className={`font-bold text-lg ${
                          netSalesData.secondCutoff.netSales >= 0
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(netSalesData.secondCutoff.netSales)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Full Month */}
                <div className="bg-white rounded-xl border border-gray-300 p-6">
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Full Month
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Sales:</span>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(netSalesData.fullMonth.grossSales)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Expenses:</span>
                      <span className="font-semibold text-red-500">
                        -{formatCurrency(netSalesData.fullMonth.businessExpenses)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Salaries:</span>
                      <span className="font-semibold text-red-500">
                        -{formatCurrency(netSalesData.fullMonth.totalGrossSalaries)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                      <span className="font-bold text-gray-900">Net Sales:</span>
                      <span
                        className={`font-bold text-lg ${
                          netSalesData.fullMonth.netSales >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(netSalesData.fullMonth.netSales)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}