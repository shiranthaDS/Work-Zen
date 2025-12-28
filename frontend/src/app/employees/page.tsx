'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiFilter } from 'react-icons/fi';
import { employeeApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    employment_type: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.employment_type) params.employment_type = filters.employment_type;
      
      const response = await employeeApi.list(params);
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchEmployees();
      return;
    }
    try {
      setLoading(true);
      const response = await employeeApi.search(searchQuery);
      setEmployees(response.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      await employeeApi.delete(id);
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      terminated: 'bg-red-100 text-red-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
      probation: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
          <p className="text-gray-500">Manage your employee records</p>
        </div>
        <Link href="/employees/add" className="btn-primary inline-flex items-center gap-2">
          <FiPlus size={20} />
          Add Employee
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="input-field"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
                <option value="on_leave">On Leave</option>
                <option value="probation">Probation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
              <select 
                value={filters.employment_type}
                onChange={(e) => setFilters({...filters, employment_type: e.target.value})}
                className="input-field"
              >
                <option value="">All Types</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
                <option value="temporary">Temporary</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No employees found. <Link href="/employees/add" className="text-primary-600 hover:underline">Add one</Link>
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                          {employee.first_name?.[0]}{employee.last_name?.[0]}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{employee.first_name} {employee.last_name}</p>
                          <p className="text-sm text-gray-500">{employee.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{employee.email}</p>
                      <p className="text-sm text-gray-500">{employee.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{employee.hire_date}</td>
                    <td className="px-6 py-4">{getStatusBadge(employee.employment_status)}</td>
                    <td className="px-6 py-4 text-gray-900">{employee.employment_type?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/employees/${employee._id}`} className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                          <FiEye size={18} />
                        </Link>
                        <Link href={`/employees/${employee._id}/edit`} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <FiEdit2 size={18} />
                        </Link>
                        <button onClick={() => handleDelete(employee._id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
