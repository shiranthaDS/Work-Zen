from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.database import get_database, COLLECTIONS
from app.models import (
    SalaryStructureCreate, SalaryStructureUpdate, SalaryStructureResponse,
    PayrollCreate, PayrollUpdate, PayrollResponse
)

router = APIRouter(prefix="/payroll", tags=["Payroll & Compensation"])

def serialize_doc(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ============== SALARY STRUCTURE ==============

@router.post("/salary-structure", response_model=dict)
async def create_salary_structure(salary: SalaryStructureCreate):
    db = get_database()
    collection = db[COLLECTIONS["salary_structures"]]
    
    salary_dict = salary.model_dump()
    salary_dict["created_at"] = datetime.utcnow()
    salary_dict["updated_at"] = datetime.utcnow()
    
    result = await collection.insert_one(salary_dict)
    
    return {"id": str(result.inserted_id), "message": "Salary structure created successfully"}


@router.get("/salary-structure", response_model=List[dict])
async def list_salary_structures(
    employee_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    db = get_database()
    collection = db[COLLECTIONS["salary_structures"]]
    
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if is_active is not None:
        query["is_active"] = is_active
    
    cursor = collection.find(query).skip(skip).limit(limit)
    structures = await cursor.to_list(length=limit)
    
    return [serialize_doc(s) for s in structures]


@router.get("/salary-structure/{structure_id}", response_model=dict)
async def get_salary_structure(structure_id: str):
    db = get_database()
    collection = db[COLLECTIONS["salary_structures"]]
    
    try:
        structure = await collection.find_one({"_id": ObjectId(structure_id)})
    except:
        structure = None
    
    if not structure:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    
    return serialize_doc(structure)


@router.get("/salary-structure/employee/{employee_id}", response_model=dict)
async def get_employee_salary_structure(employee_id: str):
    db = get_database()
    collection = db[COLLECTIONS["salary_structures"]]
    
    structure = await collection.find_one({
        "employee_id": employee_id,
        "is_active": True
    })
    
    if not structure:
        raise HTTPException(status_code=404, detail="Active salary structure not found for this employee")
    
    return serialize_doc(structure)


@router.put("/salary-structure/{structure_id}", response_model=dict)
async def update_salary_structure(structure_id: str, salary: SalaryStructureUpdate):
    db = get_database()
    collection = db[COLLECTIONS["salary_structures"]]
    
    update_data = {k: v for k, v in salary.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(structure_id)},
            {"$set": update_data}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Salary structure not found or no changes made")
    
    return {"message": "Salary structure updated successfully"}


@router.delete("/salary-structure/{structure_id}", response_model=dict)
async def delete_salary_structure(structure_id: str):
    db = get_database()
    collection = db[COLLECTIONS["salary_structures"]]
    
    try:
        result = await collection.delete_one({"_id": ObjectId(structure_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    
    return {"message": "Salary structure deleted successfully"}


# ============== PAYROLL RECORDS ==============

@router.post("/", response_model=dict)
async def create_payroll(payroll: PayrollCreate):
    db = get_database()
    collection = db[COLLECTIONS["payroll"]]
    
    payroll_dict = payroll.model_dump()
    payroll_dict["created_at"] = datetime.utcnow()
    payroll_dict["updated_at"] = datetime.utcnow()
    
    result = await collection.insert_one(payroll_dict)
    
    return {"id": str(result.inserted_id), "message": "Payroll record created successfully"}


@router.get("/", response_model=List[dict])
async def list_payroll(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    pay_period_start: Optional[str] = None,
    pay_period_end: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    db = get_database()
    collection = db[COLLECTIONS["payroll"]]
    
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    if pay_period_start:
        query["pay_period_start"] = {"$gte": pay_period_start}
    if pay_period_end:
        query["pay_period_end"] = {"$lte": pay_period_end}
    
    cursor = collection.find(query).sort("payment_date", -1).skip(skip).limit(limit)
    payrolls = await cursor.to_list(length=limit)
    
    return [serialize_doc(p) for p in payrolls]


@router.get("/{payroll_id}", response_model=dict)
async def get_payroll(payroll_id: str):
    db = get_database()
    collection = db[COLLECTIONS["payroll"]]
    
    try:
        payroll = await collection.find_one({"_id": ObjectId(payroll_id)})
    except:
        payroll = None
    
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    return serialize_doc(payroll)


@router.get("/employee/{employee_id}/history", response_model=List[dict])
async def get_employee_payroll_history(
    employee_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=100)
):
    db = get_database()
    collection = db[COLLECTIONS["payroll"]]
    
    cursor = collection.find({"employee_id": employee_id}).sort("payment_date", -1).skip(skip).limit(limit)
    payrolls = await cursor.to_list(length=limit)
    
    return [serialize_doc(p) for p in payrolls]


@router.put("/{payroll_id}", response_model=dict)
async def update_payroll(payroll_id: str, payroll: PayrollUpdate):
    db = get_database()
    collection = db[COLLECTIONS["payroll"]]
    
    update_data = {k: v for k, v in payroll.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(payroll_id)},
            {"$set": update_data}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Payroll record not found or no changes made")
    
    return {"message": "Payroll record updated successfully"}


@router.put("/{payroll_id}/process", response_model=dict)
async def process_payroll(payroll_id: str, processed_by: str):
    db = get_database()
    collection = db[COLLECTIONS["payroll"]]
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(payroll_id)},
            {"$set": {
                "status": "processed",
                "processed_by": processed_by,
                "updated_at": datetime.utcnow()
            }}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    return {"message": "Payroll processed successfully"}


@router.put("/{payroll_id}/pay", response_model=dict)
async def mark_payroll_paid(payroll_id: str, transaction_id: str):
    db = get_database()
    collection = db[COLLECTIONS["payroll"]]
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(payroll_id)},
            {"$set": {
                "status": "paid",
                "transaction_id": transaction_id,
                "updated_at": datetime.utcnow()
            }}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    return {"message": "Payroll marked as paid"}


@router.delete("/{payroll_id}", response_model=dict)
async def delete_payroll(payroll_id: str):
    db = get_database()
    collection = db[COLLECTIONS["payroll"]]
    
    try:
        result = await collection.delete_one({"_id": ObjectId(payroll_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    return {"message": "Payroll record deleted successfully"}
