// Main dashboard page with overview and analytics

import React, { useState, useMemo } from 'react';
import { StatCard } from './StatCard';
import { TopPerformers } from './TopPerformers';
import { ServicePerformance } from './ServicePerformance';
import { RecentTransactions } from './RecentTransactions';
import { Card, CardHeader, Select, LoadingSpinner, ErrorMessage } from '@/components/common';
import {
  useDashboardStats,
  useTopPerformers,
  useServicePerformance,
  useTransactions,
} from '@/hooks';
import { formatCurrency, getDateRange } from '@/utils';
import { DATE_RANGE_PRESETS } from '@/types';

export function DashboardPage() {
  const [dateRange, setDateRange] = useState<string>(DATE_RANGE_PRESETS.THIS_MONTH);

  // Get date range
  const { startDate, endDate } = useMemo(() => {
    return getDateRange(dateRange);
  }, [dateRange]);

  // Fetch dashboard data
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { topPerformers, loading: performersLoading } = useTopPerformers(startDate, endDate, 5);
  const { servicePerformance, loading: servicesLoading } = useServicePerformance(startDate, endDate);
  const { transactions, loading: transactionsLoading } = useTransactions({ startDate, endDate });

  const dateRangeOptions = [
    { label: 'Today', value: DATE_RANGE_PRESETS.TODAY },
    { label: 'This Week', value: DATE_RANGE_PRESETS.THIS_WEEK },
    { label: 'This Month', value: DATE_RANGE_PRESETS.THIS_MONTH },
    { label: 'Last Month', value: DATE_RANGE_PRESETS.LAST_MONTH },
    { label: 'This Year', value: DATE_RANGE_PRESETS.THIS_YEAR },
  ];

  // Icons for stat cards
  const DollarIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const UsersIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const ChartIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const CashIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  if (statsLoading && !stats) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  if (statsError && !stats) {
    return <ErrorMessage message={statsError} fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your salon overview</p>
        </div>
        <Select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          options={dateRangeOptions}
        />
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Sales"
            value={formatCurrency(stats?.todaySales?.total ?? 0)}
            subtitle={`${stats?.todaySales?.count ?? 0 } transaction${(stats?.todaySales?.count ?? 0) !== 1 ? 's' : ''}`}
            icon={DollarIcon}
            color="green"
          />
          <StatCard
            title="Month Sales"
            value={formatCurrency(stats?.monthSales?.total ?? 0)}
            subtitle={`${stats?.monthSales?.count ?? 0} transaction${(stats?.monthSales?.count ?? 0) !== 1 ? 's' : ''}`}
            icon={ChartIcon}
            color="blue"
          />
          <StatCard
            title="Active Employees"
            value={stats?.activeEmployees ?? 0}
            subtitle={`${stats?.activeServices ?? 0 } active services`}
            icon={UsersIcon}
            color="purple"
          />
          <StatCard
            title="Month Commissions"
            value={formatCurrency(stats?.monthSales?.commissions ?? 0)}
            subtitle="Paid to employees"
            icon={CashIcon}
            color="yellow"
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <TopPerformers 
          performers={topPerformers || []} 
          loading={performersLoading}
        />

        {/* Service Performance */}
        <ServicePerformance 
          services={servicePerformance || []} 
          loading={servicesLoading}
        />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions 
        transactions={transactions} 
        loading={transactionsLoading}
      />
    </div>
  );
}