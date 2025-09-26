from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
from datetime import datetime

router = APIRouter()

# Store active WebSocket connections
active_connections: List[WebSocket] = []

async def connect_websocket(websocket: WebSocket):
    """Connect a new WebSocket client"""
    await websocket.accept()
    active_connections.append(websocket)

def disconnect_websocket(websocket: WebSocket):
    """Disconnect a WebSocket client"""
    if websocket in active_connections:
        active_connections.remove(websocket)

async def broadcast_webhook_event(event_data: Dict):
    """Broadcast webhook event to all connected clients"""
    if not active_connections:
        return
        
    message = {
        "timestamp": datetime.now().isoformat(),
        "type": "webhook_event",
        "data": event_data
    }
    
    # Send to all connected clients
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_text(json.dumps(message))
        except:
            disconnected.append(connection)
    
    # Remove disconnected clients
    for connection in disconnected:
        disconnect_websocket(connection)

@router.websocket("/conversation")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time conversation monitoring"""
    await connect_websocket(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        disconnect_websocket(websocket)

@router.get("/status")
async def monitor_status():
    """Get monitor status"""
    return {
        "active_connections": len(active_connections),
        "status": "running"
    }
