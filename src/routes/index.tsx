// src/routes/index.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '@/components/dashboard';
import { EmployeesPage } from '@/components/employees';
import { ServicesPage } from '@/components/services';
import { TransactionsPage } from '@/components/transactions';
import { ExpensesPage } from '@/components/expenses';
import { PayrollPage } from '@/components/payroll';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/expenses" element={<ExpensesPage />} />
      <Route path="/payroll" element={<PayrollPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}