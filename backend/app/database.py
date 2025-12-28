from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ems_database")

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
