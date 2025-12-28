'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { leaveBalanceApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LeaveBalancesPage() {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchBalances();
  }, [year]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await leaveBalanceApi.list({ year });
      setBalances(response.data);
    } catch (error) {
      toast.error('Failed to fetch leave balances');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave balance?')) return;
    
    try {
      await leaveBalanceApi.delete(id);
      toast.success('Leave balance deleted');
      fetchBalances();
    } catch (error) {
      toast.error('Failed to delete leave balance');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Balances</h1>
          <p className="text-gray-500">View and manage employee leave balances</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="input-field w-32"
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Link href="/leaves/balances/add" className="btn-primary inline-flex items-center gap-2">
            <FiPlus size={20} />
            Add Balance
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Annual</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sick</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Maternity</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Paternity</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unpaid Used</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : balances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No leave balances found. <Link href="/leaves/balances/add" className="text-primary-600 hover:underline">Add one</Link>
                  </td>
                </tr>
              ) : (
                balances.map((balance) => (
                  <tr key={balance._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{balance.employee_id}</td>
                    <td className="px-6 py-4">{balance.year}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-600">{balance.annual_leave_balance}</span>
                      <span className="text-gray-400">/{balance.annual_leave_total}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-600">{balance.sick_leave_balance}</span>
                      <span className="text-gray-400">/{balance.sick_leave_total}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-600">{balance.maternity_leave_balance}</span>
                      <span className="text-gray-400">/{balance.maternity_leave_total}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-600">{balance.paternity_leave_balance}</span>
                      <span className="text-gray-400">/{balance.paternity_leave_total}</span>
                    </td>
                    <td className="px-6 py-4 text-center">{balance.unpaid_leave_used}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/leaves/balances/${balance._id}/edit`} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <FiEdit2 size={18} />
                        </Link>
                        <button onClick={() => handleDelete(balance._id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
