#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { connectToMongoDB, getDatabase, toObjectId, COLLECTIONS } from './database.js';
import { stringify } from 'csv-stringify/sync';

// Initialize server
const server = new Server(
  {
    name: 'ems-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Connect to MongoDB with error handling
try {
  await connectToMongoDB();
  console.error('✅ MCP Server connected to MongoDB');
} catch (error) {
  console.error('❌ MCP Server failed to connect to MongoDB:', error.message);
  console.error('MONGO_URL:', process.env.MONGO_URL ? 'SET' : 'NOT SET');
  console.error('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
  process.exit(1);
}

// Create indexes for foreign key relationships (Primary Key: employee_id)
async function ensureIndexes() {
  const db = getDatabase();
  
  try {
    // Primary key index on employees.employee_id
    await db.collection(COLLECTIONS.employees).createIndex({ employee_id: 1 }, { unique: true });
    
    // Foreign key indexes for related collections
    await db.collection(COLLECTIONS.job_data).createIndex({ employee_id: 1 });
    await db.collection(COLLECTIONS.attendance).createIndex({ employee_id: 1 });
    await db.collection(COLLECTIONS.attendance).createIndex({ date: -1 }); // For date queries
    await db.collection(COLLECTIONS.leaves).createIndex({ employee_id: 1 });
    await db.collection(COLLECTIONS.leaves).createIndex({ status: 1 }); // For status queries
    await db.collection(COLLECTIONS.leave_balances).createIndex({ employee_id: 1 });
    await db.collection(COLLECTIONS.leave_balances).createIndex({ year: 1 }); // For year queries
    await db.collection(COLLECTIONS.salary_structures).createIndex({ employee_id: 1 });
    await db.collection(COLLECTIONS.payroll).createIndex({ employee_id: 1 });
    await db.collection(COLLECTIONS.payroll).createIndex({ payment_date: -1 }); // For date queries
    
    console.error('✅ Database indexes created successfully (Foreign Key relationships established)');
  } catch (error) {
    console.error('ℹ️ Indexes may already exist:', error.message);
  }
}

// Ensure indexes are created
await ensureIndexes();

// Define all tools
const tools = [
  // Employee Management
  {
    name: 'list_employees',
    description: 'List all employees with optional filters. Can filter by status, employment_type, department.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by employment status (active, inactive, terminated, on_leave, probation)' },
        employment_type: { type: 'string', description: 'Filter by employment type (full_time, part_time, contract, intern)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' }
      }
    }
  },
  {
    name: 'get_employee',
    description: 'Get a single employee by ID, employee_id, or email',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'Employee ID, employee_id, or email' }
      },
      required: ['identifier']
    }
  },
  {
    name: 'search_employees',
    description: 'Smart search across employee records by name, email, phone, or employee_id',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  
  // Attendance Management
  {
    name: 'list_attendance',
    description: 'List attendance records with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: 'Filter by employee ID' },
        status: { type: 'string', description: 'Filter by attendance status (present, absent, late, half_day, work_from_home)' },
        date_from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        date_to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' }
      }
    }
  },
  {
    name: 'get_attendance',
    description: 'Get a single attendance record by ID',
    inputSchema: {
      type: 'object',
      properties: {
        attendance_id: { type: 'string', description: 'Attendance record ID' }
      },
      required: ['attendance_id']
    }
  },
  
  // Leave Management
  {
    name: 'list_leaves',
    description: 'List leave requests with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: 'Filter by employee ID' },
        leave_type: { type: 'string', description: 'Filter by leave type (annual, sick, maternity, paternity, unpaid)' },
        status: { type: 'string', description: 'Filter by status (pending, approved, rejected, cancelled)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' }
      }
    }
  },
  {
    name: 'get_leave',
    description: 'Get a single leave request by ID',
    inputSchema: {
      type: 'object',
      properties: {
        leave_id: { type: 'string', description: 'Leave request ID' }
      },
      required: ['leave_id']
    }
  },
  
  // Leave Balance
  {
    name: 'list_leave_balances',
    description: 'List all leave balances with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: 'Filter by employee ID' },
        year: { type: 'number', description: 'Filter by year' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' }
      }
    }
  },
  {
    name: 'get_leave_balance',
    description: 'Get leave balance for a specific employee',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: 'Employee ID' },
        year: { type: 'number', description: 'Year (default: current year)' }
      },
      required: ['employee_id']
    }
  },
  
  // Payroll
  {
    name: 'list_salary_structures',
    description: 'List salary structures with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: 'Filter by employee ID' },
        is_active: { type: 'boolean', description: 'Filter by active status' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' }
      }
    }
  },
  {
    name: 'list_payroll',
    description: 'List payroll records with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: 'Filter by employee ID' },
        status: { type: 'string', description: 'Filter by payment status (pending, processed, paid, failed)' },
        pay_period_start: { type: 'string', description: 'Start of pay period (YYYY-MM-DD)' },
        pay_period_end: { type: 'string', description: 'End of pay period (YYYY-MM-DD)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' }
      }
    }
  },
  {
    name: 'get_payroll',
    description: 'Get a single payroll record by ID',
    inputSchema: {
      type: 'object',
      properties: {
        payroll_id: { type: 'string', description: 'Payroll record ID' }
      },
      required: ['payroll_id']
    }
  },
  
  // Job Data
  {
    name: 'list_job_data',
    description: 'List job/organizational data with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        department: { type: 'string', description: 'Filter by department' },
        job_title: { type: 'string', description: 'Filter by job title' },
        work_location: { type: 'string', description: 'Filter by work location' },
        limit: { type: 'number', description: 'Maximum number of results (default: 50)' }
      }
    }
  },
  {
    name: 'search_job_data',
    description: 'Search job data by department, title, division, or team',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_job_data',
    description: 'Get job data for a specific employee',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: 'Employee ID' }
      },
      required: ['employee_id']
    }
  },
  
  // Export
  {
    name: 'export_to_csv',
    description: 'Export any collection to CSV format',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { 
          type: 'string', 
          description: 'Collection to export (employees, job_data, attendance, leaves, leave_balances, salary_structures, payroll)',
          enum: ['employees', 'job_data', 'attendance', 'leaves', 'leave_balances', 'salary_structures', 'payroll']
        },
        limit: { type: 'number', description: 'Maximum number of records (default: 100)' }
      },
      required: ['collection']
    }
  },
  
  // Comprehensive Employee Data (joins all collections)
  {
    name: 'get_employee_complete',
    description: 'Get complete employee information with data from ALL collections: personal info, job data, recent attendance, leave balance, and latest payroll. Use for comprehensive employee profile.',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: { type: 'string', description: 'Employee ID (e.g., EM001)' },
        include_attendance: { type: 'boolean', description: 'Include recent attendance records (default: true)' },
        include_leaves: { type: 'boolean', description: 'Include leave balance and requests (default: true)' },
        include_payroll: { type: 'boolean', description: 'Include latest payroll info (default: true)' },
        include_job_data: { type: 'boolean', description: 'Include job/organizational data (default: true)' }
      },
      required: ['employee_id']
    }
  },
  
  // Aggregated data using MongoDB $lookup (JOIN operations)
  {
    name: 'list_employees_with_relations',
    description: 'List employees with related data from ALL collections using MongoDB aggregation pipeline ($lookup joins). More efficient than separate queries. Returns employees with their job data, attendance summary, leave balance, and payroll info.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by employment status' },
        department: { type: 'string', description: 'Filter by department' },
        limit: { type: 'number', description: 'Maximum number of results (default: 20)' },
        include_attendance_summary: { type: 'boolean', description: 'Include attendance summary (default: true)' },
        include_leave_balance: { type: 'boolean', description: 'Include leave balance (default: true)' },
        include_latest_payroll: { type: 'boolean', description: 'Include latest payroll (default: true)' }
      }
    }
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Helper function to serialize MongoDB documents
function serializeDoc(doc) {
  if (doc && doc._id) {
    doc._id = doc._id.toString();
  }
  return doc;
}

