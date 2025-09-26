#!/usr/bin/env python3

import asyncio
from app.services.retell_client import retell_client

async def verify_webhook():
    try:
        agent = await retell_client.get_agent('agent_ce5abb04803a0603d614332ec3')
        print('Current agent configuration:')
        print(f'Webhook URL: {agent.get("webhook_url", "NOT_SET")}')
        print(f'Response Engine Type: {agent.get("response_engine", {}).get("type", "NOT_SET")}')
        print(f'Agent Name: {agent.get("agent_name", "NOT_SET")}')
        
        if agent.get("webhook_url"):
            print('✅ Webhook is configured!')
        else:
            print('❌ Webhook is NOT configured!')
            
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(verify_webhook())
