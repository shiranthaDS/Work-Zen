'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiFilter } from 'react-icons/fi';
import { jobDataApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function JobDataPage() {
  const [jobData, setJobData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    job_title: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchJobData();
  }, [filters]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.department) params.department = filters.department;
      if (filters.job_title) params.job_title = filters.job_title;
      
      const response = await jobDataApi.list(params);
      setJobData(response.data);
    } catch (error) {
      toast.error('Failed to fetch job data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchJobData();
      return;
    }
    try {
      setLoading(true);
      const response = await jobDataApi.search(searchQuery);
      setJobData(response.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job data?')) return;
    
    try {
      await jobDataApi.delete(id);
      toast.success('Job data deleted successfully');
      fetchJobData();
    } catch (error) {
      toast.error('Failed to delete job data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Job & Organizational Data</h1>
          <p className="text-gray-500">Manage employee job positions and departments</p>
        </div>
        <Link href="/job-data/add" className="btn-primary inline-flex items-center gap-2">
          <FiPlus size={20} />
          Add Job Data
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by department, job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="input-field pl-10"
            />
          </div>
          <button onClick={handleSearch} className="btn-primary">
            Search
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="btn-secondary inline-flex items-center gap-2"
          >
            <FiFilter size={18} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="input-field"
                placeholder="Filter by department"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                value={filters.job_title}
                onChange={(e) => setFilters({...filters, job_title: e.target.value})}
                className="input-field"
                placeholder="Filter by job title"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : jobData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No job data found. <Link href="/job-data/add" className="text-primary-600 hover:underline">Add one</Link>
                  </td>
                </tr>
              ) : (
                jobData.map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{job.employee_id}</td>
                    <td className="px-6 py-4">{job.job_title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {job.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">{job.work_location}</td>
                    <td className="px-6 py-4">{job.reporting_manager || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/job-data/${job._id}`} className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                          <FiEye size={18} />
                        </Link>
                        <Link href={`/job-data/${job._id}/edit`} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <FiEdit2 size={18} />
                        </Link>
                        <button onClick={() => handleDelete(job._id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