// Tool execution handlers
async function listEmployees(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.employees);
  
  const query = {};
  if (args.status) query.employment_status = args.status;
  if (args.employment_type) query.employment_type = args.employment_type;
  
  const limit = args.limit || 50;
  const employees = await collection.find(query).limit(limit).toArray();
  
  return employees.map(serializeDoc);
}

async function getEmployee(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.employees);
  
  let employee = null;
  
  // Try ObjectId first
  const objectId = toObjectId(args.identifier);
  if (objectId) {
    employee = await collection.findOne({ _id: objectId });
  }
  
  // Try employee_id
  if (!employee) {
    employee = await collection.findOne({ employee_id: args.identifier });
  }
  
  // Try email
  if (!employee) {
    employee = await collection.findOne({ email: args.identifier });
  }
  
  if (!employee) {
    return { error: 'Employee not found' };
  }
  
  return serializeDoc(employee);
}

async function searchEmployees(args) {
  const db = getDatabase();
  const employeesCollection = db.collection(COLLECTIONS.employees);
  const jobDataCollection = db.collection(COLLECTIONS.job_data);
  
  // Search across ALL employee database columns
  const employeeQuery = {
    $or: [
      // Personal Information
      { first_name: { $regex: args.query, $options: 'i' } },
      { last_name: { $regex: args.query, $options: 'i' } },
      { email: { $regex: args.query, $options: 'i' } },
      { employee_id: { $regex: args.query, $options: 'i' } },
      { phone: { $regex: args.query, $options: 'i' } },
      { gender: { $regex: args.query, $options: 'i' } },
      { marital_status: { $regex: args.query, $options: 'i' } },
      { nationality: { $regex: args.query, $options: 'i' } },
      { blood_group: { $regex: args.query, $options: 'i' } },
      
      // Address fields
      { 'address.street': { $regex: args.query, $options: 'i' } },
      { 'address.city': { $regex: args.query, $options: 'i' } },
      { 'address.state': { $regex: args.query, $options: 'i' } },
      { 'address.postal_code': { $regex: args.query, $options: 'i' } },
      { 'address.country': { $regex: args.query, $options: 'i' } },
      
      // Employment fields
      { employment_status: { $regex: args.query, $options: 'i' } },
      { employment_type: { $regex: args.query, $options: 'i' } },
      
      // ID fields
      { national_id: { $regex: args.query, $options: 'i' } },
      { passport_number: { $regex: args.query, $options: 'i' } },
      { driving_license: { $regex: args.query, $options: 'i' } },
      
      // Emergency contact
      { 'emergency_contact.name': { $regex: args.query, $options: 'i' } },
      { 'emergency_contact.phone': { $regex: args.query, $options: 'i' } },
      { 'emergency_contact.relationship': { $regex: args.query, $options: 'i' } }
    ]
  };
  
  // Also search in job_data collection for department, job title, etc.
  const jobDataQuery = {
    $or: [
      { department: { $regex: args.query, $options: 'i' } },
      { job_title: { $regex: args.query, $options: 'i' } },
      { division: { $regex: args.query, $options: 'i' } },
      { work_location: { $regex: args.query, $options: 'i' } },
      { work_email: { $regex: args.query, $options: 'i' } }
    ]
  };
  
  // Search employees collection
  let employees = await employeesCollection.find(employeeQuery).limit(50).toArray();
  
  // Search job_data collection and get matching employee_ids
  const matchingJobData = await jobDataCollection.find(jobDataQuery).limit(50).toArray();
  const employeeIdsFromJobData = matchingJobData.map(job => job.employee_id);
  
  // Get employees that match from job_data search
  if (employeeIdsFromJobData.length > 0) {
    const employeesFromJobData = await employeesCollection.find({
      employee_id: { $in: employeeIdsFromJobData }
    }).limit(50).toArray();
    
    // Merge results (avoid duplicates)
    const existingIds = new Set(employees.map(e => e.employee_id));
    employeesFromJobData.forEach(emp => {
      if (!existingIds.has(emp.employee_id)) {
        employees.push(emp);
      }
    });
  }
  return employees.map(serializeDoc);
}

