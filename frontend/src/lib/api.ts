import axios from 'axios';

// API URL configuration
// In production: https://workzen.duckdns.org (NGINX routes /api to backend)
// In development: http://localhost:8000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Remove trailing slash if present
const baseURL = API_URL.replace(/\/+$/, '');

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Employee APIs
export const employeeApi = {
  list: (params?: any) => api.get('/api/employees/', { params }),
  get: (id: string) => api.get(`/api/employees/${id}`),
  create: (data: any) => api.post('/api/employees/', data),
  update: (id: string, data: any) => api.put(`/api/employees/${id}`, data),
  delete: (id: string) => api.delete(`/api/employees/${id}`),
  search: (query: string) => api.get('/api/employees/search/query', { params: { q: query } }),
};

// Job Data APIs
export const jobDataApi = {
  list: (params?: any) => api.get('/api/job-data/', { params }),
  get: (id: string) => api.get(`/api/job-data/${id}`),
  getByEmployee: (employeeId: string) => api.get(`/api/job-data/employee/${employeeId}`),
  create: (data: any) => api.post('/api/job-data/', data),
  update: (id: string, data: any) => api.put(`/api/job-data/${id}`, data),
  delete: (id: string) => api.delete(`/api/job-data/${id}`),
  search: (query: string) => api.get('/api/job-data/search/query', { params: { q: query } }),
};

// Attendance APIs
export const attendanceApi = {
  list: (params?: any) => api.get('/api/attendance/', { params }),
  get: (id: string) => api.get(`/api/attendance/${id}`),
  create: (data: any) => api.post('/api/attendance/', data),
  update: (id: string, data: any) => api.put(`/api/attendance/${id}`, data),
  delete: (id: string) => api.delete(`/api/attendance/${id}`),
  getSummary: (employeeId: string, month?: number, year?: number) => 
    api.get(`/api/attendance/employee/${employeeId}/summary`, { params: { month, year } }),
};

// Leave APIs
export const leaveApi = {
  list: (params?: any) => api.get('/api/leaves/', { params }),
  get: (id: string) => api.get(`/api/leaves/${id}`),
  create: (data: any) => api.post('/api/leaves/', data),
  update: (id: string, data: any) => api.put(`/api/leaves/${id}`, data),
  delete: (id: string) => api.delete(`/api/leaves/${id}`),
  approve: (id: string, approvedBy: string) => 
    api.put(`/api/leaves/${id}/approve`, null, { params: { approved_by: approvedBy } }),
  reject: (id: string, rejectedBy: string, reason: string) => 
    api.put(`/api/leaves/${id}/reject`, null, { params: { rejected_by: rejectedBy, reason } }),
};

// Leave Balance APIs
export const leaveBalanceApi = {
  list: (params?: any) => api.get('/api/leaves/balance/', { params }),
  get: (id: string) => api.get(`/api/leaves/balance/${id}`),
  getByEmployee: (employeeId: string, year?: number) => 
    api.get(`/api/leaves/balance/employee/${employeeId}`, { params: { year } }),
  create: (data: any) => api.post('/api/leaves/balance/', data),
  update: (id: string, data: any) => api.put(`/api/leaves/balance/${id}`, data),
  delete: (id: string) => api.delete(`/api/leaves/balance/${id}`),
};

// Salary Structure APIs
export const salaryStructureApi = {
  list: (params?: any) => api.get('/api/payroll/salary-structure/', { params }),
  get: (id: string) => api.get(`/api/payroll/salary-structure/${id}`),
  getByEmployee: (employeeId: string) => api.get(`/api/payroll/salary-structure/employee/${employeeId}`),
  create: (data: any) => api.post('/api/payroll/salary-structure/', data),
  update: (id: string, data: any) => api.put(`/api/payroll/salary-structure/${id}`, data),
  delete: (id: string) => api.delete(`/api/payroll/salary-structure/${id}`),
};

// Payroll APIs
export const payrollApi = {
  list: (params?: any) => api.get('/api/payroll/', { params }),
  get: (id: string) => api.get(`/api/payroll/${id}`),
  create: (data: any) => api.post('/api/payroll/', data),
  update: (id: string, data: any) => api.put(`/api/payroll/${id}`, data),
  delete: (id: string) => api.delete(`/api/payroll/${id}`),
  getHistory: (employeeId: string) => api.get(`/api/payroll/employee/${employeeId}/history`),
  process: (id: string, processedBy: string) => 
    api.put(`/api/payroll/${id}/process`, null, { params: { processed_by: processedBy } }),
  markPaid: (id: string, transactionId: string) => 
    api.put(`/api/payroll/${id}/pay`, null, { params: { transaction_id: transactionId } }),
};

export default api;
