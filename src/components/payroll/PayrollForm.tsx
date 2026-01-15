import React, { useState, useEffect } from 'react';
import { FormInput } from '../common/FormInput';
import { FormSelect } from '../common/FormSelect';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  hourlyRate: number;
  isActive: boolean;
}

interface Payroll {
  id?: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  totalHoursWorked: number;
  commissionsEarned: number;
  grossSalary: number;
  taxDeductions: number;
  netSalary: number;
  payrollDate?: string;
}

interface PayrollFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payroll: Payroll) => void;
  employees: Employee[];
  onCalculateCommissions?: (employeeId: string, startDate: string, endDate: string) => Promise<number>;
}

export const PayrollForm: React.FC<PayrollFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employees,
  onCalculateCommissions,
}) => {
  const [formData, setFormData] = useState<Payroll>({
    employeeId: '',
    startDate: '',
    endDate: '',
    totalHoursWorked: 0,
    commissionsEarned: 0,
    grossSalary: 0,
    taxDeductions: 0,
    netSalary: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default date range (last 15 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 15);

      setFormData({
        employeeId: '',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalHoursWorked: 0,
        commissionsEarned: 0,
        grossSalary: 0,
        taxDeductions: 0,
        netSalary: 0,
      });
      setSelectedEmployee(null);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.employeeId) {
      const employee = employees.find(e => e.id === formData.employeeId);
      setSelectedEmployee(employee || null);
    }
  }, [formData.employeeId, employees]);

  useEffect(() => {
    calculatePayroll();
  }, [formData.totalHoursWorked, formData.commissionsEarned, selectedEmployee]);

  const calculatePayroll = () => {
    if (!selectedEmployee) return;

    const hourlyWages = formData.totalHoursWorked * selectedEmployee.hourlyRate;
    const grossSalary = hourlyWages + formData.commissionsEarned;
    const taxRate = 0.15; // 15% tax rate (adjust as needed)
    const taxDeductions = grossSalary * taxRate;
    const netSalary = grossSalary - taxDeductions;

    setFormData(prev => ({
      ...prev,
      grossSalary,
      taxDeductions,
      netSalary,
    }));
  };

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

  const handleCalculateCommissions = async () => {
    if (!formData.employeeId || !formData.startDate || !formData.endDate) {
      setErrors(prev => ({
        ...prev,
        general: 'Please select employee and date range first',
      }));
      return;
    }

    if (onCalculateCommissions) {
      setIsCalculating(true);
      try {
        const commissions = await onCalculateCommissions(
          formData.employeeId,
          formData.startDate,
          formData.endDate
        );
        setFormData(prev => ({ ...prev, commissionsEarned: commissions }));
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          general: 'Failed to calculate commissions',
        }));
      } finally {
        setIsCalculating(false);
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.totalHoursWorked < 0) {
      newErrors.totalHoursWorked = 'Hours worked cannot be negative';
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
  const employeeOptions = activeEmployees.map(emp => ({
    value: emp.id,
    label: `${emp.firstName} ${emp.lastName}`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Generate Payroll"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}

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

        {selectedEmployee && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Hourly Rate:</strong> ${selectedEmployee.hourlyRate.toFixed(2)}/hour
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            required
            error={errors.startDate}
          />

          <FormInput
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            required
            error={errors.endDate}
          />
        </div>

        <div className="border-t border-gray-200 my-4 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Earnings</h4>
          
          <FormInput
            label="Total Hours Worked"
            name="totalHoursWorked"
            type="number"
            value={formData.totalHoursWorked}
            onChange={handleChange}
            required
            min={0}
            step={0.5}
            error={errors.totalHoursWorked}
            placeholder="0"
          />

          <div className="flex gap-2 items-end mb-4">
            <FormInput
              label="Commissions Earned"
              name="commissionsEarned"
              type="number"
              value={formData.commissionsEarned}
              onChange={handleChange}
              min={0}
              step={0.01}
              placeholder="0.00"
              className="flex-1"
            />
            {onCalculateCommissions && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleCalculateCommissions}
                disabled={isCalculating || !formData.employeeId}
              >
                {isCalculating ? 'Calculating...' : 'Auto-Calculate'}
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 my-4 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Summary</h4>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Hourly Wages:</span>
              <span className="font-medium">
                ${(formData.totalHoursWorked * (selectedEmployee?.hourlyRate || 0)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Commissions:</span>
              <span className="font-medium">${formData.commissionsEarned.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-600">Gross Salary:</span>
              <span className="font-semibold text-lg">${formData.grossSalary.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax Deductions (15%):</span>
              <span className="text-red-600">-${formData.taxDeductions.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
              <span className="font-semibold text-gray-900">Net Salary:</span>
              <span className="font-bold text-xl text-green-600">
                ${formData.netSalary.toFixed(2)}
              </span>
            </div>
          </div>
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
            variant="success"
          >
            Generate Payroll
          </Button>
        </div>
      </form>
    </Modal>
  );
};