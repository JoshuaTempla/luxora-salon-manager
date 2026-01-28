// src/hooks/useEmployees.ts
// Hook for employee-related operations

import { useState, useEffect, useCallback } from 'react';
import { employeeService } from '@/services/employeeService';
import { Employee, CreateEmployeeDto, UpdateEmployeeDto } from '@/types';
import { useApi } from './useApi';

export function useEmployees(includeInactive = false) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { loading, error, execute } = useApi<Employee[]>();
  const singleApi = useApi<Employee>(); // Separate API hook for single employee operations

  const fetchEmployees = useCallback(async () => {
    const result = await execute(() => employeeService.getAll(includeInactive));
    if (result) {
      setEmployees(result);
    }
  }, [execute, includeInactive]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const createEmployee = async (data: CreateEmployeeDto): Promise<Employee | null> => {
    const result = await singleApi.execute(() => employeeService.create(data));
    if (result) {
      setEmployees((prev) => [...prev, result]);
    }
    return result;
  };

  const updateEmployee = async (id: string, data: UpdateEmployeeDto): Promise<Employee | null> => {
    const result = await singleApi.execute(() => employeeService.update(id, data));
    if (result) {
      setEmployees((prev) => prev.map((emp) => (emp.id === id ? result : emp)));
    }
    return result;
  };

  const deactivateEmployee = async (id: string): Promise<Employee | null> => {
    const result = await singleApi.execute(() => employeeService.deactivate(id));
    if (result) {
      setEmployees((prev) => prev.map((emp) => (emp.id === id ? result : emp)));
    }
    return result;
  };

  const activateEmployee = async (id: string): Promise<Employee | null> => {
    const result = await singleApi.execute(() => employeeService.activate(id));
    if (result) {
      setEmployees((prev) => prev.map((emp) => (emp.id === id ? result : emp)));
    }
    return result;
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    try {
      await employeeService.delete(id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  return {
    employees,
    loading: loading || singleApi.loading,
    error: error || singleApi.error,
    refetch: fetchEmployees,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    activateEmployee,
    deleteEmployee,
  };
}