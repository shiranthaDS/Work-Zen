'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { jobDataApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditJobDataPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    employee_id: '',
    job_title: '',
    department: '',
    division: '',
    team: '',
    employment_type: 'full_time',
    reports_to: '',
    direct_reports: [] as string[],
    work_location: '',
    work_schedule: '',
    job_grade: '',
    cost_center: '',
    is_manager: false,
    start_date: '',
    end_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchJobData();
  }, [params.id]);

  const fetchJobData = async () => {
    try {
      const response = await jobDataApi.get(params.id as string);
      const data = response.data;
      setFormData({
        employee_id: data.employee_id || '',
        job_title: data.job_title || '',
        department: data.department || '',
        division: data.division || '',
        team: data.team || '',
        employment_type: data.employment_type || 'full_time',
        reports_to: data.reports_to || '',
        direct_reports: data.direct_reports || [],
        work_location: data.work_location || '',
        work_schedule: data.work_schedule || '',
        job_grade: data.job_grade || '',
        cost_center: data.cost_center || '',
        is_manager: data.is_manager || false,
        start_date: data.start_date?.split('T')[0] || '',
        end_date: data.end_date?.split('T')[0] || '',
        notes: data.notes || '',
      });
    } catch (error) {
      toast.error('Failed to fetch job data');
      router.push('/job-data');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await jobDataApi.update(params.id as string, formData);
      toast.success('Job data updated successfully');
      router.push('/job-data');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update job data');
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
        <Link href="/job-data" className="p-2 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Job Data</h1>
          <p className="text-gray-500">Update organizational information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Position Information</h2>
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                type="text"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
              <select name="employment_type" value={formData.employment_type} onChange={handleChange} required className="input-field">
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
              <input
                type="text"
                name="division"
                value={formData.division}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
              <input
                type="text"
                name="team"
                value={formData.team}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Reporting Structure */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reporting Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reports To</label>
              <input
                type="text"
                name="reports_to"
                value={formData.reports_to}
                onChange={handleChange}
                className="input-field"
                placeholder="Manager's Employee ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Grade</label>
              <input
                type="text"
                name="job_grade"
                value={formData.job_grade}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_manager"
                  checked={formData.is_manager}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Is Manager</span>
              </label>
            </div>
          </div>
        </div>

        {/* Work Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Work Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
              <input
                type="text"
                name="work_location"
                value={formData.work_location}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Schedule</label>
              <input
                type="text"
                name="work_schedule"
                value={formData.work_schedule}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Mon-Fri, 9AM-5PM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Center</label>
              <input
                type="text"
                name="cost_center"
                value={formData.cost_center}
                onChange={handleChange}
                className="input-field"
              />
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
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
          <Link href="/job-data" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            <FiSave size={20} />
            {loading ? 'Saving...' : 'Update Job Data'}
          </button>
        </div>
      </form>
    </div>
  );
}
