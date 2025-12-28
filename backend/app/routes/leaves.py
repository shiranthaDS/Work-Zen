from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.database import get_database, COLLECTIONS
from app.models import (
    LeaveCreate, LeaveUpdate, LeaveResponse,
    LeaveBalanceCreate, LeaveBalanceUpdate, LeaveBalanceResponse
)

router = APIRouter(prefix="/leaves", tags=["Leave Management"])

def serialize_doc(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ============== LEAVE REQUESTS ==============

@router.post("/", response_model=dict)
async def create_leave(leave: LeaveCreate):
    db = get_database()
    collection = db[COLLECTIONS["leaves"]]
    
    leave_dict = leave.model_dump()
    leave_dict["created_at"] = datetime.utcnow()
    leave_dict["updated_at"] = datetime.utcnow()
    
    result = await collection.insert_one(leave_dict)
    
    return {"id": str(result.inserted_id), "message": "Leave request created successfully"}


@router.get("/", response_model=List[dict])
async def list_leaves(
    employee_id: Optional[str] = None,
    leave_type: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    db = get_database()
    collection = db[COLLECTIONS["leaves"]]
    
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if leave_type:
        query["leave_type"] = leave_type
    if status:
        query["status"] = status
    if date_from and date_to:
        query["start_date"] = {"$gte": date_from, "$lte": date_to}
    elif date_from:
        query["start_date"] = {"$gte": date_from}
    elif date_to:
        query["start_date"] = {"$lte": date_to}
    
    cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    leaves = await cursor.to_list(length=limit)
    
    return [serialize_doc(leave) for leave in leaves]


@router.get("/{leave_id}", response_model=dict)
async def get_leave(leave_id: str):
    db = get_database()
    collection = db[COLLECTIONS["leaves"]]
    
    try:
        leave = await collection.find_one({"_id": ObjectId(leave_id)})
    except:
        leave = None
    
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    return serialize_doc(leave)


@router.put("/{leave_id}", response_model=dict)
async def update_leave(leave_id: str, leave: LeaveUpdate):
    db = get_database()
    collection = db[COLLECTIONS["leaves"]]
    
    update_data = {k: v for k, v in leave.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(leave_id)},
            {"$set": update_data}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found or no changes made")
    
    return {"message": "Leave request updated successfully"}


@router.put("/{leave_id}/approve", response_model=dict)
async def approve_leave(leave_id: str, approved_by: str):
    db = get_database()
    collection = db[COLLECTIONS["leaves"]]
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(leave_id)},
            {"$set": {
                "status": "approved",
                "approved_by": approved_by,
                "approval_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "updated_at": datetime.utcnow()
            }}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    return {"message": "Leave request approved successfully"}


@router.put("/{leave_id}/reject", response_model=dict)
async def reject_leave(leave_id: str, rejected_by: str, reason: str):
    db = get_database()
    collection = db[COLLECTIONS["leaves"]]
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(leave_id)},
            {"$set": {
                "status": "rejected",
                "approved_by": rejected_by,
                "rejection_reason": reason,
                "approval_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "updated_at": datetime.utcnow()
            }}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    return {"message": "Leave request rejected"}


@router.delete("/{leave_id}", response_model=dict)
async def delete_leave(leave_id: str):
    db = get_database()
    collection = db[COLLECTIONS["leaves"]]
    
    try:
        result = await collection.delete_one({"_id": ObjectId(leave_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    return {"message": "Leave request deleted successfully"}


# ============== LEAVE BALANCE ==============

@router.post("/balance", response_model=dict)
async def create_leave_balance(balance: LeaveBalanceCreate):
    db = get_database()
    collection = db[COLLECTIONS["leave_balances"]]
    
    # Check if balance already exists for this employee and year
    existing = await collection.find_one({
        "employee_id": balance.employee_id,
        "year": balance.year
    })
    if existing:
        raise HTTPException(status_code=400, detail="Leave balance already exists for this year")
    
    balance_dict = balance.model_dump()
    balance_dict["created_at"] = datetime.utcnow()
    balance_dict["updated_at"] = datetime.utcnow()
    
    result = await collection.insert_one(balance_dict)
    
    return {"id": str(result.inserted_id), "message": "Leave balance created successfully"}


@router.get("/balance", response_model=List[dict])
async def list_leave_balances(
    employee_id: Optional[str] = None,
    year: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    db = get_database()
    collection = db[COLLECTIONS["leave_balances"]]
    
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if year:
        query["year"] = year
    
    cursor = collection.find(query).skip(skip).limit(limit)
    balances = await cursor.to_list(length=limit)
    
    return [serialize_doc(bal) for bal in balances]


@router.get("/balance/{balance_id}", response_model=dict)
async def get_leave_balance(balance_id: str):
    db = get_database()
    collection = db[COLLECTIONS["leave_balances"]]
    
    try:
        balance = await collection.find_one({"_id": ObjectId(balance_id)})
    except:
        balance = None
    
    if not balance:
        raise HTTPException(status_code=404, detail="Leave balance not found")
    
    return serialize_doc(balance)


@router.get("/balance/employee/{employee_id}", response_model=dict)
async def get_employee_leave_balance(employee_id: str, year: Optional[int] = None):
    db = get_database()
    collection = db[COLLECTIONS["leave_balances"]]
    
    query = {"employee_id": employee_id}
    if year:
        query["year"] = year
    else:
        query["year"] = datetime.utcnow().year
    
    balance = await collection.find_one(query)
    
    if not balance:
        raise HTTPException(status_code=404, detail="Leave balance not found for this employee")
    
    return serialize_doc(balance)


@router.put("/balance/{balance_id}", response_model=dict)
async def update_leave_balance(balance_id: str, balance: LeaveBalanceUpdate):
    db = get_database()
    collection = db[COLLECTIONS["leave_balances"]]
    
    update_data = {k: v for k, v in balance.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(balance_id)},
            {"$set": update_data}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Leave balance not found or no changes made")
    
    return {"message": "Leave balance updated successfully"}


@router.delete("/balance/{balance_id}", response_model=dict)
async def delete_leave_balance(balance_id: str):
    db = get_database()
    collection = db[COLLECTIONS["leave_balances"]]
    
    try:
        result = await collection.delete_one({"_id": ObjectId(balance_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Leave balance not found")
    
    return {"message": "Leave balance deleted successfully"}
