from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# Support both MONGO_URL (docker-compose) and MONGODB_URI (legacy) with fallback
MONGODB_URI = os.getenv("MONGO_URL") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017"
DATABASE_NAME = os.getenv("MONGO_DB_NAME") or os.getenv("DATABASE_NAME", "ems_database")

class Database:
    client: AsyncIOMotorClient = None
    sync_client: MongoClient = None

db = Database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(MONGODB_URI)
    db.sync_client = MongoClient(MONGODB_URI)
    print(f"Connected to MongoDB: {DATABASE_NAME}")

async def close_mongo_connection():
    if db.client:
        db.client.close()
    if db.sync_client:
        db.sync_client.close()
    print("Closed MongoDB connection")

def get_database():
    return db.client[DATABASE_NAME]

def get_sync_database():
    return db.sync_client[DATABASE_NAME]

# Collection names
COLLECTIONS = {
    "employees": "employees",
    "job_data": "job_data",
    "attendance": "attendance",
    "leaves": "leaves",
    "leave_balances": "leave_balances",
    "salary_structures": "salary_structures",
    "payroll": "payroll"
}
