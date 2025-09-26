import retell
from typing import Dict, Any, Optional
from app.core.config import settings

class RetellClient:
    def __init__(self):
        self.client = retell.Retell(api_key=settings.RETELL_API_KEY)

    async def create_phone_call(
        self,
        agent_id: str,
        to_number: str,
        from_number: str = None,  # Will be set based on account
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a phone call using Retell AI
        """
        try:
            # First, get available phone numbers
            if from_number is None:
                try:
                    phone_numbers = self.client.phone_number.list()
                    if phone_numbers:
                        from_number = phone_numbers[0].phone_number
                    else:
                        raise Exception("No phone numbers available in Retell account. Please add a phone number in the Retell dashboard.")
                except Exception as e:
                    raise Exception(f"Failed to get phone numbers: {str(e)}")
            
            call_request = {
                "override_agent_id": agent_id,  # Correct parameter name
                "to_number": to_number,
                "from_number": from_number,     # Required parameter
            }
            if metadata:
                call_request["metadata"] = metadata
                
            response = self.client.call.create_phone_call(**call_request)
            return response.model_dump()
        except Exception as e:
            raise Exception(f"Failed to create phone call: {str(e)}")

    async def create_web_call(
        self,
        agent_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a web call using Retell AI (no phone numbers needed!)
        """
        try:
            response = self.client.call.create_web_call(
                agent_id=agent_id,
                metadata=metadata or {}
            )
            return response.model_dump()
        except Exception as e:
            raise Exception(f"Failed to create web call: {str(e)}")

    async def get_call_details(self, call_id: str) -> Dict[str, Any]:
        """
        Get details of a specific call
        """
        try:
            response = self.client.call.retrieve(call_id=call_id)
            return response.model_dump()
        except Exception as e:
            raise Exception(f"Failed to get call details: {str(e)}")

    # REMOVED: No agent creation allowed - only configuration of existing agents

    async def update_agent(self, agent_id: str, agent_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing Retell AI agent configuration
        """
        try:
            response = self.client.agent.update(agent_id=agent_id, **agent_config)
            return response.model_dump()
        except Exception as e:
            raise Exception(f"Failed to update agent: {str(e)}")

    async def get_agent(self, agent_id: str) -> Dict[str, Any]:
        """
        Get a specific Retell AI agent configuration
        """
        try:
            response = self.client.agent.retrieve(agent_id=agent_id)
            return response.model_dump()
        except Exception as e:
            raise Exception(f"Failed to get agent: {str(e)}")
    
    async def list_agents(self) -> list:
        """
        List all agents to verify API connection
        """
        try:
            response = self.client.agent.list()
            # Response is already a list of agents, not a dict
            return [agent.model_dump() for agent in response]
        except Exception as e:
            raise Exception(f"Failed to list agents: {str(e)}")

# Global client instance
retell_client = RetellClient()