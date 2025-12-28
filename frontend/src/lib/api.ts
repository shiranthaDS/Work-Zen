import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Employee APIs
export const employeeApi = {
  list: (params?: any) => api.get('/employees', { params }),
  get: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  search: (query: string) => api.get('/employees/search/query', { params: { q: query } }),
};

// Job Data APIs
export const jobDataApi = {
  list: (params?: any) => api.get('/job-data', { params }),
  get: (id: string) => api.get(`/job-data/${id}`),
  getByEmployee: (employeeId: string) => api.get(`/job-data/employee/${employeeId}`),
  create: (data: any) => api.post('/job-data', data),
  update: (id: string, data: any) => api.put(`/job-data/${id}`, data),
  delete: (id: string) => api.delete(`/job-data/${id}`),
  search: (query: string) => api.get('/job-data/search/query', { params: { q: query } }),
};

// Attendance APIs
export const attendanceApi = {
  list: (params?: any) => api.get('/attendance', { params }),
  get: (id: string) => api.get(`/attendance/${id}`),
  create: (data: any) => api.post('/attendance', data),
  update: (id: string, data: any) => api.put(`/attendance/${id}`, data),
  delete: (id: string) => api.delete(`/attendance/${id}`),
  getSummary: (employeeId: string, month?: number, year?: number) => 
    api.get(`/attendance/employee/${employeeId}/summary`, { params: { month, year } }),
};

// Leave APIs
export const leaveApi = {
  list: (params?: any) => api.get('/leaves', { params }),
  get: (id: string) => api.get(`/leaves/${id}`),
  create: (data: any) => api.post('/leaves', data),
  update: (id: string, data: any) => api.put(`/leaves/${id}`, data),
  delete: (id: string) => api.delete(`/leaves/${id}`),
  approve: (id: string, approvedBy: string) => 
    api.put(`/leaves/${id}/approve`, null, { params: { approved_by: approvedBy } }),
  reject: (id: string, rejectedBy: string, reason: string) => 
    api.put(`/leaves/${id}/reject`, null, { params: { rejected_by: rejectedBy, reason } }),
};

// Leave Balance APIs
export const leaveBalanceApi = {
  list: (params?: any) => api.get('/leaves/balance', { params }),
  get: (id: string) => api.get(`/leaves/balance/${id}`),
  getByEmployee: (employeeId: string, year?: number) => 
    api.get(`/leaves/balance/employee/${employeeId}`, { params: { year } }),
  create: (data: any) => api.post('/leaves/balance', data),
  update: (id: string, data: any) => api.put(`/leaves/balance/${id}`, data),
  delete: (id: string) => api.delete(`/leaves/balance/${id}`),
};

// Salary Structure APIs
export const salaryStructureApi = {
  list: (params?: any) => api.get('/payroll/salary-structure', { params }),
  get: (id: string) => api.get(`/payroll/salary-structure/${id}`),
  getByEmployee: (employeeId: string) => api.get(`/payroll/salary-structure/employee/${employeeId}`),
  create: (data: any) => api.post('/payroll/salary-structure', data),
  update: (id: string, data: any) => api.put(`/payroll/salary-structure/${id}`, data),
  delete: (id: string) => api.delete(`/payroll/salary-structure/${id}`),
};

// Payroll APIs
export const payrollApi = {
  list: (params?: any) => api.get('/payroll', { params }),
  get: (id: string) => api.get(`/payroll/${id}`),
  create: (data: any) => api.post('/payroll', data),
  update: (id: string, data: any) => api.put(`/payroll/${id}`, data),
  delete: (id: string) => api.delete(`/payroll/${id}`),
  getHistory: (employeeId: string) => api.get(`/payroll/employee/${employeeId}/history`),
  process: (id: string, processedBy: string) => 
    api.put(`/payroll/${id}/process`, null, { params: { processed_by: processedBy } }),
  markPaid: (id: string, transactionId: string) => 
    api.put(`/payroll/${id}/pay`, null, { params: { transaction_id: transactionId } }),
};

export default api;