async function listAttendance(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.attendance);
  
  const query = {};
  
  // Filter by employee_id
  if (args.employee_id) query.employee_id = args.employee_id;
  
  // Filter by status (present, absent, late, half_day, work_from_home)
  if (args.status) query.status = args.status;
  
  // Filter by date range
  if (args.date_from && args.date_to) {
    query.date = { $gte: args.date_from, $lte: args.date_to };
  } else if (args.date_from) {
    query.date = { $gte: args.date_from };
  } else if (args.date_to) {
    query.date = { $lte: args.date_to };
  }
  
  // Filter by specific date
  if (args.date) query.date = args.date;
  
  // Filter by clock_in/clock_out times
  if (args.clock_in) query.clock_in = { $regex: args.clock_in, $options: 'i' };
  if (args.clock_out) query.clock_out = { $regex: args.clock_out, $options: 'i' };
  
  // Filter by work hours (numeric comparison)
  if (args.work_hours_min) {
    query.work_hours = query.work_hours || {};
    query.work_hours.$gte = parseFloat(args.work_hours_min);
  }
  if (args.work_hours_max) {
    query.work_hours = query.work_hours || {};
    query.work_hours.$lte = parseFloat(args.work_hours_max);
  }
  
  // Filter by overtime hours
  if (args.overtime_hours_min) {
    query.overtime_hours = query.overtime_hours || {};
    query.overtime_hours.$gte = parseFloat(args.overtime_hours_min);
  }
  
  // Filter by notes/remarks
  if (args.notes) query.notes = { $regex: args.notes, $options: 'i' };
  
  const limit = args.limit || 50;
  const attendance = await collection.find(query).sort({ date: -1 }).limit(limit).toArray();
  
  return attendance.map(serializeDoc);
}

