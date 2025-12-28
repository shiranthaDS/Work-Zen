'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { salaryStructureApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AddSalaryStructurePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    basic_salary: 0,
    currency: 'USD',
    pay_frequency: 'monthly',
    housing_allowance: 0,
    transport_allowance: 0,
    meal_allowance: 0,
    other_allowances: 0,
    tax_rate: 0,
    insurance_rate: 0,
    pension_rate: 0,
    effective_date: '',
    is_active: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
             : type === 'number' ? parseFloat(value) || 0 
             : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await salaryStructureApi.create(formData);
      toast.success('Salary structure created successfully');
      router.push('/payroll/salary-structures');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create salary structure');
    } finally {
      setLoading(false);
    }
  };

  const totalAllowances = formData.housing_allowance + formData.transport_allowance + 
                         formData.meal_allowance + formData.other_allowances;
  const grossSalary = formData.basic_salary + totalAllowances;
  const totalDeductionRate = formData.tax_rate + formData.insurance_rate + formData.pension_rate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/payroll/salary-structures" className="p-2 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add Salary Structure</h1>
          <p className="text-gray-500">Define employee compensation structure</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="EMP001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary *</label>
              <input
                type="number"
                name="basic_salary"
                value={formData.basic_salary}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select name="currency" value={formData.currency} onChange={handleChange} className="input-field">
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="LKR">LKR - Sri Lankan Rupee</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Frequency</label>
              <select name="pay_frequency" value={formData.pay_frequency} onChange={handleChange} className="input-field">
                <option value="monthly">Monthly</option>
                <option value="bi_weekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Allowances */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Allowances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Housing Allowance</label>
              <input
                type="number"
                name="housing_allowance"
                value={formData.housing_allowance}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance</label>
              <input
                type="number"
                name="transport_allowance"
                value={formData.transport_allowance}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Allowance</label>
              <input
                type="number"
                name="meal_allowance"
                value={formData.meal_allowance}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Other Allowances</label>
              <input
                type="number"
                name="other_allowances"
                value={formData.other_allowances}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Deduction Rates */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Deduction Rates (%)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                name="tax_rate"
                value={formData.tax_rate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Rate (%)</label>
              <input
                type="number"
                name="insurance_rate"
                value={formData.insurance_rate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pension Rate (%)</label>
              <input
                type="number"
                name="pension_rate"
                value={formData.pension_rate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Effective Date and Status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Validity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
              <input
                type="date"
                name="effective_date"
                value={formData.effective_date}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Active Structure</span>
              </label>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Salary Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Basic Salary</p>
              <p className="text-xl font-bold text-gray-800">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(formData.basic_salary)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Total Allowances</p>
              <p className="text-xl font-bold text-blue-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(totalAllowances)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Gross Salary</p>
              <p className="text-xl font-bold text-green-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(grossSalary)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Total Deduction Rate</p>
              <p className="text-xl font-bold text-red-600">{totalDeductionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/payroll/salary-structures" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            <FiSave size={20} />
            {loading ? 'Saving...' : 'Save Structure'}
          </button>
        </div>
      </form>
    </div>
  );
}
