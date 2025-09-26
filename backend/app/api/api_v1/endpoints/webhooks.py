from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any, List
import json
import re
from app.core.database import supabase
from app.services.conversation_engine import ConversationEngine
from app.api.api_v1.endpoints.monitor import broadcast_webhook_event

router = APIRouter()

@router.post("/retell")
async def retell_webhook(request: Request):
    """
    ENHANCED webhook with intelligent conversation guidance
    Responds to Retell AI events and provides dynamic conversation logic
    """
    try:
        # Get the raw request body
        body = await request.body()
        data = json.loads(body)
        
        event_type = data.get("event")
        call_id = data.get("call_id")
        
        # Debug: Print event info
        print(f"EVENT DEBUG:")
        print(f"   Event type: {event_type}")
        print(f"   Call ID: {call_id}")
        print(f"   Available keys: {list(data.keys())}")
        
        possible_call_ids = [
            data.get("call_id"),
            data.get("call", {}).get("call_id") if isinstance(data.get("call"), dict) else None,
            data.get("call") if isinstance(data.get("call"), str) else None
        ]
        
        
        # Broadcast event to live monitor
        await broadcast_webhook_event({
            "event_type": event_type,
            "call_id": call_id,
            "raw_data": data
        })
        
        if event_type == "call_started":
            # Initialize conversation context
            result = await handle_call_start(data)
            await broadcast_webhook_event({
                "event_type": "call_initialized",
                "call_id": call_id,
                "result": result
            })
            return result
            
        elif event_type == "call_ended":
            # Process the complete call - pass the call object, not the root data
            call_object = data.get("call", {})
            result = await handle_call_completion(call_object)
            
            # Broadcast call completion with full results to frontend
            await broadcast_webhook_event({
                "event_type": "call_completed",
                "call_id": call_object.get("call_id"),
                "call_data": result
            })
            return result
            
        elif event_type == "agent_response_required":
            # CRITICAL: Provide dynamic conversation guidance
            result = await handle_conversation_guidance(data)
            await broadcast_webhook_event({
                "event_type": "agent_response",
                "call_id": call_id,
                "user_input": data.get("last_user_input"),
                "agent_response": result.get("response"),
                "conversation_state": result.get("conversation_state"),
                "emergency_check": result.get("emergency_check", False)
            })
            return result
            
        elif event_type == "user_speech":
            # Analyze user speech for emergency triggers
            result = await analyze_user_speech(data)
            await broadcast_webhook_event({
                "event_type": "user_speech",
                "call_id": call_id,
                "speech": data.get("transcript"),
                "result": result
            })
            return result
            
        elif event_type == "call_analyzed":
            # Handle post-call analysis from Retell AI
            call_object = data.get("call", {})
            result = await handle_call_analysis(call_object)
            await broadcast_webhook_event({
                "event_type": "call_analyzed",
                "call_id": call_object.get("call_id"),
                "analysis_data": result
            })
            return result
            
        return {"status": "success"}
        
    except Exception as e:
        await broadcast_webhook_event({
            "event_type": "webhook_error",
            "call_id": data.get("call_id") if 'data' in locals() else "unknown",
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=f"Webhook error: {str(e)}")

async def handle_call_completion(call_data: Dict[str, Any]):
    """
    Process completed call data and extract structured information
    Based on Retell AI webhook documentation structure
    """
    # Extract data from the correct fields according to Retell AI docs
    call_id = call_data.get("call_id")
    transcript = call_data.get("transcript", "")
    
    # Calculate duration from timestamps (in milliseconds)
    start_time = call_data.get("start_timestamp", 0)
    end_time = call_data.get("end_timestamp", 0)
    duration_ms = end_time - start_time if end_time > start_time else 0
    duration_seconds = duration_ms // 1000
    
    # Extract dynamic variables (driver info)
    dynamic_vars = call_data.get("retell_llm_dynamic_variables", {})
    driver_name = dynamic_vars.get("driver_name", "Web Test Driver")
    load_number = dynamic_vars.get("load_number", f"WEB-{call_id[:8] if call_id else 'TEST'}")
    
    print(f"CALL COMPLETION DATA:")
    print(f"   Call ID: {call_id}")
    print(f"   Duration: {duration_seconds}s")
    print(f"   Transcript length: {len(transcript)} chars")
    print(f"   Driver: {driver_name}")
    print(f"   Load: {load_number}")
    
    # Prepare result data for frontend
    result_data = {
        "call_id": call_id,
        "transcript": transcript,
        "duration": duration_seconds,
        "retell_analysis": {},  # Retell AI may not provide structured analysis by default
        "status": "completed",
        "driver_name": driver_name,
        "load_number": load_number
    }
    
    # Update call record - try metadata first, then retell_call_id lookup
    call_db_id = call_data.get("metadata", {}).get("call_db_id")
    
    if not call_db_id and call_id:
        # Try to find call by retell_call_id if metadata is missing
        try:
            call_response = supabase.table("calls").select("id").eq("retell_call_id", call_id).execute()
            if call_response.data:
                call_db_id = call_response.data[0]["id"]
                print(f"Found call by retell_call_id: {call_db_id}")
        except Exception as e:
            print(f"Error looking up call by retell_call_id: {e}")
    
    if call_db_id:
        # Update call status
        supabase.table("calls").update({
            "status": "completed",
            "completed_at": "now()",
            "duration_seconds": duration
        }).eq("id", call_db_id).execute()
        print(f"Updated call {call_db_id} to completed status")
        
        # Save transcript
        supabase.table("call_transcripts").insert({
            "call_id": call_db_id,
            "transcript_data": call_data,
            "raw_transcript": transcript
        }).execute()
        
        # Extract structured data from Retell AI's post-call analysis
        retell_analysis = call_data.get("post_call_analysis", {})
        print(f"Retell AI post-call analysis data: {retell_analysis}")
        
        if retell_analysis:
            # Save structured results from Retell AI
            supabase.table("call_results").insert({
                "call_id": call_db_id,
                "call_outcome": retell_analysis.get("call_outcome", "Unknown"),
                "structured_data": retell_analysis,
                "confidence_score": 1.0  # Retell AI analysis is highly reliable
            }).execute()
            print(f"Saved Retell AI structured data for call {call_db_id}: {list(retell_analysis.keys())}")
        else:
            print(f"No post-call analysis data received from Retell AI")
        
        # Update result data with database call ID
        result_data["database_call_id"] = call_db_id
    else:
        # Create a call record for external calls (triggered outside our system)
        if call_id and call_id != "None":
            try:
                # Extract driver name and load number from retell dynamic variables
                retell_vars = call_data.get("retell_llm_dynamic_variables", {})
                driver_name = retell_vars.get("driver_name", "Test Driver")
                load_number = retell_vars.get("load_number", f"WEB-{call_id[:8]}")
                
                # Create new call record
                new_call = supabase.table("calls").insert({
                    "agent_configuration_id": "logistics-agent",
                    "driver_name": driver_name,
                    "driver_phone": "+1-555-000-0000",  # Placeholder
                    "load_number": load_number,
                    "status": "completed",
                    "retell_call_id": call_id,
                    "duration_seconds": duration,
                    "completed_at": "now()"
                }).execute()
                
                if new_call.data:
                    call_db_id = new_call.data[0]["id"]
                    print(f"Created new call record for external call: {call_db_id}")
                    
                    # Save transcript
                    supabase.table("call_transcripts").insert({
                        "call_id": call_db_id,
                        "transcript_data": call_data,
                        "raw_transcript": transcript
                    }).execute()
                    
                    # Save structured data if available
                    retell_analysis = call_data.get("post_call_analysis", {})
                    if retell_analysis:
                        supabase.table("call_results").insert({
                            "call_id": call_db_id,
                            "call_outcome": retell_analysis.get("call_outcome", "Unknown"),
                            "structured_data": retell_analysis,
                            "confidence_score": 1.0
                        }).execute()
                        print(f"Saved structured data for external call: {call_db_id}")
                    
                    # Update result data with database call ID
                    result_data["database_call_id"] = call_db_id
                    result_data["driver_name"] = driver_name
                    result_data["load_number"] = load_number
                        
            except Exception as e:
                print(f"Error creating call record for external call: {e}")
        else:
            print(f"No valid call_id received: {call_id}")
    
    return result_data

async def handle_call_analysis(call_data: Dict[str, Any]):
    """
    Process call analysis data from Retell AI call_analyzed event
    """
    call_id = call_data.get("call_id")
    # Try different possible field names for analysis data
    call_analysis = (call_data.get("call_analysis") or 
                    call_data.get("custom_analysis_data") or 
                    {})
    
    print(f"CALL ANALYSIS RECEIVED:")
    print(f"   Call ID: {call_id}")
    print(f"   Analysis keys: {list(call_analysis.keys())}")
    print(f"   Full analysis data: {json.dumps(call_analysis, indent=2)}")
    print(f"   All call data keys: {list(call_data.keys())}")
    
    # Update the call record with analysis data
    if call_id:
        try:
            # Find the call by retell_call_id
            call_response = supabase.table("calls").select("id").eq("retell_call_id", call_id).execute()
            if call_response.data:
                call_db_id = call_response.data[0]["id"]
                
                # Update the call with analysis data
                supabase.table("calls").update({
                    "structured_data": call_analysis
                }).eq("id", call_db_id).execute()
                
                print(f"Updated call {call_db_id} with analysis data")
                
                return {
                    "call_id": call_id,
                    "database_call_id": call_db_id,
                    "analysis": call_analysis,
                    "status": "analysis_complete"
                }
        except Exception as e:
            print(f"Error updating call with analysis: {e}")
    
    return {
        "call_id": call_id,
        "analysis": call_analysis,
        "status": "analysis_received"
    }

async def handle_call_start(call_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Initialize conversation when call starts
    """
    call_id = call_data.get("call_id")
    metadata = call_data.get("metadata", {})
    
    print(f"Call start debug - call_id: {call_id}, metadata: {metadata}")
    
    # Only update database if we have a valid call_db_id
    call_db_id = metadata.get("call_db_id")
    if call_db_id and call_db_id != "None":
        try:
            supabase.table("calls").update({
                "status": "in_progress",
                "retell_call_id": call_id
            }).eq("id", call_db_id).execute()
            print(f"Updated call {call_db_id} status to in_progress")
        except Exception as e:
            print(f"Failed to update call status: {e}")
    else:
        print(f"No valid call_db_id in metadata, skipping database update")
    
    # Get agent configuration (use default if no agent_id)
    agent_id = metadata.get("agent_id", "logistics-agent")
    agent_config = await get_agent_configuration(agent_id)
    
    # Initialize conversation engine
    conversation_engine = ConversationEngine(agent_config)
    
    return {
        "status": "success", 
        "message": "Call initialized with conversation guidance"
    }

async def handle_conversation_guidance(call_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    CRITICAL: Provide real-time conversation guidance to agent
    This is where the magic happens - dynamic conversation flow!
    """
    call_id = call_data.get("call_id")
    conversation_history = call_data.get("conversation", [])
    last_user_input = call_data.get("last_user_input", "")
    metadata = call_data.get("metadata", {})
    
    # Check for emergency triggers
    emergency_detected = detect_emergency_triggers(last_user_input)
    
    if emergency_detected:
        return await switch_to_emergency_protocol(call_data, emergency_detected)
    
    # Get agent configuration
    agent_config = await get_agent_configuration(metadata.get("agent_id"))
    conversation_engine = ConversationEngine(agent_config)
    
    # Analyze conversation context and determine next response
    response_guidance = conversation_engine.get_next_response(
        conversation_history=conversation_history,
        last_user_input=last_user_input,
        driver_name=metadata.get("driver_name"),
        load_number=metadata.get("load_number")
    )
    
    return {
        "response": response_guidance["message"],
        "conversation_state": response_guidance["state"],
        "follow_up_questions": response_guidance.get("follow_ups", []),
        "emergency_check": False
    }

async def switch_to_emergency_protocol(call_data: Dict[str, Any], emergency_type: str) -> Dict[str, Any]:
    """
    CRITICAL FEATURE: Immediately abandon standard conversation for emergency
    """
    emergency_responses = {
        "breakdown": "I understand you're having vehicle trouble. First, are you safe? Are you in a safe location off the road?",
        "accident": "I need to make sure everyone is safe. Are you injured? Is anyone else involved injured?",
        "medical": "This is an emergency situation. Are you conscious and able to speak? Do you need me to call 911?",
        "general": "I hear this is an emergency. First priority - are you safe? Tell me what's happening."
    }
    
    response = emergency_responses.get(emergency_type, emergency_responses["general"])
    
    # Log emergency trigger
    call_id = call_data.get("metadata", {}).get("call_db_id")
    if call_id:
        supabase.table("calls").update({
            "status": "emergency",
            "emergency_triggered": True,
            "emergency_type": emergency_type
        }).eq("id", call_id).execute()
    
    return {
        "response": response,
        "conversation_state": "EMERGENCY_PROTOCOL",
        "priority": "HIGH",
        "emergency_type": emergency_type,
        "next_steps": ["gather_safety_info", "get_location", "escalate_to_human"]
    }

def detect_emergency_triggers(user_input: str) -> str:
    """
    Detect emergency trigger phrases in user speech
    """
    user_input_lower = user_input.lower()
    
    # Emergency trigger patterns
    triggers = {
        "breakdown": ["broke down", "broken down", "engine", "tire", "blowout", "mechanical", "won't start"],
        "accident": ["accident", "crashed", "collision", "hit", "rear ended", "side swiped"],
        "medical": ["medical", "emergency", "hurt", "injured", "pain", "ambulance", "hospital", "911"],
        "general": ["emergency", "help", "urgent", "serious problem", "big problem"]
    }
    
    for emergency_type, phrases in triggers.items():
        for phrase in phrases:
            if phrase in user_input_lower:
                return emergency_type
    
    return None

async def analyze_user_speech(call_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze user speech for conversation cues and emergency detection
    """
    user_speech = call_data.get("user_speech", "")
    
    # Check for emergency
    emergency = detect_emergency_triggers(user_speech)
    if emergency:
        return {"emergency_detected": True, "emergency_type": emergency}
    
    # Analyze speech quality and cooperation level
    analysis = {
        "speech_clarity": analyze_speech_clarity(user_speech),
        "cooperation_level": analyze_cooperation(user_speech),
        "information_provided": extract_key_information(user_speech)
    }
    
    return {"speech_analysis": analysis, "emergency_detected": False}

def analyze_speech_clarity(speech: str) -> str:
    """
    Determine if speech is clear or garbled (noisy environment)
    """
    if len(speech.strip()) < 3:
        return "very_poor"
    elif "[inaudible]" in speech or "[unclear]" in speech:
        return "poor"
    elif len(speech.split()) < 3:
        return "limited"
    else:
        return "good"

def analyze_cooperation(speech: str) -> str:
    """
    Determine driver cooperation level
    """
    speech_lower = speech.lower().strip()
    
    uncooperative_indicators = ["yeah", "no", "fine", "whatever", "busy", "can't talk"]
    cooperative_indicators = ["sure", "absolutely", "of course", "let me", "i'm at", "currently"]
    
    if any(indicator in speech_lower for indicator in uncooperative_indicators) and len(speech.split()) <= 2:
        return "uncooperative"
    elif any(indicator in speech_lower for indicator in cooperative_indicators):
        return "cooperative"
    else:
        return "neutral"

def extract_key_information(speech: str) -> Dict[str, Any]:
    """
    Extract location, status, and other key information from speech
    """
    info = {}
    
    # Location patterns
    location_patterns = [
        r"(I-\d+|US-\d+|Highway \d+|Route \d+)",
        r"mile marker \d+",
        r"(\w+, \w{2}|\w+ \w+, \w{2})"
    ]
    
    for pattern in location_patterns:
        match = re.search(pattern, speech, re.IGNORECASE)
        if match:
            info["location_mentioned"] = match.group()
            break
    
    # Status indicators
    status_indicators = {
        "arrived": ["arrived", "here", "at the", "dock"],
        "driving": ["driving", "on the road", "en route", "heading"],
        "delayed": ["delayed", "running late", "behind", "traffic"],
        "unloading": ["unloading", "dock", "backing up", "delivery"]
    }
    
    for status, indicators in status_indicators.items():
        if any(indicator in speech.lower() for indicator in indicators):
            info["status_indicated"] = status
            break
    
    return info

async def get_agent_configuration(agent_id: str) -> Dict[str, Any]:
    """
    Get agent configuration from database
    """
    try:
        response = supabase.table("agent_configurations").select("*").eq("id", agent_id).execute()
        if response.data:
            return response.data[0]
    except Exception as e:
        print(f"Error getting agent config: {e}")
    
    # Return default configuration
    return {
        "id": "default",
        "name": "Default Agent",
        "prompt": "You are a helpful dispatch agent.",
        "scenario": "driver_checkin"
    }

@router.post("/test")
async def test_webhook():
    """
    Test endpoint to verify webhook is working
    """
    return {"message": "Enhanced webhook is working", "status": "success", "features": ["emergency_detection", "conversation_guidance", "dynamic_responses"]}
