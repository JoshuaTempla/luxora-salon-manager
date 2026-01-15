// Employee CRUD operations

import { apiClient } from './api';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  hourlyRate: number;
  baseCommission: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  position: string;
  hourlyRate: number;
  baseCommission: number;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  isActive?: boolean;
}

export const employeeService = {
  // Get all employees
  async getAll(includeInactive = false): Promise<Employee[]> {
    const query = includeInactive ? '?includeInactive=true' : '';
    return apiClient.get<Employee[]>(`/employees${query}`);
  },

  // Get single employee by ID
  async getById(id: string): Promise<Employee> {
    return apiClient.get<Employee>(`/employees/${id}`);
  },

  // Create new employee
  async create(data: CreateEmployeeDto): Promise<Employee> {
    return apiClient.post<Employee>('/employees', data);
  },

  // Update employee
  async update(id: string, data: UpdateEmployeeDto): Promise<Employee> {
    return apiClient.put<Employee>(`/employees/${id}`, data);
  },

  // Soft delete (set isActive to false)
  async deactivate(id: string): Promise<Employee> {
    return apiClient.put<Employee>(`/employees/${id}`, { isActive: false });
  },

  // Reactivate employee
  async activate(id: string): Promise<Employee> {
    return apiClient.put<Employee>(`/employees/${id}`, { isActive: true });
  },

  // Hard delete
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/employees/${id}`);
  },
};