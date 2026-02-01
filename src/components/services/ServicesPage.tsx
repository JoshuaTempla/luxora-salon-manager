// Main page for managing services

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  Button,
  Modal,
  LoadingSpinner,
  ErrorMessage,
  Alert,
} from '@/components/common';
import { ServiceList } from './ServiceList';
import { ServiceForm } from './ServiceForm';
import { useServices } from '@/hooks';
import { Service, CreateServiceDto } from '@/types';

export function ServicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    activateService,
    deactivateService,
  } = useServices(showInactive);

  const handleOpenModal = (service?: Service) => {
    setSelectedService(service || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleSubmit = async (data: CreateServiceDto) => {
    try {
      if (selectedService) {
        await updateService(selectedService.id, data);
        setSuccessMessage('Service updated successfully!');
      } else {
        await createService(data);
        setSuccessMessage('Service created successfully!');
      }
      handleCloseModal();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save service:', err);
    }
  };

  const handleDelete = async (service: Service) => {
    try {
      await deleteService(service.id);
      setSuccessMessage('Service deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      if (service.isActive) {
        await deactivateService(service.id);
        setSuccessMessage('Service deactivated successfully!');
      } else {
        await activateService(service.id);
        setSuccessMessage('Service activated successfully!');
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to toggle service status:', err);
    }
  };

  if (loading && services.length === 0) {
    return <LoadingSpinner fullScreen message="Loading services..." />;
  }

  if (error && services.length === 0) {
    return <ErrorMessage message={error} fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage your salon services</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Add Service
        </Button>
      </div>

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          title="All Services"
          subtitle={`${services.length} total service${services.length !== 1 ? 's' : ''}`}
          action={
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Show inactive
              </label>
            </div>
          }
        />

        {loading ? (
          <LoadingSpinner message="Updating..." />
        ) : (
          <ServiceList
            services={services}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedService ? 'Edit Service' : 'Create New Service'}
        size="lg"
      >
        <ServiceForm
          service={selectedService}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSubmitting={loading}
        />
      </Modal>
    </div>
  );
}