async function getAttendance(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.attendance);
  
  const objectId = toObjectId(args.attendance_id);
  if (!objectId) {
    return { error: 'Invalid attendance ID' };
  }
  
  const attendance = await collection.findOne({ _id: objectId });
  if (!attendance) {
    return { error: 'Attendance record not found' };
  }
  
  return serializeDoc(attendance);
}

async function listLeaves(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.leaves);
  
  const query = {};
  
  // Filter by employee_id
  if (args.employee_id) query.employee_id = args.employee_id;
  
  // Filter by leave_type (annual, sick, maternity, paternity, unpaid, personal, etc.)
  if (args.leave_type) query.leave_type = args.leave_type;
  
  // Filter by status (pending, approved, rejected, cancelled)
  if (args.status) query.status = args.status;
  
  // Filter by date ranges
  if (args.start_date_from) {
    query.start_date = query.start_date || {};
    query.start_date.$gte = args.start_date_from;
  }
  if (args.start_date_to) {
    query.start_date = query.start_date || {};
    query.start_date.$lte = args.start_date_to;
  }
  if (args.end_date_from) {
    query.end_date = query.end_date || {};
    query.end_date.$gte = args.end_date_from;
  }
  if (args.end_date_to) {
    query.end_date = query.end_date || {};
    query.end_date.$lte = args.end_date_to;
  }
  
  // Filter by number of days
  if (args.days_min) {
    query.days = query.days || {};
    query.days.$gte = parseFloat(args.days_min);
  }
  if (args.days_max) {
    query.days = query.days || {};
    query.days.$lte = parseFloat(args.days_max);
  }
  
  // Filter by reason (text search)
  if (args.reason) query.reason = { $regex: args.reason, $options: 'i' };
  
  // Filter by approved_by/rejected_by
  if (args.approved_by) query.approved_by = args.approved_by;
  if (args.rejected_by) query.rejected_by = args.rejected_by;
  
  // Filter by comments
  if (args.comments) query.comments = { $regex: args.comments, $options: 'i' };
  
  const limit = args.limit || 50;
  const leaves = await collection.find(query).sort({ created_at: -1 }).limit(limit).toArray();
  
  return leaves.map(serializeDoc);
}

async function getLeave(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.leaves);
  
  const objectId = toObjectId(args.leave_id);
  if (!objectId) {
    return { error: 'Invalid leave ID' };
  }
  
  const leave = await collection.findOne({ _id: objectId });
  if (!leave) {
    return { error: 'Leave request not found' };
  }
  
  return serializeDoc(leave);
}

async function listLeaveBalances(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.leave_balances);
  
  const query = {};
  if (args.employee_id) query.employee_id = args.employee_id;
  if (args.year) query.year = args.year;
  
  const limit = args.limit || 50;
  const balances = await collection.find(query).limit(limit).toArray();
  
  return balances.map(serializeDoc);
}

async function getLeaveBalance(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.leave_balances);
  
  const year = args.year || new Date().getFullYear();
  const balance = await collection.findOne({ 
    employee_id: args.employee_id,
    year: year
  });
  
  if (!balance) {
    return { error: 'Leave balance not found for this employee' };
  }
  
  return serializeDoc(balance);
}

