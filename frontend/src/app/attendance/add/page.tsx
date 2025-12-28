'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { attendanceApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AddAttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    check_in_time: '',
    check_out_time: '',
    break_duration: 0,
    total_hours: 0,
    overtime_hours: 0,
    work_location: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['break_duration', 'total_hours', 'overtime_hours'].includes(name) 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  // Calculate total hours when check-in/check-out changes
  const calculateHours = () => {
    if (formData.check_in_time && formData.check_out_time) {
      const checkIn = new Date(`2000-01-01 ${formData.check_in_time}`);
      const checkOut = new Date(`2000-01-01 ${formData.check_out_time}`);
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60) - (formData.break_duration / 60);
      setFormData(prev => ({
        ...prev,
        total_hours: Math.max(0, Math.round(diffHrs * 100) / 100)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await attendanceApi.create(formData);
      toast.success('Attendance recorded successfully');
      router.push('/attendance');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to record attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/attendance" className="p-2 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mark Attendance</h1>
          <p className="text-gray-500">Record employee attendance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Details</h2>
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
              <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="work_from_home">Work from Home</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
              <input
                type="time"
                name="check_in_time"
                value={formData.check_in_time}
                onChange={(e) => {
                  handleChange(e);
                  setTimeout(calculateHours, 0);
                }}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check Out Time</label>
              <input
                type="time"
                name="check_out_time"
                value={formData.check_out_time}
                onChange={(e) => {
                  handleChange(e);
                  setTimeout(calculateHours, 0);
                }}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Break Duration (minutes)</label>
              <input
                type="number"
                name="break_duration"
                value={formData.break_duration}
                onChange={(e) => {
                  handleChange(e);
                  setTimeout(calculateHours, 0);
                }}
                min="0"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
              <input
                type="number"
                name="total_hours"
                value={formData.total_hours}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
              <input
                type="text"
                name="work_location"
                value={formData.work_location}
                onChange={handleChange}
                className="input-field"
                placeholder="Office / Remote"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="input-field"
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/attendance" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            <FiSave size={20} />
            {loading ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </form>
    </div>
  );
}
