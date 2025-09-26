from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AgentConfigurationBase(BaseModel):
    prompt: str
    interruption_threshold: int
    enable_backchannel: bool
    enable_filler_words: Optional[bool] = False

class AgentConfigurationCreate(AgentConfigurationBase):
    pass

class AgentConfiguration(AgentConfigurationBase):
    id: str
    name: str  # Keep name for display but not editable
    scenario: str  # Keep scenario for internal use
    voice_id: str  # Keep voice_id for Retell integration
    language: str  # Keep language for Retell integration
    responsiveness: float  # Keep responsiveness for Retell integration
    retell_agent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