async function listSalaryStructures(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.salary_structures);
  
  const query = {};
  if (args.employee_id) query.employee_id = args.employee_id;
  if (args.is_active !== undefined) query.is_active = args.is_active;
  
  const limit = args.limit || 50;
  const structures = await collection.find(query).limit(limit).toArray();
  
  return structures.map(serializeDoc);
}

async function listPayroll(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.payroll);
  
  const query = {};
  
  // Filter by employee_id
  if (args.employee_id) query.employee_id = args.employee_id;
  
  // Filter by status (pending, processed, paid, failed)
  if (args.status) query.status = args.status;
  
  // Filter by pay period
  if (args.pay_period_start_from) {
    query.pay_period_start = query.pay_period_start || {};
    query.pay_period_start.$gte = args.pay_period_start_from;
  }
  if (args.pay_period_start_to) {
    query.pay_period_start = query.pay_period_start || {};
    query.pay_period_start.$lte = args.pay_period_start_to;
  }
  if (args.pay_period_end_from) {
    query.pay_period_end = query.pay_period_end || {};
    query.pay_period_end.$gte = args.pay_period_end_from;
  }
  if (args.pay_period_end_to) {
    query.pay_period_end = query.pay_period_end || {};
    query.pay_period_end.$lte = args.pay_period_end_to;
  }
  
  // Filter by payment date
  if (args.payment_date_from) {
    query.payment_date = query.payment_date || {};
    query.payment_date.$gte = args.payment_date_from;
  }
  if (args.payment_date_to) {
    query.payment_date = query.payment_date || {};
    query.payment_date.$lte = args.payment_date_to;
  }
  
  // Filter by salary amounts (numeric comparisons)
  if (args.basic_salary_min) {
    query.basic_salary = query.basic_salary || {};
    query.basic_salary.$gte = parseFloat(args.basic_salary_min);
  }
  if (args.basic_salary_max) {
    query.basic_salary = query.basic_salary || {};
    query.basic_salary.$lte = parseFloat(args.basic_salary_max);
  }
  
  if (args.net_salary_min) {
    query.net_salary = query.net_salary || {};
    query.net_salary.$gte = parseFloat(args.net_salary_min);
  }
  if (args.net_salary_max) {
    query.net_salary = query.net_salary || {};
    query.net_salary.$lte = parseFloat(args.net_salary_max);
  }
  
  if (args.gross_salary_min) {
    query.gross_salary = query.gross_salary || {};
    query.gross_salary.$gte = parseFloat(args.gross_salary_min);
  }
  if (args.gross_salary_max) {
    query.gross_salary = query.gross_salary || {};
    query.gross_salary.$lte = parseFloat(args.gross_salary_max);
  }
  
  // Filter by payment method
  if (args.payment_method) query.payment_method = args.payment_method;
  
  // Filter by bank details
  if (args.bank_name) query.bank_name = { $regex: args.bank_name, $options: 'i' };
  if (args.account_number) query.account_number = args.account_number;
  
  const limit = args.limit || 50;
  const payrolls = await collection.find(query).sort({ payment_date: -1 }).limit(limit).toArray();
  
  return payrolls.map(serializeDoc);
}

async function getPayroll(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.payroll);
  
  const objectId = toObjectId(args.payroll_id);
  if (!objectId) {
    return { error: 'Invalid payroll ID' };
  }
  
  const payroll = await collection.findOne({ _id: objectId });
  if (!payroll) {
    return { error: 'Payroll record not found' };
  }
  
  return serializeDoc(payroll);
}

