'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { leaveApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditLeavePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    total_days: 1,
    reason: '',
    status: 'pending',
    approved_by: '',
    approval_date: '',
    rejection_reason: '',
    is_half_day: false,
    half_day_type: '',
    notes: '',
  });

  useEffect(() => {
    fetchLeave();
  }, [params.id]);

  const fetchLeave = async () => {
    try {
      const response = await leaveApi.get(params.id as string);
      const data = response.data;
      setFormData({
        employee_id: data.employee_id || '',
        leave_type: data.leave_type || 'annual',
        start_date: data.start_date?.split('T')[0] || '',
        end_date: data.end_date?.split('T')[0] || '',
        total_days: data.total_days || 1,
        reason: data.reason || '',
        status: data.status || 'pending',
        approved_by: data.approved_by || '',
        approval_date: data.approval_date?.split('T')[0] || '',
        rejection_reason: data.rejection_reason || '',
        is_half_day: data.is_half_day || false,
        half_day_type: data.half_day_type || '',
        notes: data.notes || '',
      });
    } catch (error) {
      toast.error('Failed to fetch leave request');
      router.push('/leaves');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      await leaveApi.update(params.id as string, formData);
      toast.success('Leave request updated successfully');
      router.push('/leaves');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update leave request');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leaves" className="p-2 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Leave Request</h1>
          <p className="text-gray-500">Update leave request details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Leave Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave Details</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select name="status" value={formData.status} onChange={handleChange} required className="input-field">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
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
                min="0.5"
                step="0.5"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
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
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_half_day"
                  checked={formData.is_half_day}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Half Day</span>
              </label>
            </div>
            {formData.is_half_day && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Half Day Type</label>
                <select name="half_day_type" value={formData.half_day_type} onChange={handleChange} className="input-field">
                  <option value="">Select...</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Approval Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Approval Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approved By</label>
              <input
                type="text"
                name="approved_by"
                value={formData.approved_by}
                onChange={handleChange}
                className="input-field"
                placeholder="Manager's Employee ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval Date</label>
              <input
                type="date"
                name="approval_date"
                value={formData.approval_date}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            {formData.status === 'rejected' && (
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                <input
                  type="text"
                  name="rejection_reason"
                  value={formData.rejection_reason}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            )}
          </div>
        </div>

        {/* Reason */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Leave Reason</h2>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="Reason for leave..."
            required
          />
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Notes</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="Any additional notes..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/leaves" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            <FiSave size={20} />
            {loading ? 'Saving...' : 'Update Leave Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
