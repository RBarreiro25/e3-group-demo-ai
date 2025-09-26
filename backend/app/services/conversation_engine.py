from typing import Dict, Any, List, Optional, Tuple
from enum import Enum
import re
from dataclasses import dataclass

class ConversationState(Enum):
    """Conversation states for tracking flow"""
    OPENING = "opening"
    GATHERING_STATUS = "gathering_status"
    LOCATION_UPDATE = "location_update"
    ETA_CONFIRMATION = "eta_confirmation"
    ISSUE_RESOLUTION = "issue_resolution"
    EMERGENCY_PROTOCOL = "emergency_protocol"
    CLOSING = "closing"
    ESCALATION = "escalation"

class DriverCooperationLevel(Enum):
    """Driver cooperation assessment"""
    COOPERATIVE = "cooperative"
    NEUTRAL = "neutral"
    UNCOOPERATIVE = "uncooperative"
    HOSTILE = "hostile"

@dataclass
class ConversationContext:
    """Context tracking for conversation state"""
    state: ConversationState
    driver_name: str
    load_number: str
    cooperation_level: DriverCooperationLevel
    information_gathered: Dict[str, Any]
    emergency_detected: bool
    retry_count: int
    unclear_responses: int

class ConversationEngine:
    """
    Intelligent conversation engine for dynamic response guidance
    Implements project requirements for:
    - Dynamic conversation pivoting based on driver responses
    - Emergency detection and protocol switching
    - Edge case handling (uncooperative, noisy, conflicting)
    """
    
    def __init__(self, agent_config: Dict[str, Any]):
        self.agent_config = agent_config
        self.scenario = agent_config.get("scenario", "driver_checkin")
        self.max_retries = 3
        self.max_unclear_responses = 2
        
        # Emergency trigger patterns
        self.emergency_patterns = {
            "accident": [
                r"\b(accident|crashed|collision|hit|rear.?end|side.?swipe)\b",
                r"\b(crash|wreck|smash)\b"
            ],
            "breakdown": [
                r"\b(broke.?down|broken.?down|engine|tire|blowout|mechanical)\b",
                r"\b(won't.?start|overheating|smoke|leak)\b"
            ],
            "medical": [
                r"\b(medical|emergency|hurt|injured|pain|sick|hospital|911|ambulance)\b",
                r"\b(chest.?pain|difficulty.?breathing|unconscious)\b"
            ],
            "general": [
                r"\b(emergency|help|urgent|serious.?problem|big.?problem|trouble)\b"
            ]
        }
        
        # Cooperation indicators
        self.cooperation_indicators = {
            "positive": [
                r"\b(sure|absolutely|of.?course|definitely|let.?me|i'm.?at|currently)\b",
                r"\b(everything.?is|going.?well|no.?problem|all.?good)\b"
            ],
            "neutral": [
                r"\b(okay|alright|yes|yeah|i.?guess|fine)\b"
            ],
            "negative": [
                r"\b(busy|can't.?talk|not.?now|whatever|don't.?know)\b",
                r"\b(leave.?me.?alone|stop.?calling|annoying)\b"
            ]
        }

    def analyze_user_input(self, user_input: str, context: ConversationContext) -> Tuple[ConversationContext, Dict[str, Any]]:
        """
        Analyze user input and update conversation context
        Returns updated context and response guidance
        """
        # Clean and normalize input
        normalized_input = user_input.lower().strip()
        
        # Check for emergency triggers first (highest priority)
        emergency_type = self._detect_emergency(normalized_input)
        if emergency_type:
            context.emergency_detected = True
            context.state = ConversationState.EMERGENCY_PROTOCOL
            return context, self._generate_emergency_response(emergency_type, context)
        
        # Assess cooperation level
        context.cooperation_level = self._assess_cooperation(normalized_input)
        
        # Check for unclear/garbled speech
        if self._is_unclear_response(user_input):
            context.unclear_responses += 1
            if context.unclear_responses >= self.max_unclear_responses:
                return context, self._handle_noisy_environment(context)
        
        # Extract information based on current state
        extracted_info = self._extract_information(normalized_input, context.state)
        context.information_gathered.update(extracted_info)
        
        # Determine next state and response
        next_state = self._determine_next_state(context, extracted_info)
        context.state = next_state
        
        response_guidance = self._generate_response_guidance(context, extracted_info)
        
        return context, response_guidance

    def _detect_emergency(self, user_input: str) -> Optional[str]:
        """Detect emergency triggers in user speech"""
        for emergency_type, patterns in self.emergency_patterns.items():
            for pattern in patterns:
                if re.search(pattern, user_input, re.IGNORECASE):
                    return emergency_type
        return None

    def _assess_cooperation(self, user_input: str) -> DriverCooperationLevel:
        """Assess driver cooperation level"""
        # Check for hostile/negative indicators first
        for pattern in self.cooperation_indicators["negative"]:
            if re.search(pattern, user_input, re.IGNORECASE):
                return DriverCooperationLevel.UNCOOPERATIVE
        
        # Check for positive indicators
        for pattern in self.cooperation_indicators["positive"]:
            if re.search(pattern, user_input, re.IGNORECASE):
                return DriverCooperationLevel.COOPERATIVE
        
        # Check for minimal/one-word responses
        if len(user_input.split()) <= 2:
            return DriverCooperationLevel.UNCOOPERATIVE
        
        return DriverCooperationLevel.NEUTRAL

    def _is_unclear_response(self, user_input: str) -> bool:
        """Detect unclear or garbled speech"""
        unclear_indicators = [
            len(user_input.strip()) < 3,
            "[inaudible]" in user_input.lower(),
            "[unclear]" in user_input.lower(),
            "..." in user_input and len(user_input) < 10,
            # Detect gibberish (lots of consonants without vowels)
            len(re.sub(r'[aeiou\s]', '', user_input.lower())) > len(user_input) * 0.7
        ]
        return any(unclear_indicators)

    def _extract_information(self, user_input: str, current_state: ConversationState) -> Dict[str, Any]:
        """Extract relevant information based on conversation state"""
        extracted = {}
        
        # Location patterns
        location_patterns = [
            r"(i-\d+|us-\d+|highway\s+\d+|route\s+\d+)",
            r"mile\s+marker\s+\d+",
            r"(\w+,\s+\w{2}|\w+\s+\w+,\s+\w{2})",  # City, State
            r"(dock\s+\d+|door\s+\d+|bay\s+\d+)"
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, user_input, re.IGNORECASE)
            if match:
                extracted["location"] = match.group()
                break
        
        # Status indicators
        status_keywords = {
            "arrived": ["arrived", "here", "at the", "made it"],
            "driving": ["driving", "on the road", "en route", "heading", "on my way"],
            "delayed": ["delayed", "running late", "behind", "stuck", "traffic"],
            "unloading": ["unloading", "unload", "dock", "backing up", "delivery"]
        }
        
        for status, keywords in status_keywords.items():
            if any(keyword in user_input for keyword in keywords):
                extracted["driver_status"] = status
                break
        
        # Time-related information
        time_patterns = [
            r"(\d{1,2}:\d{2})",  # Time format
            r"(\d+)\s+(minutes?|hours?)",  # Duration
            r"(tomorrow|today|tonight|morning|afternoon|evening)"
        ]
        
        for pattern in time_patterns:
            match = re.search(pattern, user_input, re.IGNORECASE)
            if match:
                extracted["timing_info"] = match.group()
                break
        
        return extracted

    def _determine_next_state(self, context: ConversationContext, extracted_info: Dict[str, Any]) -> ConversationState:
        """Determine next conversation state based on context and extracted info"""
        current_state = context.state
        
        # Handle uncooperative drivers
        if context.cooperation_level == DriverCooperationLevel.UNCOOPERATIVE:
            context.retry_count += 1
            if context.retry_count >= self.max_retries:
                return ConversationState.ESCALATION
        
        # State transitions for driver check-in scenario
        if self.scenario == "driver_checkin":
            if current_state == ConversationState.OPENING:
                return ConversationState.GATHERING_STATUS
            
            elif current_state == ConversationState.GATHERING_STATUS:
                if "driver_status" in extracted_info:
                    if extracted_info["driver_status"] in ["arrived", "unloading"]:
                        return ConversationState.CLOSING
                    else:
                        return ConversationState.LOCATION_UPDATE
                return ConversationState.GATHERING_STATUS  # Stay and retry
            
            elif current_state == ConversationState.LOCATION_UPDATE:
                if "location" in extracted_info:
                    return ConversationState.ETA_CONFIRMATION
                return ConversationState.LOCATION_UPDATE  # Stay and retry
            
            elif current_state == ConversationState.ETA_CONFIRMATION:
                if "timing_info" in extracted_info:
                    return ConversationState.CLOSING
                return ConversationState.ETA_CONFIRMATION  # Stay and retry
        
        return current_state

    def _generate_response_guidance(self, context: ConversationContext, extracted_info: Dict[str, Any]) -> Dict[str, Any]:
        """Generate response guidance based on context and state"""
        driver_name = context.driver_name
        load_number = context.load_number
        state = context.state
        
        if state == ConversationState.OPENING:
            return {
                "message": f"Hi {driver_name}, this is dispatch with a check call on load {load_number}. Can you give me an update on your status?",
                "state": "opening",
                "follow_ups": ["What's your current status?", "Where are you right now?"],
                "priority": "normal"
            }
        
        elif state == ConversationState.GATHERING_STATUS:
            if context.cooperation_level == DriverCooperationLevel.UNCOOPERATIVE:
                return {
                    "message": f"I understand you might be busy {driver_name}, but I need a quick status update on load {load_number}. Are you driving, arrived, or delayed?",
                    "state": "gathering_status_retry",
                    "follow_ups": ["Just need to know if you're driving or arrived"],
                    "priority": "high"
                }
            else:
                return {
                    "message": "Thank you. Can you tell me your current location and status?",
                    "state": "gathering_status",
                    "follow_ups": ["Where are you currently?", "Are you driving or have you arrived?"],
                    "priority": "normal"
                }
        
        elif state == ConversationState.LOCATION_UPDATE:
            return {
                "message": "What's your current location? Are you on the highway or at the destination?",
                "state": "location_update",
                "follow_ups": ["Which highway or mile marker?", "Are you at the pickup or delivery location?"],
                "priority": "normal"
            }
        
        elif state == ConversationState.ETA_CONFIRMATION:
            return {
                "message": "Great! What's your estimated time of arrival or completion?",
                "state": "eta_confirmation",
                "follow_ups": ["How much longer do you think?", "When should we expect completion?"],
                "priority": "normal"
            }
        
        elif state == ConversationState.CLOSING:
            return {
                "message": f"Perfect! Thanks for the update {driver_name}. Drive safely and call if you need anything.",
                "state": "closing",
                "follow_ups": [],
                "priority": "normal"
            }
        
        elif state == ConversationState.ESCALATION:
            return {
                "message": f"{driver_name}, I'm going to connect you with a human dispatcher who can better assist you. Please hold on.",
                "state": "escalation",
                "follow_ups": [],
                "priority": "high"
            }
        
        # Default fallback
        return {
            "message": "I understand. Can you provide more details about your current situation?",
            "state": "gathering_info",
            "follow_ups": ["What's your current status?"],
            "priority": "normal"
        }

    def _generate_emergency_response(self, emergency_type: str, context: ConversationContext) -> Dict[str, Any]:
        """Generate appropriate emergency response"""
        driver_name = context.driver_name
        
        emergency_responses = {
            "accident": f"I understand there's been an accident, {driver_name}. First, are you safe? Are you injured? Is anyone else involved?",
            "breakdown": f"I hear you're having vehicle trouble, {driver_name}. Are you safe? Are you in a safe location off the road?",
            "medical": f"This sounds like a medical emergency, {driver_name}. Are you conscious and able to speak? Do you need me to call 911?",
            "general": f"I understand this is an emergency situation, {driver_name}. First priority - are you safe? Tell me what's happening."
        }
        
        return {
            "message": emergency_responses.get(emergency_type, emergency_responses["general"]),
            "state": "emergency_protocol",
            "emergency_type": emergency_type,
            "follow_ups": [
                "Are you safe?",
                "What's your exact location?",
                "Do you need emergency services?"
            ],
            "priority": "CRITICAL"
        }

    def _handle_noisy_environment(self, context: ConversationContext) -> Dict[str, Any]:
        """Handle noisy environment with unclear speech"""
        driver_name = context.driver_name
        
        return {
            "message": f"I'm having trouble hearing you clearly, {driver_name}. There might be background noise. Can you speak louder or move to a quieter area? If this continues, I'll connect you with a human dispatcher.",
            "state": "noisy_environment",
            "follow_ups": ["Can you speak louder?", "Are you in a noisy area?"],
            "priority": "high"
        }

    def get_initial_context(self, driver_name: str, load_number: str) -> ConversationContext:
        """Initialize conversation context"""
        return ConversationContext(
            state=ConversationState.OPENING,
            driver_name=driver_name,
            load_number=load_number,
            cooperation_level=DriverCooperationLevel.NEUTRAL,
            information_gathered={},
            emergency_detected=False,
            retry_count=0,
            unclear_responses=0
        )

    def get_next_response(self, 
                         conversation_history: List[Dict[str, str]], 
                         last_user_input: str,
                         driver_name: str, 
                         load_number: str) -> Dict[str, Any]:
        """
        Main interface method for getting next response guidance
        Used by webhook for real-time conversation guidance
        """
        # Initialize or retrieve conversation context
        # In a real implementation, this would be stored in database/cache
        context = self.get_initial_context(driver_name, load_number)
        
        # If we have conversation history, determine current state
        if conversation_history:
            # Analyze the conversation flow to determine current state
            # This is a simplified version - in reality would be more sophisticated
            context.state = ConversationState.GATHERING_STATUS
        
        # Analyze the user input and get response guidance
        updated_context, response_guidance = self.analyze_user_input(last_user_input, context)
        
        return response_guidance
