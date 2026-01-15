import React, { useState, useEffect } from 'react';
import { FormInput } from '../common/FormInput';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface Service {
  id?: string;
  name: string;
  price: number;
  commissionRate: number;
  isActive: boolean;
}

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (service: Service) => void;
  initialData?: Service;
  mode: 'create' | 'edit';
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const [formData, setFormData] = useState<Service>({
    name: '',
    price: 0,
    commissionRate: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        price: 0,
        commissionRate: 0,
        isActive: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.commissionRate < 0 || formData.commissionRate > 100) {
      newErrors.commissionRate = 'Commission rate must be between 0 and 100%';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={mode === 'create' ? 'Add New Service' : 'Edit Service'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Service Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          error={errors.name}
          placeholder="e.g., Haircut, Hair Color, Beard Trim"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Price ($)"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            required
            min={0}
            step={0.01}
            error={errors.price}
            placeholder="50.00"
          />

          <FormInput
            label="Commission Rate (%)"
            name="commissionRate"
            type="number"
            value={formData.commissionRate}
            onChange={handleChange}
            required
            min={0}
            max={100}
            step={0.1}
            error={errors.commissionRate}
            placeholder="15.0"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Active Service</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Inactive services won't appear in transaction forms
          </p>
        </div>

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
          >
            {mode === 'create' ? 'Create Service' : 'Update Service'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};