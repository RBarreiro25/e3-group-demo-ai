from fastapi import APIRouter, HTTPException
from typing import List
from app.core.database import supabase
from app.models.call import Call, CallCreate, CallResult

router = APIRouter()

@router.get("/", response_model=List[Call])
async def get_calls():
    try:
        response = supabase.table("calls").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching calls: {str(e)}")

@router.post("/", response_model=Call)
async def create_call(call: CallCreate):
    try:
        response = supabase.table("calls").insert(call.model_dump()).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating call: {str(e)}")

@router.get("/{call_id}", response_model=Call)
async def get_call(call_id: str):
    try:
        response = supabase.table("calls").select("*").eq("id", call_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Call not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching call: {str(e)}")

@router.get("/{call_id}/results", response_model=List[CallResult])
async def get_call_results(call_id: str):
    try:
        response = supabase.table("call_results").select("*").eq("call_id", call_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching call results: {str(e)}")