async function listJobData(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.job_data);
  
  const query = {};
  
  // Filter by employee_id
  if (args.employee_id) query.employee_id = args.employee_id;
  
  // Filter by organizational structure
  if (args.department) query.department = { $regex: args.department, $options: 'i' };
  if (args.division) query.division = { $regex: args.division, $options: 'i' };
  if (args.team) query.team = { $regex: args.team, $options: 'i' };
  
  // Filter by job details
  if (args.job_title) query.job_title = { $regex: args.job_title, $options: 'i' };
  if (args.job_level) query.job_level = { $regex: args.job_level, $options: 'i' };
  if (args.job_grade) query.job_grade = { $regex: args.job_grade, $options: 'i' };
  
  // Filter by location
  if (args.work_location) query.work_location = { $regex: args.work_location, $options: 'i' };
  if (args.office_location) query.office_location = { $regex: args.office_location, $options: 'i' };
  
  // Filter by reporting structure
  if (args.reporting_manager) query.reporting_manager = args.reporting_manager;
  if (args.reporting_manager_name) query.reporting_manager_name = { $regex: args.reporting_manager_name, $options: 'i' };
  
  // Filter by employment details
  if (args.employment_type) query.employment_type = args.employment_type;
  if (args.work_shift) query.work_shift = { $regex: args.work_shift, $options: 'i' };
  
  // Filter by dates
  if (args.join_date_from) {
    query.join_date = query.join_date || {};
    query.join_date.$gte = args.join_date_from;
  }
  if (args.join_date_to) {
    query.join_date = query.join_date || {};
    query.join_date.$lte = args.join_date_to;
  }
  
  if (args.probation_end_date_from) {
    query.probation_end_date = query.probation_end_date || {};
    query.probation_end_date.$gte = args.probation_end_date_from;
  }
  if (args.probation_end_date_to) {
    query.probation_end_date = query.probation_end_date || {};
    query.probation_end_date.$lte = args.probation_end_date_to;
  }
  
  // Filter by status
  if (args.is_active !== undefined) query.is_active = args.is_active;
  
  // Filter by work email
  if (args.work_email) query.work_email = { $regex: args.work_email, $options: 'i' };
  
  const limit = args.limit || 50;
  const jobData = await collection.find(query).limit(limit).toArray();
  
  return jobData.map(serializeDoc);
}

async function searchJobData(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.job_data);
  
  const query = {
    $or: [
      { department: { $regex: args.query, $options: 'i' } },
      { job_title: { $regex: args.query, $options: 'i' } },
      { division: { $regex: args.query, $options: 'i' } },
      { team: { $regex: args.query, $options: 'i' } },
      { work_location: { $regex: args.query, $options: 'i' } }
    ]
  };
  
  const jobData = await collection.find(query).limit(50).toArray();
  return jobData.map(serializeDoc);
}

async function getEmployeeComplete(args) {
  const db = getDatabase();
  const employeesCollection = db.collection(COLLECTIONS.employees);
  const jobDataCollection = db.collection(COLLECTIONS.job_data);
  const attendanceCollection = db.collection(COLLECTIONS.attendance);
  const leavesCollection = db.collection(COLLECTIONS.leaves);
  const leaveBalancesCollection = db.collection(COLLECTIONS.leave_balances);
  const payrollCollection = db.collection(COLLECTIONS.payroll);
  
  // Get employee basic info
  const employee = await employeesCollection.findOne({ employee_id: args.employee_id });
  if (!employee) {
    return { error: 'Employee not found' };
  }
  
  const result = {
    employee: serializeDoc(employee),
    job_data: null,
    attendance_summary: null,
    leave_info: null,
    payroll_info: null
  };
  
  // Get job/organizational data (default: true)
  if (args.include_job_data !== false) {
    const jobData = await jobDataCollection.findOne({ employee_id: args.employee_id });
    result.job_data = jobData ? serializeDoc(jobData) : null;
  }
  
  // Get recent attendance (last 30 days) (default: true)
  if (args.include_attendance !== false) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const attendanceRecords = await attendanceCollection.find({
      employee_id: args.employee_id,
      date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] }
    }).sort({ date: -1 }).limit(30).toArray();
    
    const totalDays = attendanceRecords.length;
    const present = attendanceRecords.filter(a => a.status === 'present').length;
    const absent = attendanceRecords.filter(a => a.status === 'absent').length;
    const late = attendanceRecords.filter(a => a.status === 'late').length;
    const wfh = attendanceRecords.filter(a => a.status === 'work_from_home').length;
    
    const totalWorkHours = attendanceRecords.reduce((sum, a) => sum + (a.work_hours || 0), 0);
    const totalOvertime = attendanceRecords.reduce((sum, a) => sum + (a.overtime_hours || 0), 0);
    
    result.attendance_summary = {
      last_30_days: {
        total_days: totalDays,
        present: present,
        absent: absent,
        late: late,
        work_from_home: wfh,
        total_work_hours: totalWorkHours.toFixed(2),
        total_overtime_hours: totalOvertime.toFixed(2)
      },
      recent_records: attendanceRecords.slice(0, 10).map(serializeDoc)
    };
  }
  
  // Get leave information (default: true)
  if (args.include_leaves !== false) {
    // Get leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await leaveBalancesCollection.findOne({
      employee_id: args.employee_id,
      year: currentYear
    });
    
    // Get recent leave requests
    const leaveRequests = await leavesCollection.find({
      employee_id: args.employee_id
    }).sort({ created_at: -1 }).limit(10).toArray();
    
    // Count by status
    const pending = leaveRequests.filter(l => l.status === 'pending').length;
    const approved = leaveRequests.filter(l => l.status === 'approved').length;
    const rejected = leaveRequests.filter(l => l.status === 'rejected').length;
    
    result.leave_info = {
      balance: leaveBalance ? serializeDoc(leaveBalance) : null,
      requests_summary: {
        total: leaveRequests.length,
        pending: pending,
        approved: approved,
        rejected: rejected
      },
      recent_requests: leaveRequests.map(serializeDoc)
    };
  }
  
  // Get latest payroll information (default: true)
  if (args.include_payroll !== false) {
    // Get latest 3 payroll records
    const payrollRecords = await payrollCollection.find({
      employee_id: args.employee_id
    }).sort({ payment_date: -1 }).limit(3).toArray();
    
    if (payrollRecords.length > 0) {
      const latest = payrollRecords[0];
      const avgNetSalary = payrollRecords.reduce((sum, p) => sum + (p.net_salary || 0), 0) / payrollRecords.length;
      
      result.payroll_info = {
        latest_payment: serializeDoc(latest),
        recent_payments: payrollRecords.map(serializeDoc),
        average_net_salary: avgNetSalary.toFixed(2)
      };
    }
  }
  
  return result;
}

