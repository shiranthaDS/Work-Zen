from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.database import get_database, COLLECTIONS
from app.models import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse
)

router = APIRouter(prefix="/employees", tags=["Employees"])

def serialize_doc(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.post("/", response_model=dict)
async def create_employee(employee: EmployeeCreate):
    db = get_database()
    collection = db[COLLECTIONS["employees"]]
    
    # Check if employee_id already exists
    existing = await collection.find_one({"employee_id": employee.employee_id})
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    
    # Check if email already exists
    existing_email = await collection.find_one({"email": employee.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    employee_dict = employee.model_dump()
    employee_dict["created_at"] = datetime.utcnow()
    employee_dict["updated_at"] = datetime.utcnow()
    
    result = await collection.insert_one(employee_dict)
    
    return {"id": str(result.inserted_id), "message": "Employee created successfully"}


@router.get("/", response_model=List[dict])
async def list_employees(
    status: Optional[str] = None,
    employment_type: Optional[str] = None,
    department: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    db = get_database()
    collection = db[COLLECTIONS["employees"]]
    
    query = {}
    if status:
        query["employment_status"] = status
    if employment_type:
        query["employment_type"] = employment_type
    
    cursor = collection.find(query).skip(skip).limit(limit)
    employees = await cursor.to_list(length=limit)
    
    return [serialize_doc(emp) for emp in employees]


@router.get("/{employee_id}", response_model=dict)
async def get_employee(employee_id: str):
    db = get_database()
    collection = db[COLLECTIONS["employees"]]
    
    # Try to find by MongoDB _id first
    try:
        employee = await collection.find_one({"_id": ObjectId(employee_id)})
    except:
        employee = None
    
    # If not found, try employee_id field
    if not employee:
        employee = await collection.find_one({"employee_id": employee_id})
    
    # If still not found, try email
    if not employee:
        employee = await collection.find_one({"email": employee_id})
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return serialize_doc(employee)


@router.put("/{employee_id}", response_model=dict)
async def update_employee(employee_id: str, employee: EmployeeUpdate):
    db = get_database()
    collection = db[COLLECTIONS["employees"]]
    
    update_data = {k: v for k, v in employee.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Try to find by MongoDB _id first
    try:
        result = await collection.update_one(
            {"_id": ObjectId(employee_id)},
            {"$set": update_data}
        )
    except:
        result = await collection.update_one(
            {"employee_id": employee_id},
            {"$set": update_data}
        )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found or no changes made")
    
    return {"message": "Employee updated successfully"}


@router.delete("/{employee_id}", response_model=dict)
async def delete_employee(employee_id: str):
    db = get_database()
    collection = db[COLLECTIONS["employees"]]
    
    # Try to delete by MongoDB _id first
    try:
        result = await collection.delete_one({"_id": ObjectId(employee_id)})
    except:
        result = await collection.delete_one({"employee_id": employee_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return {"message": "Employee deleted successfully"}


@router.get("/search/query", response_model=List[dict])
async def search_employees(
    q: str = Query(..., description="Search query"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    db = get_database()
    collection = db[COLLECTIONS["employees"]]
    
    # Search across multiple fields
    query = {
        "$or": [
            {"first_name": {"$regex": q, "$options": "i"}},
            {"last_name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"employee_id": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}}
        ]
    }
    
    cursor = collection.find(query).skip(skip).limit(limit)
    employees = await cursor.to_list(length=limit)
    
    return [serialize_doc(emp) for emp in employees]
