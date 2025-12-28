from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.database import get_database, COLLECTIONS
from app.models import (
    JobDataCreate, JobDataUpdate, JobDataResponse
)

router = APIRouter(prefix="/job-data", tags=["Job & Organizational Data"])

def serialize_doc(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


@router.post("/", response_model=dict)
async def create_job_data(job_data: JobDataCreate):
    db = get_database()
    collection = db[COLLECTIONS["job_data"]]
    
    job_dict = job_data.model_dump()
    job_dict["created_at"] = datetime.utcnow()
    job_dict["updated_at"] = datetime.utcnow()
    
    result = await collection.insert_one(job_dict)
    
    return {"id": str(result.inserted_id), "message": "Job data created successfully"}


@router.get("/", response_model=List[dict])
async def list_job_data(
    department: Optional[str] = None,
    job_title: Optional[str] = None,
    work_location: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    db = get_database()
    collection = db[COLLECTIONS["job_data"]]
    
    query = {}
    if department:
        query["department"] = {"$regex": department, "$options": "i"}
    if job_title:
        query["job_title"] = {"$regex": job_title, "$options": "i"}
    if work_location:
        query["work_location"] = {"$regex": work_location, "$options": "i"}
    
    cursor = collection.find(query).skip(skip).limit(limit)
    job_data = await cursor.to_list(length=limit)
    
    return [serialize_doc(job) for job in job_data]


@router.get("/employee/{employee_id}", response_model=dict)
async def get_job_data_by_employee(employee_id: str):
    db = get_database()
    collection = db[COLLECTIONS["job_data"]]
    
    job_data = await collection.find_one({"employee_id": employee_id})
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job data not found for this employee")
    
    return serialize_doc(job_data)


@router.get("/{job_data_id}", response_model=dict)
async def get_job_data(job_data_id: str):
    db = get_database()
    collection = db[COLLECTIONS["job_data"]]
    
    try:
        job_data = await collection.find_one({"_id": ObjectId(job_data_id)})
    except:
        job_data = None
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job data not found")
    
    return serialize_doc(job_data)


@router.put("/{job_data_id}", response_model=dict)
async def update_job_data(job_data_id: str, job_data: JobDataUpdate):
    db = get_database()
    collection = db[COLLECTIONS["job_data"]]
    
    update_data = {k: v for k, v in job_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(job_data_id)},
            {"$set": update_data}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Job data not found or no changes made")
    
    return {"message": "Job data updated successfully"}


@router.delete("/{job_data_id}", response_model=dict)
async def delete_job_data(job_data_id: str):
    db = get_database()
    collection = db[COLLECTIONS["job_data"]]
    
    try:
        result = await collection.delete_one({"_id": ObjectId(job_data_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job data not found")
    
    return {"message": "Job data deleted successfully"}


@router.get("/search/query", response_model=List[dict])
async def search_job_data(
    q: str = Query(..., description="Search query"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    db = get_database()
    collection = db[COLLECTIONS["job_data"]]
    
    query = {
        "$or": [
            {"department": {"$regex": q, "$options": "i"}},
            {"job_title": {"$regex": q, "$options": "i"}},
            {"division": {"$regex": q, "$options": "i"}},
            {"team": {"$regex": q, "$options": "i"}},
            {"work_location": {"$regex": q, "$options": "i"}}
        ]
    }
    
    cursor = collection.find(query).skip(skip).limit(limit)
    job_data = await cursor.to_list(length=limit)
    
    return [serialize_doc(job) for job in job_data]
