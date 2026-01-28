// Hook for service-related operations

import { useState, useEffect, useCallback } from 'react';
import { serviceService } from '@/services/serviceService';
import { Service, CreateServiceDto, UpdateServiceDto } from '@/types';
import { useApi } from './useApi';

export function useServices(includeInactive = false) {
  const [services, setServices] = useState<Service[]>([]);
  const { loading, error, execute } = useApi<Service[]>();
  const singleApi = useApi<Service>(); // Separate API hook for single service operations

  const fetchServices = useCallback(async () => {
    const result = await execute(() => serviceService.getAll(includeInactive));
    if (result) {
      setServices(result);
    }
  }, [execute, includeInactive]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const createService = async (data: CreateServiceDto): Promise<Service | null> => {
    const result = await singleApi.execute(() => serviceService.create(data));
    if (result) {
      setServices((prev) => [...prev, result]);
    }
    return result;
  };

  const updateService = async (id: string, data: UpdateServiceDto): Promise<Service | null> => {
    const result = await singleApi.execute(() => serviceService.update(id, data));
    if (result) {
      setServices((prev) => prev.map((svc) => (svc.id === id ? result : svc)));
    }
    return result;
  };

  const deactivateService = async (id: string): Promise<Service | null> => {
    const result = await singleApi.execute(() => serviceService.deactivate(id));
    if (result) {
      setServices((prev) => prev.map((svc) => (svc.id === id ? result : svc)));
    }
    return result;
  };

  const activateService = async (id: string): Promise<Service | null> => {
    const result = await singleApi.execute(() => serviceService.activate(id));
    if (result) {
      setServices((prev) => prev.map((svc) => (svc.id === id ? result : svc)));
    }
    return result;
  };

  const deleteService = async (id: string): Promise<boolean> => {
    try {
      await serviceService.delete(id);
      setServices((prev) => prev.filter((svc) => svc.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  return {
    services,
    loading: loading || singleApi.loading,
    error: error || singleApi.error,
    refetch: fetchServices,
    createService,
    updateService,
    deactivateService,
    activateService,
    deleteService,
  };
}