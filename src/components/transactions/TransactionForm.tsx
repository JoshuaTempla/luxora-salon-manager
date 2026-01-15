import React, { useState, useEffect } from 'react';
import { FormSelect } from '../common/FormSelect';
import { FormInput } from '../common/FormInput';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  isActive: boolean;
}

interface Transaction {
  id?: string;
  employeeId: string;
  serviceId: string;
  soldPrice: number;
  commissionAmount: number;
  createdAt?: string;
}

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Transaction) => void;
  employees: Employee[];
  services: Service[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employees,
  services,
}) => {
  const [formData, setFormData] = useState<Transaction>({
    employeeId: '',
    serviceId: '',
    soldPrice: 0,
    commissionAmount: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        employeeId: '',
        serviceId: '',
        soldPrice: 0,
        commissionAmount: 0,
      });
      setSelectedService(null);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.serviceId) {
      const service = services.find(s => s.id === formData.serviceId);
      if (service) {
        setSelectedService(service);
        setFormData(prev => ({
          ...prev,
          soldPrice: service.price,
          commissionAmount: (service.price * service.commissionRate) / 100,
        }));
      }
    }
  }, [formData.serviceId, services]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    const commissionRate = selectedService?.commissionRate || 0;
    
    setFormData(prev => ({
      ...prev,
      soldPrice: newPrice,
      commissionAmount: (newPrice * commissionRate) / 100,
    }));

    if (errors.soldPrice) {
      setErrors(prev => ({ ...prev, soldPrice: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }

    if (!formData.serviceId) {
      newErrors.serviceId = 'Please select a service';
    }

    if (formData.soldPrice <= 0) {
      newErrors.soldPrice = 'Price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleCancel = () => {
    setErrors({});
    onClose();
  };

  const activeEmployees = employees.filter(e => e.isActive);
  const activeServices = services.filter(s => s.isActive);

  const employeeOptions = activeEmployees.map(emp => ({
    value: emp.id,
    label: `${emp.firstName} ${emp.lastName}`,
  }));

  const serviceOptions = activeServices.map(svc => ({
    value: svc.id,
    label: `${svc.name} - $${svc.price.toFixed(2)}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="New Transaction"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {activeEmployees.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              No active employees available. Please add employees first.
            </p>
          </div>
        ) : activeServices.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              No active services available. Please add services first.
            </p>
          </div>
        ) : (
          <>
            <FormSelect
              label="Employee"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              options={employeeOptions}
              required
              error={errors.employeeId}
              placeholder="Select employee"
            />

            <FormSelect
              label="Service"
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              options={serviceOptions}
              required
              error={errors.serviceId}
              placeholder="Select service"
            />

            {selectedService && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Default Price:</span>
                    <span className="ml-2 font-medium">${selectedService.price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Commission Rate:</span>
                    <span className="ml-2 font-medium">{selectedService.commissionRate}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Sold Price"
                name="soldPrice"
                type="number"
                value={formData.soldPrice}
                onChange={handlePriceChange}
                required
                min={0}
                step={0.01}
                error={errors.soldPrice}
                placeholder="0.00"
              />

              <FormInput
                label="Commission Amount"
                name="commissionAmount"
                type="number"
                value={formData.commissionAmount}
                onChange={() => {}}
                disabled
                step={0.01}
                placeholder="0.00"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Commission is automatically calculated based on the service's commission rate. 
                You can adjust the sold price if it differs from the default.
              </p>
            </div>
          </>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={activeEmployees.length === 0 || activeServices.length === 0}
          >
            Create Transaction
          </Button>
        </div>
      </form>
    </Modal>
  );
};