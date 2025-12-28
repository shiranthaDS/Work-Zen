'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiCheck, FiFilter } from 'react-icons/fi';
import { payrollApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employee_id: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.status) params.status = filters.status;
      
      const response = await payrollApi.list(params);
      setPayrolls(response.data);
    } catch (error) {
      toast.error('Failed to fetch payroll records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return;
    
    try {
      await payrollApi.delete(id);
      toast.success('Payroll record deleted');
      fetchPayrolls();
    } catch (error) {
      toast.error('Failed to delete payroll record');
    }
  };

  const handleProcess = async (id: string) => {
    try {
      await payrollApi.process(id, 'Admin');
      toast.success('Payroll processed');
      fetchPayrolls();
    } catch (error) {
      toast.error('Failed to process payroll');
    }
  };

  const handleMarkPaid = async (id: string) => {
    const transactionId = prompt('Enter transaction ID:');
    if (!transactionId) return;
    
    try {
      await payrollApi.markPaid(id, transactionId);
      toast.success('Payroll marked as paid');
      fetchPayrolls();
    } catch (error) {
      toast.error('Failed to mark payroll as paid');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      processed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payroll Records</h1>
          <p className="text-gray-500">Manage employee payroll</p>
        </div>
        <div className="flex gap-2">
          <Link href="/payroll/salary-structures" className="btn-secondary">
            Salary Structures
          </Link>
          <Link href="/payroll/add" className="btn-primary inline-flex items-center gap-2">
            <FiPlus size={20} />
            Create Payroll
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
          <button onClick={fetchPayrolls} className="btn-primary">
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
          <div className="mt-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="input-field w-48"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No payroll records found. <Link href="/payroll/add" className="text-primary-600 hover:underline">Create one</Link>
                  </td>
                </tr>
              ) : (
                payrolls.map((payroll) => (
                  <tr key={payroll._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{payroll.employee_id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p>{payroll.pay_period_start}</p>
                        <p className="text-gray-500">to {payroll.pay_period_end}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{payroll.payment_date}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(payroll.gross_pay)}</td>
                    <td className="px-6 py-4 text-right text-red-600">{formatCurrency(payroll.total_deductions)}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(payroll.net_pay)}</td>
                    <td className="px-6 py-4">{getStatusBadge(payroll.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {payroll.status === 'pending' && (
                          <button 
                            onClick={() => handleProcess(payroll._id)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Process"
                          >
                            <FiCheck size={18} />
                          </button>
                        )}
                        {payroll.status === 'processed' && (
                          <button 
                            onClick={() => handleMarkPaid(payroll._id)} 
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Mark as Paid"
                          >
                            <FiDollarSign size={18} />
                          </button>
                        )}
                        <Link href={`/payroll/${payroll._id}/edit`} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <FiEdit2 size={18} />
                        </Link>
                        <button onClick={() => handleDelete(payroll._id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
