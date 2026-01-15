import React, { useState, useEffect } from 'react';
import { FormInput } from '../common/FormInput';
import { FormSelect } from '../common/FormSelect';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface Employee {
  id?: string;
  firstName: string;
  lastName: string;
  position: string;
  hourlyRate: number;
  baseCommission: number;
  isActive: boolean;
}

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employee: Employee) => void;
  initialData?: Employee;
  mode: 'create' | 'edit';
}

const POSITIONS = [
  { value: 'STYLIST', label: 'Stylist' },
  { value: 'COLORIST', label: 'Colorist' },
  { value: 'BARBER', label: 'Barber' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'MANAGER', label: 'Manager' },
];

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const [formData, setFormData] = useState<Employee>({
    firstName: '',
    lastName: '',
    position: '',
    hourlyRate: 0,
    baseCommission: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        position: '',
        hourlyRate: 0,
        baseCommission: 0,
        isActive: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.position) {
      newErrors.position = 'Position is required';
    }

    if (formData.hourlyRate < 0) {
      newErrors.hourlyRate = 'Hourly rate must be positive';
    }

    if (formData.baseCommission < 0 || formData.baseCommission > 100) {
      newErrors.baseCommission = 'Commission must be between 0 and 100%';
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
      title={mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            error={errors.firstName}
            placeholder="John"
          />

          <FormInput
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            error={errors.lastName}
            placeholder="Doe"
          />
        </div>

        <FormSelect
          label="Position"
          name="position"
          value={formData.position}
          onChange={handleChange}
          options={POSITIONS}
          required
          error={errors.position}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Hourly Rate"
            name="hourlyRate"
            type="number"
            value={formData.hourlyRate}
            onChange={handleChange}
            required
            min={0}
            step={0.01}
            error={errors.hourlyRate}
            placeholder="15.00"
          />

          <FormInput
            label="Base Commission (%)"
            name="baseCommission"
            type="number"
            value={formData.baseCommission}
            onChange={handleChange}
            required
            min={0}
            max={100}
            step={0.1}
            error={errors.baseCommission}
            placeholder="10.0"
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
            <span className="text-sm font-medium text-gray-700">Active Employee</span>
          </label>
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
            {mode === 'create' ? 'Create Employee' : 'Update Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};