// Optimized function using MongoDB Aggregation Pipeline with $lookup (JOIN operations)
async function listEmployeesWithRelations(args) {
  const db = getDatabase();
  const employeesCollection = db.collection(COLLECTIONS.employees);
  
  // Build match stage for filtering
  const matchStage = {};
  if (args.status) matchStage.employment_status = args.status;
  
  // Build aggregation pipeline with $lookup (foreign key joins)
  const pipeline = [
    // Filter employees
    { $match: matchStage },
    { $limit: args.limit || 20 },
    
    // JOIN with job_data collection (Foreign Key: employee_id)
    {
      $lookup: {
        from: COLLECTIONS.job_data,
        localField: 'employee_id',
        foreignField: 'employee_id',
        as: 'job_data'
      }
    },
    { $unwind: { path: '$job_data', preserveNullAndEmptyArrays: true } },
  ];
  
  // Optional: Filter by department (from job_data)
  if (args.department) {
    pipeline.push({
      $match: { 'job_data.department': { $regex: args.department, $options: 'i' } }
    });
  }
  
  // JOIN with attendance collection for summary (last 30 days)
  if (args.include_attendance_summary !== false) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    pipeline.push(
      // JOIN attendance records
      {
        $lookup: {
          from: COLLECTIONS.attendance,
          let: { emp_id: '$employee_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$employee_id', '$$emp_id'] },
                date: { $gte: dateStr }
              }
            },
            { $sort: { date: -1 } },
            { $limit: 30 }
          ],
          as: 'attendance_records'
        }
      },
      // Calculate attendance summary
      {
        $addFields: {
          attendance_summary: {
            total_days: { $size: '$attendance_records' },
            present_days: {
              $size: {
                $filter: {
                  input: '$attendance_records',
                  cond: { $eq: ['$$this.status', 'present'] }
                }
              }
            },
            absent_days: {
              $size: {
                $filter: {
                  input: '$attendance_records',
                  cond: { $eq: ['$$this.status', 'absent'] }
                }
              }
            },
            late_days: {
              $size: {
                $filter: {
                  input: '$attendance_records',
                  cond: { $eq: ['$$this.status', 'late'] }
                }
              }
            },
            total_work_hours: {
              $reduce: {
                input: '$attendance_records',
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.work_hours', 0] }] }
              }
            }
          }
        }
      },
      // Remove detailed records, keep summary only
      { $project: { attendance_records: 0 } }
    );
  }
  
  // JOIN with leave_balances collection
  if (args.include_leave_balance !== false) {
    const currentYear = new Date().getFullYear();
    pipeline.push({
      $lookup: {
        from: COLLECTIONS.leave_balances,
        let: { emp_id: '$employee_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$employee_id', '$$emp_id'] },
              year: currentYear
            }
          }
        ],
        as: 'leave_balance'
      }
    });
    pipeline.push({ $unwind: { path: '$leave_balance', preserveNullAndEmptyArrays: true } });
  }
  
  // JOIN with payroll collection (latest record)
  if (args.include_latest_payroll !== false) {
    pipeline.push({
      $lookup: {
        from: COLLECTIONS.payroll,
        let: { emp_id: '$employee_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$employee_id', '$$emp_id'] } } },
          { $sort: { payment_date: -1 } },
          { $limit: 1 }
        ],
        as: 'latest_payroll'
      }
    });
    pipeline.push({
      $unwind: { path: '$latest_payroll', preserveNullAndEmptyArrays: true }
    });
  }
  
  // Execute aggregation pipeline
  const results = await employeesCollection.aggregate(pipeline).toArray();
  
  return results.map(doc => {
    // Serialize ObjectIds
    if (doc._id) doc._id = doc._id.toString();
    if (doc.job_data && doc.job_data._id) doc.job_data._id = doc.job_data._id.toString();
    if (doc.leave_balance && doc.leave_balance._id) doc.leave_balance._id = doc.leave_balance._id.toString();
    if (doc.latest_payroll && doc.latest_payroll._id) doc.latest_payroll._id = doc.latest_payroll._id.toString();
    return doc;
  });
}

