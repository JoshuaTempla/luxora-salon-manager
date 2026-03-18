import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContex';
import { LoginPage } from '@/components/auth';
import { Layout } from '@/components/layout';
import { DashboardPage } from '@/components/dashboard';
import { EmployeesPage } from '@/components/employees';
import { ServicesPage } from '@/components/services';
import { TransactionsPage } from '@/components/transactions';
import { ExpensesPage } from '@/components/expenses';
import { PayrollPage } from '@/components/payroll';
import { AnalyticsPage } from '@/components/analytics';

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}