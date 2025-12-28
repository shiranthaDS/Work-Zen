'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiUsers, 
  FiBriefcase, 
  FiCalendar, 
  FiClock, 
  FiDollarSign,
  FiTrendingUp,
  FiUserPlus,
  FiArrowRight,
  FiMessageSquare
} from 'react-icons/fi';
import { employeeApi, attendanceApi, leaveApi, payrollApi } from '@/lib/api';

export default function HomePage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
    pendingPayrolls: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [employees, leaves, payrolls] = await Promise.all([
        employeeApi.list().catch(() => ({ data: [] })),
        leaveApi.list({ status: 'pending' }).catch(() => ({ data: [] })),
        payrollApi.list({ status: 'pending' }).catch(() => ({ data: [] })),
      ]);

      setStats({
        totalEmployees: employees.data?.length || 0,
        activeEmployees: employees.data?.filter((e: any) => e.employment_status === 'active').length || 0,
        pendingLeaves: leaves.data?.length || 0,
        todayAttendance: 0,
        pendingPayrolls: payrolls.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Employees', 
      value: stats.totalEmployees, 
      icon: FiUsers, 
      color: 'from-blue-500 to-blue-600',
      href: '/employees'
    },
    { 
      title: 'Active Employees', 
      value: stats.activeEmployees, 
      icon: FiTrendingUp, 
      color: 'from-green-500 to-green-600',
      href: '/employees'
    },
    { 
      title: 'Pending Leaves', 
      value: stats.pendingLeaves, 
      icon: FiCalendar, 
      color: 'from-orange-500 to-orange-600',
      href: '/leaves'
    },
    { 
      title: 'Pending Payrolls', 
      value: stats.pendingPayrolls, 
      icon: FiDollarSign, 
      color: 'from-purple-500 to-purple-600',
      href: '/payroll'
    },
  ];

  const quickActions = [
    { title: 'Add New Employee', icon: FiUserPlus, href: '/employees/add', color: 'bg-blue-100 text-blue-600' },
    { title: 'Mark Attendance', icon: FiClock, href: '/attendance/add', color: 'bg-green-100 text-green-600' },
    { title: 'Apply Leave', icon: FiCalendar, href: '/leaves/add', color: 'bg-orange-100 text-orange-600' },
    { title: 'Create Payroll', icon: FiDollarSign, href: '/payroll/add', color: 'bg-purple-100 text-purple-600' },
    { title: 'Add Job Data', icon: FiBriefcase, href: '/job-data/add', color: 'bg-pink-100 text-pink-600' },
    { title: 'AI Assistant', icon: FiMessageSquare, href: '/chat', color: 'bg-indigo-100 text-indigo-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to WorkZen</h1>
        <p className="text-primary-100 text-lg">
          Your comprehensive Employee Management System with AI-powered assistance
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/employees/add" className="bg-white text-primary-700 px-6 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors inline-flex items-center gap-2">
            <FiUserPlus size={20} />
            Add Employee
          </Link>
          <Link href="/chat" className="bg-primary-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-900 transition-colors inline-flex items-center gap-2">
            <FiMessageSquare size={20} />
            Ask AI Assistant
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Link key={index} href={card.href} className="card hover:shadow-lg transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {loading ? '...' : card.value}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="text-white" size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-primary-600 text-sm font-medium group-hover:underline">
              View Details <FiArrowRight className="ml-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className={`w-14 h-14 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon size={24} />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">{action.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System Features</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FiUsers className="text-blue-600" size={16} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Employee Management</h3>
                <p className="text-sm text-gray-500">Complete CRUD operations for employee data</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <FiClock className="text-green-600" size={16} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Attendance Tracking</h3>
                <p className="text-sm text-gray-500">Track daily attendance with detailed reports</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <FiCalendar className="text-orange-600" size={16} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Leave Management</h3>
                <p className="text-sm text-gray-500">Manage leave requests and balances</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <FiDollarSign className="text-purple-600" size={16} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Payroll Processing</h3>
                <p className="text-sm text-gray-500">Salary structures and payroll management</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center gap-3 mb-4">
            <FiMessageSquare size={28} />
            <h2 className="text-xl font-semibold">AI-Powered Assistant</h2>
          </div>
          <p className="text-indigo-100 mb-6">
            Ask questions about your employees in natural language. Our AI assistant powered by HuggingFace can help you find information quickly.
          </p>
          <div className="space-y-2 text-sm text-indigo-100">
            <p>• "Show me all employees in Engineering department"</p>
            <p>• "Who has pending leave requests?"</p>
            <p>• "List employees hired this year"</p>
            <p>• "What is John's salary structure?"</p>
          </div>
          <Link 
            href="/chat" 
            className="mt-6 inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Try AI Assistant <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
