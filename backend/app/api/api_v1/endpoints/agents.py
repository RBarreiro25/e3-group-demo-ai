from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.core.database import supabase
from app.models.agent import AgentConfiguration, AgentConfigurationCreate

router = APIRouter()

@router.get("/", response_model=List[AgentConfiguration])
async def get_agents():
    try:
        response = supabase.table("agent_configurations").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching agents: {str(e)}")

# REMOVED: Agent creation not required by project specs
# Focus only on configuring the 2 pre-defined agents

@router.put("/{agent_id}", response_model=AgentConfiguration)
async def update_agent(agent_id: str, agent: AgentConfigurationCreate):
    try:
        # Update only our database - webhook will read from here during conversations
        agent_data = agent.model_dump()
        
        response = supabase.table("agent_configurations").update(agent_data).eq("id", agent_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating agent: {str(e)}")

@router.get("/{agent_id}", response_model=AgentConfiguration)
async def get_agent(agent_id: str):
    try:
        response = supabase.table("agent_configurations").select("*").eq("id", agent_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Agent not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching agent: {str(e)}")


# Manual sync endpoint removed - auto-sync happens during PUT /agents/{agent_id}
