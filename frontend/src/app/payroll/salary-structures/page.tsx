'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiDollarSign } from 'react-icons/fi';
import { salaryStructureApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface SalaryStructure {
  _id: string;
  employee_id: string;
  basic_salary: number;
  currency: string;
  pay_frequency: string;
  housing_allowance: number;
  transport_allowance: number;
  meal_allowance: number;
  other_allowances: number;
  tax_rate: number;
  insurance_rate: number;
  pension_rate: number;
  effective_date: string;
  is_active: boolean;
}

export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStructures();
  }, []);

  const fetchStructures = async () => {
    try {
      const response = await salaryStructureApi.list();
      setStructures(response.data);
    } catch (error) {
      toast.error('Failed to fetch salary structures');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this salary structure?')) return;
    
    try {
      await salaryStructureApi.delete(id);
      toast.success('Salary structure deleted successfully');
      fetchStructures();
    } catch (error) {
      toast.error('Failed to delete salary structure');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      monthly: 'Monthly',
      bi_weekly: 'Bi-Weekly',
      weekly: 'Weekly',
      annual: 'Annual',
    };
    return labels[freq] || freq;
  };

  const filteredStructures = structures.filter(structure =>
    structure.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Salary Structures</h1>
          <p className="text-gray-500">Manage employee salary configurations</p>
        </div>
        <Link href="/payroll/salary-structures/add" className="btn-primary inline-flex items-center gap-2">
          <FiPlus size={20} />
          Add Salary Structure
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      {/* Salary Structures Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Allowances</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStructures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <FiDollarSign className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No salary structures found</p>
                    <p className="text-sm">Add a salary structure to get started</p>
                  </td>
                </tr>
              ) : (
                filteredStructures.map((structure) => {
                  const totalAllowances = structure.housing_allowance + structure.transport_allowance + 
                                         structure.meal_allowance + structure.other_allowances;
                  return (
                    <tr key={structure._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{structure.employee_id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(structure.basic_salary, structure.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {formatCurrency(totalAllowances, structure.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{getFrequencyLabel(structure.pay_frequency)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date(structure.effective_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          structure.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {structure.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/payroll/salary-structures/${structure._id}/edit`}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg"
                          >
                            <FiEdit2 size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(structure._id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