async function getJobData(args) {
  const db = getDatabase();
  const collection = db.collection(COLLECTIONS.job_data);
  
  const jobData = await collection.findOne({ employee_id: args.employee_id });
  if (!jobData) {
    return { error: 'Job data not found for this employee' };
  }
  
  return serializeDoc(jobData);
}

async function exportToCsv(args) {
  const db = getDatabase();
  const collectionName = COLLECTIONS[args.collection];
  
  if (!collectionName) {
    return { error: 'Invalid collection name' };
  }
  
  const collection = db.collection(collectionName);
  const limit = args.limit || 100;
  const documents = await collection.find({}).limit(limit).toArray();
  
  if (documents.length === 0) {
    return { message: 'No records found', csv: '' };
  }
  
  // Flatten nested objects for CSV
  const flattenedDocs = documents.map(doc => {
    const flat = {};
    for (const [key, value] of Object.entries(doc)) {
      if (key === '_id') {
        flat[key] = value.toString();
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        for (const [subKey, subValue] of Object.entries(value)) {
          flat[`${key}_${subKey}`] = subValue;
        }
      } else if (Array.isArray(value)) {
        flat[key] = value.join(', ');
      } else {
        flat[key] = value;
      }
    }
    return flat;
  });
  
  const csv = stringify(flattenedDocs, { header: true });
  
  return { 
    message: `Exported ${documents.length} records from ${args.collection}`,
    csv: csv
  };
}

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    
    switch (name) {
      case 'list_employees':
        result = await listEmployees(args || {});
        break;
      case 'get_employee':
        result = await getEmployee(args);
        break;
      case 'search_employees':
        result = await searchEmployees(args);
        break;
      case 'list_attendance':
        result = await listAttendance(args || {});
        break;
      case 'get_attendance':
        result = await getAttendance(args);
        break;
      case 'list_leaves':
        result = await listLeaves(args || {});
        break;
      case 'get_leave':
        result = await getLeave(args);
        break;
      case 'list_leave_balances':
        result = await listLeaveBalances(args || {});
        break;
      case 'get_leave_balance':
        result = await getLeaveBalance(args);
        break;
      case 'list_salary_structures':
        result = await listSalaryStructures(args || {});
        break;
      case 'list_payroll':
        result = await listPayroll(args || {});
        break;
      case 'get_payroll':
        result = await getPayroll(args);
        break;
      case 'list_job_data':
        result = await listJobData(args || {});
        break;
      case 'search_job_data':
        result = await searchJobData(args);
        break;
      case 'get_job_data':
        result = await getJobData(args);
        break;
      case 'get_employee_complete':
        result = await getEmployeeComplete(args);
        break;
      case 'list_employees_with_relations':
        result = await listEmployeesWithRelations(args || {});
        break;
      case 'export_to_csv':
        result = await exportToCsv(args);
        break;
      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true
        };
    }
    
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('EMS MCP Server running on stdio');
}

main().catch(console.error);
