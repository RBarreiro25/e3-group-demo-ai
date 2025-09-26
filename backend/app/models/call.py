from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class CallBase(BaseModel):
    driver_name: str
    driver_phone: str
    load_number: str
    agent_configuration_id: str

class CallCreate(CallBase):
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None
    notes: Optional[str] = None

class Call(CallBase):
    id: str
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None
    notes: Optional[str] = None
    status: str = "pending"
    retell_call_id: Optional[str] = None
    duration: Optional[int] = None
    transcript: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    emergency_triggered: Optional[bool] = False
    emergency_type: Optional[str] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CallResultBase(BaseModel):
    call_id: str
    call_outcome: str
    structured_data: Dict[str, Any]
    confidence_score: Optional[float] = None
    processing_notes: Optional[str] = None

class CallResult(CallResultBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
