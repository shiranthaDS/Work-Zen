import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Support both MONGO_URL (docker-compose) and MONGODB_URI (legacy) with fallback
const MONGODB_URI = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.MONGO_DB_NAME || process.env.DATABASE_NAME || 'ems_database';

let client = null;
let db = null;

export async function connectToMongoDB() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.error('Connected to MongoDB');
  }
  return db;
}

export async function closeMongoDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getDatabase() {
  return db;
}

export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export const COLLECTIONS = {
  employees: 'employees',
  job_data: 'job_data',
  attendance: 'attendance',
  leaves: 'leaves',
  leave_balances: 'leave_balances',
  salary_structures: 'salary_structures',
  payroll: 'payroll'
};
