// Service CRUD operations

import { apiClient } from './api';

export type CommissionType = 'PERCENTAGE' | 'FIXED';

export interface Service {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  commissionType: CommissionType;
  isActive: boolean;
}

export interface CreateServiceDto {
  name: string;
  price: number;
  commissionRate: number;
  commissionType: CommissionType;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {
  isActive?: boolean;
}

export const serviceService = {
  // Get all services
  async getAll(includeInactive = false): Promise<Service[]> {
    const query = includeInactive ? '?includeInactive=true' : '';
    return apiClient.get<Service[]>(`/services${query}`);
  },

  // Get single service by ID
  async getById(id: string): Promise<Service> {
    return apiClient.get<Service>(`/services/${id}`);
  },

  // Create new service
  async create(data: CreateServiceDto): Promise<Service> {
    return apiClient.post<Service>('/services', data);
  },

  // Update service
  async update(id: string, data: UpdateServiceDto): Promise<Service> {
    return apiClient.put<Service>(`/services/${id}`, data);
  },

  // Soft delete (set isActive to false)
  async deactivate(id: string): Promise<Service> {
    return apiClient.put<Service>(`/services/${id}`, { isActive: false });
  },

  // Reactivate service
  async activate(id: string): Promise<Service> {
    return apiClient.put<Service>(`/services/${id}`, { isActive: true });
  },

  // Hard delete
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/services/${id}`);
  },
};