'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { leaveApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ApplyLeavePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    total_days: 1,
    status: 'pending',
    reason: '',
    emergency_contact_during_leave: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_days' ? parseFloat(value) || 0 : value
    }));
  };

  // Calculate total days when dates change
  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setFormData(prev => ({
        ...prev,
        total_days: Math.max(1, diffDays)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await leaveApi.create(formData);
      toast.success('Leave request submitted successfully');
      router.push('/leaves');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leaves" className="p-2 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Apply for Leave</h1>
          <p className="text-gray-500">Submit a new leave request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
              <select name="leave_type" value={formData.leave_type} onChange={handleChange} className="input-field">
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="unpaid">Unpaid Leave</option>
                <option value="compensatory">Compensatory Leave</option>
                <option value="bereavement">Bereavement Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={(e) => {
                  handleChange(e);
                  setTimeout(calculateDays, 0);
                }}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={(e) => {
                  handleChange(e);
                  setTimeout(calculateDays, 0);
                }}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Days *</label>
              <input
                type="number"
                name="total_days"
                value={formData.total_days}
                onChange={handleChange}
                min="0.5"
                step="0.5"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                name="emergency_contact_during_leave"
                value={formData.emergency_contact_during_leave}
                onChange={handleChange}
                className="input-field"
                placeholder="Phone number"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                rows={3}
                className="input-field"
                placeholder="Please provide the reason for your leave request..."
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/leaves" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            <FiSave size={20} />
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
