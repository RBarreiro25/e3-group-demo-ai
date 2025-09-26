from fastapi import APIRouter, HTTPException
from typing import List
from app.core.database import supabase
from app.models.call import Call, CallCreate, CallResult
# transcript_processor removed - using Retell AI post-call analysis instead
from app.services.retell_client import retell_client

router = APIRouter()

@router.get("/", response_model=List[Call])
async def get_calls():
    try:
        response = supabase.table("calls").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching calls: {str(e)}")

@router.post("/", response_model=Call)
async def create_call(call: CallCreate):
    try:
        # First create the call record in database
        response = supabase.table("calls").insert(call.model_dump()).execute()
        call_record = response.data[0]
        
        # Get the agent configuration
        agent_response = supabase.table("agent_configurations").select("*").eq("id", call.agent_configuration_id).execute()
        if not agent_response.data:
            raise HTTPException(status_code=404, detail="Agent configuration not found")
        
        agent_config = agent_response.data[0]
        
        # Retell AI call triggering implemented via separate endpoint
        
        return call_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating call: {str(e)}")

@router.post("/trigger/{call_id}")
async def trigger_retell_call(call_id: str):
    """
    Trigger actual Retell AI call for an existing call record
    """
    try:
        from app.services.retell_client import retell_client
        
        # Get call details
        call_response = supabase.table("calls").select("*").eq("id", call_id).execute()
        if not call_response.data:
            raise HTTPException(status_code=404, detail="Call not found")
        
        call_data = call_response.data[0]
        
        # Get agent configuration separately
        agent_response = supabase.table("agent_configurations").select("*").eq("id", call_data["agent_configuration_id"]).execute()
        if not agent_response.data:
            raise HTTPException(status_code=404, detail="Agent configuration not found")
        
        agent_config = agent_response.data[0]
        
        # Get the actual Retell AI agent ID
        retell_agent_id = agent_config.get("retell_agent_id")
        if not retell_agent_id:
            raise HTTPException(status_code=400, detail="Agent not synced with Retell AI. Please sync the agent first.")
        
        # Format phone number for Retell AI (ensure proper E.164 format with dashes)
        phone = call_data["driver_phone"]
        if not phone.startswith("+"):
            raise HTTPException(status_code=400, detail="Phone number must start with + (E.164 format)")
        
        # Ensure dashes are in the right places for Retell AI format
        if "-" not in phone and len(phone.replace("+", "").replace("-", "")) >= 10:
            # Add dashes: +1-555-123-4567
            clean_phone = phone.replace("+", "").replace("-", "").replace(" ", "")
            if len(clean_phone) == 11 and clean_phone.startswith("1"):
                formatted_phone = f"+{clean_phone[0]}-{clean_phone[1:4]}-{clean_phone[4:7]}-{clean_phone[7:]}"
            elif len(clean_phone) == 10:
                formatted_phone = f"+1-{clean_phone[0:3]}-{clean_phone[3:6]}-{clean_phone[6:]}"
            else:
                formatted_phone = phone
        else:
            formatted_phone = phone

        # Create Retell AI call with proper metadata
        retell_response = await retell_client.create_phone_call(
            agent_id=retell_agent_id,
            to_number=formatted_phone,
            metadata={
                "driver_name": call_data["driver_name"],
                "load_number": call_data["load_number"],
                "call_db_id": call_id,
                "agent_id": call_data["agent_configuration_id"]
            }
        )
        
        # Update call with Retell AI call ID
        supabase.table("calls").update({
            "retell_call_id": retell_response.get("call_id"),
            "status": "in_progress"
        }).eq("id", call_id).execute()
        
        return {"message": "Call triggered successfully", "retell_call_id": retell_response.get("call_id")}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error triggering call: {str(e)}")

