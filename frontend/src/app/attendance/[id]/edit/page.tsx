'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { attendanceApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    employee_id: '',
    date: '',
    check_in: '',
    check_out: '',
    status: 'present',
    work_hours: 0,
    overtime_hours: 0,
    break_duration: 0,
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchAttendance();
  }, [params.id]);

  const fetchAttendance = async () => {
    try {
      const response = await attendanceApi.get(params.id as string);
      const data = response.data;
      setFormData({
        employee_id: data.employee_id || '',
        date: data.date?.split('T')[0] || '',
        check_in: data.check_in || '',
        check_out: data.check_out || '',
        status: data.status || 'present',
        work_hours: data.work_hours || 0,
        overtime_hours: data.overtime_hours || 0,
        break_duration: data.break_duration || 0,
        location: data.location || '',
        notes: data.notes || '',
      });
    } catch (error) {
      toast.error('Failed to fetch attendance record');
      router.push('/attendance');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await attendanceApi.update(params.id as string, formData);
      toast.success('Attendance updated successfully');
      router.push('/attendance');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update attendance');
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
        <Link href="/attendance" className="p-2 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Attendance</h1>
          <p className="text-gray-500">Update attendance record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Details</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select name="status" value={formData.status} onChange={handleChange} required className="input-field">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">On Leave</option>
                <option value="work_from_home">Work From Home</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-field"
                placeholder="Office / Remote / etc."
              />
            </div>
          </div>
        </div>

        {/* Time Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Time Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
              <input
                type="time"
                name="check_in"
                value={formData.check_in}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
              <input
                type="time"
                name="check_out"
                value={formData.check_out}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Hours</label>
              <input
                type="number"
                name="work_hours"
                value={formData.work_hours}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Hours</label>
              <input
                type="number"
                name="overtime_hours"
                value={formData.overtime_hours}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Break (mins)</label>
              <input
                type="number"
                name="break_duration"
                value={formData.break_duration}
                onChange={handleChange}
                min="0"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="Additional notes..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/attendance" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            <FiSave size={20} />
            {loading ? 'Saving...' : 'Update Attendance'}
          </button>
        </div>
      </form>
    </div>
  );
}
