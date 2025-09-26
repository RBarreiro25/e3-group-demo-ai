from fastapi import APIRouter
from app.api.api_v1.endpoints import agents, calls, health, webhooks, monitor, twiml

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(calls.router, prefix="/calls", tags=["calls"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(monitor.router, prefix="/monitor", tags=["monitor"])
api_router.include_router(twiml.router, prefix="/twiml", tags=["twiml"])
