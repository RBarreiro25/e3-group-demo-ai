from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class AgentConfigurationBase(BaseModel):
    name: str
    scenario_type: str
    system_prompt: str
    conversation_flow: Dict[str, Any]
    retell_settings: Dict[str, Any]

class AgentConfigurationCreate(AgentConfigurationBase):
    pass

class AgentConfiguration(AgentConfigurationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
