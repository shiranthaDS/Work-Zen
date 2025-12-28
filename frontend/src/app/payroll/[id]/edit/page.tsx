'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { payrollApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function EditPayrollPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    employee_id: '',
    pay_period_start: '',
    pay_period_end: '',
    payment_date: '',
    basic_salary: 0,
    overtime_pay: 0,
    bonus: 0,
    commission: 0,
    allowances_total: 0,
    tax: 0,
    insurance: 0,
    pension: 0,
    loan_repayment: 0,
    other_deductions: 0,
    gross_pay: 0,
    total_deductions: 0,
    net_pay: 0,
    status: 'pending',
    payment_method: 'bank_transfer',
    notes: '',
  });

  useEffect(() => {
    fetchPayroll();
  }, [params.id]);

  const fetchPayroll = async () => {
    try {
      const response = await payrollApi.get(params.id as string);
      const data = response.data;
      setFormData({
        employee_id: data.employee_id || '',
        pay_period_start: data.pay_period_start?.split('T')[0] || '',
        pay_period_end: data.pay_period_end?.split('T')[0] || '',
        payment_date: data.payment_date?.split('T')[0] || '',
        basic_salary: data.basic_salary || 0,
        overtime_pay: data.overtime_pay || 0,
        bonus: data.bonus || 0,
        commission: data.commission || 0,
        allowances_total: data.allowances_total || 0,
        tax: data.tax || 0,
        insurance: data.insurance || 0,
        pension: data.pension || 0,
        loan_repayment: data.loan_repayment || 0,
        other_deductions: data.other_deductions || 0,
        gross_pay: data.gross_pay || 0,
        total_deductions: data.total_deductions || 0,
        net_pay: data.net_pay || 0,
        status: data.status || 'pending',
        payment_method: data.payment_method || 'bank_transfer',
        notes: data.notes || '',
      });
    } catch (error) {
      toast.error('Failed to fetch payroll record');
      router.push('/payroll');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['basic_salary', 'overtime_pay', 'bonus', 'commission', 'allowances_total', 
                          'tax', 'insurance', 'pension', 'loan_repayment', 'other_deductions'];
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value
      };
      
      // Recalculate totals
      const gross = updated.basic_salary + updated.overtime_pay + updated.bonus + 
                   updated.commission + updated.allowances_total;
      const deductions = updated.tax + updated.insurance + updated.pension + 
                        updated.loan_repayment + updated.other_deductions;
      
      return {
        ...updated,
        gross_pay: gross,
        total_deductions: deductions,
        net_pay: gross - deductions
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await payrollApi.update(params.id as string, formData);
      toast.success('Payroll record updated successfully');
      router.push('/payroll');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update payroll record');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
        <Link href="/payroll" className="p-2 hover:bg-gray-100 rounded-lg">
          <FiArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Payroll</h1>
          <p className="text-gray-500">Update payroll record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Payroll Information</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period Start *</label>
              <input
                type="date"
                name="pay_period_start"
                value={formData.pay_period_start}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period End *</label>
              <input
                type="date"
                name="pay_period_end"
                value={formData.pay_period_end}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Earnings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Earnings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary *</label>
              <input
                type="number"
                name="basic_salary"
                value={formData.basic_salary}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Pay</label>
              <input
                type="number"
                name="overtime_pay"
                value={formData.overtime_pay}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label>
              <input
                type="number"
                name="bonus"
                value={formData.bonus}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission</label>
              <input
                type="number"
                name="commission"
                value={formData.commission}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowances</label>
              <input
                type="number"
                name="allowances_total"
                value={formData.allowances_total}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Deductions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
              <input
                type="number"
                name="tax"
                value={formData.tax}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance</label>
              <input
                type="number"
                name="insurance"
                value={formData.insurance}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pension</label>
              <input
                type="number"
                name="pension"
                value={formData.pension}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Repayment</label>
              <input
                type="number"
                name="loan_repayment"
                value={formData.loan_repayment}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Other Deductions</label>
              <input
                type="number"
                name="other_deductions"
                value={formData.other_deductions}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-500">Gross Pay</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(formData.gross_pay)}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-500">Total Deductions</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(formData.total_deductions)}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-500">Net Pay</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(formData.net_pay)}</p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="input-field">
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/payroll" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            <FiSave size={20} />
            {loading ? 'Saving...' : 'Update Payroll'}
          </button>
        </div>
      </form>
    </div>
  );
}
