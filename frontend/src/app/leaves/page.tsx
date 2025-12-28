'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiFilter } from 'react-icons/fi';
import { leaveApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employee_id: '',
    leave_type: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.leave_type) params.leave_type = filters.leave_type;
      if (filters.status) params.status = filters.status;
      
      const response = await leaveApi.list(params);
      setLeaves(response.data);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return;
    
    try {
      await leaveApi.delete(id);
      toast.success('Leave request deleted');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to delete leave request');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await leaveApi.approve(id, 'Admin');
      toast.success('Leave approved');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to approve leave');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await leaveApi.reject(id, 'Admin', reason);
      toast.success('Leave rejected');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to reject leave');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const getLeaveTypeBadge = (type: string) => {
    const styles: any = {
      annual: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      maternity: 'bg-pink-100 text-pink-800',
      paternity: 'bg-indigo-100 text-indigo-800',
      unpaid: 'bg-gray-100 text-gray-800',
      compensatory: 'bg-purple-100 text-purple-800',
      bereavement: 'bg-slate-100 text-slate-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100'}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Requests</h1>
          <p className="text-gray-500">Manage employee leave requests</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leaves/balances" className="btn-secondary">
            View Balances
          </Link>
          <Link href="/leaves/add" className="btn-primary inline-flex items-center gap-2">
            <FiPlus size={20} />
            Apply Leave
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filter by Employee ID"
              value={filters.employee_id}
              onChange={(e) => setFilters({...filters, employee_id: e.target.value})}
              className="input-field"
            />
          </div>
          <button onClick={fetchLeaves} className="btn-primary">
            Apply Filters
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="btn-secondary inline-flex items-center gap-2"
          >
            <FiFilter size={18} />
            More Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
              <select 
                value={filters.leave_type}
                onChange={(e) => setFilters({...filters, leave_type: e.target.value})}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="annual">Annual</option>
                <option value="sick">Sick</option>
                <option value="maternity">Maternity</option>
                <option value="paternity">Paternity</option>
                <option value="unpaid">Unpaid</option>
                <option value="compensatory">Compensatory</option>
                <option value="bereavement">Bereavement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="input-field"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No leave requests found. <Link href="/leaves/add" className="text-primary-600 hover:underline">Apply for leave</Link>
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{leave.employee_id}</td>
                    <td className="px-6 py-4">{getLeaveTypeBadge(leave.leave_type)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p>{leave.start_date}</p>
                        <p className="text-gray-500">to {leave.end_date}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{leave.total_days}</td>
                    <td className="px-6 py-4">{getStatusBadge(leave.status)}</td>
                    <td className="px-6 py-4">
                      <p className="truncate max-w-xs" title={leave.reason}>{leave.reason}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {leave.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(leave._id)} 
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <FiCheck size={18} />
                            </button>
                            <button 
                              onClick={() => handleReject(leave._id)} 
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <FiX size={18} />
                            </button>
                          </>
                        )}
                        <Link href={`/leaves/${leave._id}/edit`} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <FiEdit2 size={18} />
                        </Link>
                        <button onClick={() => handleDelete(leave._id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
