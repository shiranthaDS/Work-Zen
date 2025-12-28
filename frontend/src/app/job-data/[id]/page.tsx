'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { jobDataApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function JobDataDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobData();
  }, [params.id]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const response = await jobDataApi.get(params.id as string);
      setJobData(response.data);
    } catch (error) {
      toast.error('Failed to fetch job data');
      router.push('/job-data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job data?')) return;
    
    try {
      await jobDataApi.delete(params.id as string);
      toast.success('Job data deleted successfully');
      router.push('/job-data');
    } catch (error) {
      toast.error('Failed to delete job data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job data...</p>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Job data not found</p>
        <Link href="/job-data" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Job Data
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/job-data" className="p-2 hover:bg-gray-100 rounded-lg">
            <FiArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Job Data Details</h1>
            <p className="text-gray-500">Employee ID: {jobData.employee_id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/job-data/${params.id}/edit`} className="btn-primary inline-flex items-center gap-2">
            <FiEdit2 size={18} />
            Edit
          </Link>
          <button onClick={handleDelete} className="btn-danger inline-flex items-center gap-2">
            <FiTrash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      {/* Job Information Card */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Position Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Employee ID</label>
            <p className="text-gray-800 font-medium">{jobData.employee_id || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Job Title</label>
            <p className="text-gray-800 font-medium">{jobData.job_title || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Department</label>
            <p className="text-gray-800 font-medium">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {jobData.department || 'N/A'}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Division</label>
            <p className="text-gray-800 font-medium">{jobData.division || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Employee Grade</label>
            <p className="text-gray-800 font-medium">{jobData.employee_grade || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Cost Center</label>
            <p className="text-gray-800 font-medium">{jobData.cost_center || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Work Location Card */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Work Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Work Location</label>
            <p className="text-gray-800 font-medium">{jobData.work_location || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Work Phone</label>
            <p className="text-gray-800 font-medium">{jobData.work_phone || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Work Email</label>
            <p className="text-gray-800 font-medium">
              {jobData.work_email ? (
                <a href={`mailto:${jobData.work_email}`} className="text-primary-600 hover:underline">
                  {jobData.work_email}
                </a>
              ) : (
                'N/A'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Reporting Structure Card */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Reporting Structure</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Reporting Manager ID</label>
            <p className="text-gray-800 font-medium">{jobData.reporting_manager_id || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Notice Period (Days)</label>
            <p className="text-gray-800 font-medium">{jobData.notice_period_days || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Employment Dates Card */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Important Dates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Probation End Date</label>
            <p className="text-gray-800 font-medium">
              {jobData.probation_end_date ? new Date(jobData.probation_end_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Confirmation Date</label>
            <p className="text-gray-800 font-medium">
              {jobData.confirmation_date ? new Date(jobData.confirmation_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Created At</label>
            <p className="text-gray-800 font-medium">
              {jobData.created_at ? new Date(jobData.created_at).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Last Updated</label>
            <p className="text-gray-800 font-medium">
              {jobData.updated_at ? new Date(jobData.updated_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