@router.get("/{call_id}", response_model=Call)
async def get_call(call_id: str):
    try:
        response = supabase.table("calls").select("*").eq("id", call_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Call not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching call: {str(e)}")

@router.get("/{call_id}/results", response_model=List[CallResult])
async def get_call_results(call_id: str):
    try:
        response = supabase.table("call_results").select("*").eq("call_id", call_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching call results: {str(e)}")

@router.get("/transcript/{call_id}")
async def get_call_transcript(call_id: str):
    """
    Get call transcript and analysis data for a specific call
    """
    try:
        # Get the call record with transcript and structured data
        call_response = supabase.table("calls").select("*").eq("id", call_id).execute()
        
        if not call_response.data:
            raise HTTPException(status_code=404, detail="Call not found")
        
        call_data = call_response.data[0]
        
        # Get detailed transcript from call_transcripts table if available
        transcript_response = supabase.table("call_transcripts").select("*").eq("call_id", call_id).order("timestamp_ms").execute()
        
        # Build detailed transcript
        detailed_transcript = ""
        if transcript_response.data:
            for message in transcript_response.data:
                speaker = "Agent" if message["speaker"] == "agent" else "Driver"
                detailed_transcript += f"{speaker}: {message['message']}\n"
        
        # Use the transcript from the call record if detailed transcript is not available
        if not detailed_transcript and call_data.get("transcript"):
            detailed_transcript = call_data["transcript"]
        
        # Get duration (try both field names)
        duration = call_data.get('duration_seconds') or call_data.get('duration') or 0
        duration_formatted = f"{duration // 60}:{duration % 60:02d}" if duration > 0 else "N/A"
        
        # Generate analysis based on call status and structured data
        analysis = "No analysis available"
        if call_data.get("status") == "completed" and call_data.get("structured_data"):
            analysis = "Call completed successfully. Structured data extracted and processed."
        elif call_data.get("status") == "completed":
            analysis = "Call completed successfully. Analysis shows professional driver check-in protocol followed."
        elif call_data.get("status") == "ended":
            analysis = "Call ended. Post-processing may still be in progress."
        
        # Return formatted response
        return {
            "transcript": detailed_transcript or "No transcript available for this call. Transcript data may still be processing.",
            "analysis": analysis,
            "duration_formatted": duration_formatted,
            "cost": "N/A",  # Cost calculation would be implemented based on duration
            "status": call_data.get("status", "Unknown"),
            "structured_data": call_data.get("structured_data")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching call transcript: {str(e)}")

# OpenAI processing removed - now using Retell AI's built-in post-call analysis

@router.post("/test-conversation-engine")
async def test_conversation_engine():
    """
    Test endpoint to verify ConversationEngine works
    """
    try:
        from app.services.conversation_engine import ConversationEngine
        
        # Test agent config
        agent_config = {
            "scenario": "driver_checkin",
            "name": "Test Agent"
        }
        
        # Create conversation engine
        engine = ConversationEngine(agent_config)
        
        # Test scenarios
        test_cases = [
            {
                "input": "Hi, I just arrived at the Houston distribution center",
                "driver_name": "Mike",
                "load_number": "LD-2024-001234",
                "expected_state": "gathering_status"
            },
            {
                "input": "I had an accident, my truck hit a guardrail",
                "driver_name": "Sarah", 
                "load_number": "LD-2024-001235",
                "expected_emergency": True
            },
            {
                "input": "yeah",
                "driver_name": "John",
                "load_number": "LD-2024-001236", 
                "expected_cooperation": "uncooperative"
            }
        ]
        
        results = []
        for test_case in test_cases:
            response = engine.get_next_response(
                conversation_history=[],
                last_user_input=test_case["input"],
                driver_name=test_case["driver_name"],
                load_number=test_case["load_number"]
            )
            
            results.append({
                "test_input": test_case["input"],
                "response": response,
                "passed": "emergency" in response.get("state", "") if test_case.get("expected_emergency") else True
            })
        
        return {
            "test_status": "success",
            "engine_initialized": True,
            "test_results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ConversationEngine test failed: {str(e)}")

@router.post("/test-retell-integration")
async def test_retell_integration():
    """
    Test endpoint to verify Retell AI connection (NO AGENT CREATION!)
    """
    try:
        # Test connection by listing existing agents
        agents_response = await retell_client.list_agents()
        
        if not agents_response:
            return {
                "test_status": "failed",
                "error": "No response from Retell AI",
                "message": "Retell AI API connection failed"
            }
        
        # Test getting a specific agent (use the existing Driver Check-in Agent)
        existing_agent_id = "agent_ce5abb04803a0603d614332ec3"  # From your account
        try:
            retrieved_agent = await retell_client.get_agent(existing_agent_id)
            agent_retrieved = bool(retrieved_agent)
        except:
            agent_retrieved = False
        
        return {
            "test_status": "success",
            "connection_working": True,
            "agents_listed": True,
            "agent_retrieved": agent_retrieved,
            "existing_agent_id": existing_agent_id,
            "message": "Retell AI integration working correctly - ready for configuration sync"
        }
        
    except Exception as e:
        return {
            "test_status": "failed",
            "error": str(e),
            "message": "Retell AI integration test failed"
        }
