from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.database import get_database, COLLECTIONS
from app.models import (
    AttendanceCreate, AttendanceUpdate, AttendanceResponse
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])

def serialize_doc(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.post("/", response_model=dict)
async def create_attendance(attendance: AttendanceCreate):
    db = get_database()
    collection = db[COLLECTIONS["attendance"]]
    
    # Check if attendance already exists for this employee on this date
    existing = await collection.find_one({
        "employee_id": attendance.employee_id,
        "date": attendance.date
    })
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already recorded for this date")
    
    attendance_dict = attendance.model_dump()
    attendance_dict["created_at"] = datetime.utcnow()
    attendance_dict["updated_at"] = datetime.utcnow()
    
    result = await collection.insert_one(attendance_dict)
    
    return {"id": str(result.inserted_id), "message": "Attendance recorded successfully"}


@router.get("/", response_model=List[dict])
async def list_attendance(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    db = get_database()
    collection = db[COLLECTIONS["attendance"]]
    
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    if date_from and date_to:
        query["date"] = {"$gte": date_from, "$lte": date_to}
    elif date_from:
        query["date"] = {"$gte": date_from}
    elif date_to:
        query["date"] = {"$lte": date_to}
    
    cursor = collection.find(query).sort("date", -1).skip(skip).limit(limit)
    attendance = await cursor.to_list(length=limit)
    
    return [serialize_doc(att) for att in attendance]


@router.get("/{attendance_id}", response_model=dict)
async def get_attendance(attendance_id: str):
    db = get_database()
    collection = db[COLLECTIONS["attendance"]]
    
    try:
        attendance = await collection.find_one({"_id": ObjectId(attendance_id)})
    except:
        attendance = None
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    return serialize_doc(attendance)


@router.get("/employee/{employee_id}/date/{date}", response_model=dict)
async def get_attendance_by_employee_date(employee_id: str, date: str):
    db = get_database()
    collection = db[COLLECTIONS["attendance"]]
    
    attendance = await collection.find_one({
        "employee_id": employee_id,
        "date": date
    })
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    return serialize_doc(attendance)


@router.put("/{attendance_id}", response_model=dict)
async def update_attendance(attendance_id: str, attendance: AttendanceUpdate):
    db = get_database()
    collection = db[COLLECTIONS["attendance"]]
    
    update_data = {k: v for k, v in attendance.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(attendance_id)},
            {"$set": update_data}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Attendance record not found or no changes made")
    
    return {"message": "Attendance updated successfully"}


@router.delete("/{attendance_id}", response_model=dict)
async def delete_attendance(attendance_id: str):
    db = get_database()
    collection = db[COLLECTIONS["attendance"]]
    
    try:
        result = await collection.delete_one({"_id": ObjectId(attendance_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    return {"message": "Attendance record deleted successfully"}


@router.get("/employee/{employee_id}/summary", response_model=dict)
async def get_attendance_summary(
    employee_id: str,
    month: Optional[int] = None,
    year: Optional[int] = None
):
    db = get_database()
    collection = db[COLLECTIONS["attendance"]]
    
    query = {"employee_id": employee_id}
    
    if month and year:
        month_str = f"{year}-{str(month).zfill(2)}"
        query["date"] = {"$regex": f"^{month_str}"}
    
    cursor = collection.find(query)
    records = await cursor.to_list(length=1000)
    
    summary = {
        "total_days": len(records),
        "present": sum(1 for r in records if r.get("status") == "present"),
        "absent": sum(1 for r in records if r.get("status") == "absent"),
        "late": sum(1 for r in records if r.get("status") == "late"),
        "half_day": sum(1 for r in records if r.get("status") == "half_day"),
        "work_from_home": sum(1 for r in records if r.get("status") == "work_from_home"),
        "total_hours": sum(r.get("total_hours", 0) for r in records),
        "overtime_hours": sum(r.get("overtime_hours", 0) for r in records)
    }
    
    return summary
