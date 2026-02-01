// Main page for managing employees

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
import { EmployeeList } from './EmployeeList';
import { EmployeeForm } from './EmployeeForm';
import { useEmployees } from '@/hooks';
import { Employee, CreateEmployeeDto } from '@/types';

export function EmployeesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    activateEmployee,
    deactivateEmployee,
  } = useEmployees(showInactive);

  const handleOpenModal = (employee?: Employee) => {
    setSelectedEmployee(employee || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleSubmit = async (data: CreateEmployeeDto) => {
    try {
      if (selectedEmployee) {
        await updateEmployee(selectedEmployee.id, data);
        setSuccessMessage('Employee updated successfully!');
      } else {
        await createEmployee(data);
        setSuccessMessage('Employee created successfully!');
      }
      handleCloseModal();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save employee:', err);
    }
  };

  const handleDelete = async (employee: Employee) => {
    try {
      await deleteEmployee(employee.id);
      setSuccessMessage('Employee deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete employee:', err);
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      if (employee.isActive) {
        await deactivateEmployee(employee.id);
        setSuccessMessage('Employee deactivated successfully!');
      } else {
        await activateEmployee(employee.id);
        setSuccessMessage('Employee activated successfully!');
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to toggle employee status:', err);
    }
  };

  if (loading && employees.length === 0) {
    return <LoadingSpinner fullScreen message="Loading employees..." />;
  }

  if (error && employees.length === 0) {
    return <ErrorMessage message={error} fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">Manage your salon team</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Add Employee
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
          title="All Employees"
          subtitle={`${employees.length} total employee${employees.length !== 1 ? 's' : ''}`}
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
          <EmployeeList
            employees={employees}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedEmployee ? 'Edit Employee' : 'Create New Employee'}
        size="lg"
      >
        <EmployeeForm
          employee={selectedEmployee}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSubmitting={loading}
        />
      </Modal>
    </div>
  );
}