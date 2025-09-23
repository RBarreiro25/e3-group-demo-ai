from fastapi import APIRouter, HTTPException
from typing import List
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

@router.post("/", response_model=AgentConfiguration)
async def create_agent(agent: AgentConfigurationCreate):
    try:
        response = supabase.table("agent_configurations").insert(agent.model_dump()).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating agent: {str(e)}")

@router.get("/{agent_id}", response_model=AgentConfiguration)
async def get_agent(agent_id: str):
    try:
        response = supabase.table("agent_configurations").select("*").eq("id", agent_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Agent not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching agent: {str(e)}")
