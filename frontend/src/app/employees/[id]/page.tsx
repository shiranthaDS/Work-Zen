'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiEdit2, FiMail, FiPhone, FiMapPin, FiCalendar, FiUser, FiBriefcase } from 'react-icons/fi';
import { employeeApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function EmployeeDetailPage() {
  const params = useParams();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, [params.id]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeApi.get(params.id as string);
      setEmployee(response.data);
    } catch (error) {
      toast.error('Failed to fetch employee details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">Employee not found</p>
        <Link href="/employees" className="btn-primary">Back to Employees</Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: any = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      terminated: 'bg-red-100 text-red-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
      probation: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees" className="p-2 hover:bg-gray-100 rounded-lg">
            <FiArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Employee Details</h1>
            <p className="text-gray-500">{employee.employee_id}</p>
          </div>
        </div>
        <Link href={`/employees/${params.id}/edit`} className="btn-primary inline-flex items-center gap-2">
          <FiEdit2 size={18} />
          Edit Employee
        </Link>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold">
            {employee.first_name?.[0]}{employee.last_name?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-800">
                {employee.first_name} {employee.last_name}
              </h2>
              {getStatusBadge(employee.employment_status)}
            </div>
            <div className="flex flex-wrap gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <FiMail size={16} />
                {employee.email}
              </span>
              <span className="flex items-center gap-1">
                <FiPhone size={16} />
                {employee.phone}
              </span>
              <span className="flex items-center gap-1">
                <FiCalendar size={16} />
                Hired: {employee.hire_date}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiUser className="text-primary-600" />
            Personal Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Date of Birth</span>
              <span className="font-medium">{employee.date_of_birth}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Gender</span>
              <span className="font-medium capitalize">{employee.gender}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Marital Status</span>
              <span className="font-medium capitalize">{employee.marital_status}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Nationality</span>
              <span className="font-medium">{employee.nationality}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Blood Group</span>
              <span className="font-medium">{employee.blood_group || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiMapPin className="text-primary-600" />
            Address
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Street</span>
              <span className="font-medium">{employee.address?.street}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">City</span>
              <span className="font-medium">{employee.address?.city}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">State</span>
              <span className="font-medium">{employee.address?.state}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Postal Code</span>
              <span className="font-medium">{employee.address?.postal_code}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Country</span>
              <span className="font-medium">{employee.address?.country}</span>
            </div>
          </div>
        </div>

        {/* Employment Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiBriefcase className="text-primary-600" />
            Employment Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Employee ID</span>
              <span className="font-medium">{employee.employee_id}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Hire Date</span>
              <span className="font-medium">{employee.hire_date}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Employment Type</span>
              <span className="font-medium capitalize">{employee.employment_type?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Status</span>
              {getStatusBadge(employee.employment_status)}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiPhone className="text-primary-600" />
            Emergency Contact
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{employee.emergency_contact?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Relationship</span>
              <span className="font-medium">{employee.emergency_contact?.relationship}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium">{employee.emergency_contact?.phone}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{employee.emergency_contact?.email || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">National ID</p>
            <p className="font-medium">{employee.national_id || 'Not provided'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Passport Number</p>
            <p className="font-medium">{employee.passport_number || 'Not provided'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Driving License</p>
            <p className="font-medium">{employee.driving_license || 'Not provided'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
