'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { leaveBalanceApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AddLeaveBalancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    year: new Date().getFullYear(),
    leave_type: 'annual',
    total_days: 0,
    used_days: 0,
    pending_days: 0,
    remaining_days: 0,
    carry_forward: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      };
      
      // Auto-calculate remaining days
      updated.remaining_days = updated.total_days + updated.carry_forward - updated.used_days - updated.pending_days;
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await leaveBalanceApi.create(formData);
      toast.success('Leave balance created successfully');
      router.push('/leaves/balances');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create leave balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leaves/balances" className="p-2 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add Leave Balance</h1>
          <p className="text-gray-500">Configure employee leave entitlements</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Balance Information</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                min="2020"
                max="2030"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
              <select name="leave_type" value={formData.leave_type} onChange={handleChange} required className="input-field">
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="unpaid">Unpaid Leave</option>
                <option value="bereavement">Bereavement Leave</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Days *</label>
              <input
                type="number"
                name="total_days"
                value={formData.total_days}
                onChange={handleChange}
                required
                min="0"
                step="0.5"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Days Configuration */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Days Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carry Forward</label>
              <input
                type="number"
                name="carry_forward"
                value={formData.carry_forward}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">Days from previous year</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Used Days</label>
              <input
                type="number"
                name="used_days"
                value={formData.used_days}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pending Days</label>
              <input
                type="number"
                name="pending_days"
                value={formData.pending_days}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">Pending approval</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Days</label>
              <input
                type="number"
                name="remaining_days"
                value={formData.remaining_days}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="input-field bg-gray-50"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Balance Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-800">{formData.total_days}</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Carry Forward</p>
              <p className="text-xl font-bold text-blue-600">{formData.carry_forward}</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Used</p>
              <p className="text-xl font-bold text-red-600">{formData.used_days}</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{formData.pending_days}</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-xl font-bold text-green-600">{formData.remaining_days}</p>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/leaves/balances" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            <FiSave size={20} />
            {loading ? 'Saving...' : 'Save Balance'}
          </button>
        </div>
      </form>
    </div>
  );
}
