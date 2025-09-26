import asyncio
from app.services.retell_client import retell_client

async def update_agent_webhook(webhook_url):
    """Update the agent to use webhook for responses"""
    try:
        # Update agent configuration  
        agent_config = {
            "response_engine": {
                "type": "custom-llm",
                "llm_websocket_url": webhook_url
            }
        }
        
        result = await retell_client.update_agent(
            "agent_ce5abb04803a0603d614332ec3", 
            agent_config
        )
        
        print(f"✅ Updated agent webhook to: {webhook_url}")
        print(f"Response engine: {result.get('response_engine', {})}")
        return result
        
    except Exception as e:
        print(f"❌ Error updating agent: {e}")
        return None

if __name__ == "__main__":
    # Your current ngrok URL
    webhook_url = " https://7227ab8cb32e.ngrok-free.app/api/v1/webhooks/retell"
    
    print(f"🔄 Updating webhook to: {webhook_url}")
    asyncio.run(update_agent_webhook(webhook_url))
