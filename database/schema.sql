    -- AI Voice Agent Database Schema
    -- Run this in your Supabase SQL Editor

    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Agent configurations table
    CREATE TABLE agent_configurations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        scenario_type VARCHAR(50) NOT NULL CHECK (scenario_type IN ('driver_checkin', 'emergency_protocol')),
        system_prompt TEXT NOT NULL,
        conversation_flow JSONB NOT NULL,
        retell_settings JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Calls table
    CREATE TABLE calls (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        agent_configuration_id UUID REFERENCES agent_configurations(id) ON DELETE CASCADE,
        driver_name VARCHAR(255) NOT NULL,
        driver_phone VARCHAR(20) NOT NULL,
        load_number VARCHAR(100) NOT NULL,
        retell_call_id VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'in_progress', 'completed', 'failed')),
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        duration_seconds INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Call transcripts table
    CREATE TABLE call_transcripts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
        transcript_data JSONB NOT NULL,
        raw_transcript TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Call results table
    CREATE TABLE call_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
        call_outcome VARCHAR(100) NOT NULL,
        structured_data JSONB NOT NULL,
        confidence_score DECIMAL(3,2),
        processing_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Indexes for better performance
    CREATE INDEX idx_calls_agent_config ON calls(agent_configuration_id);
    CREATE INDEX idx_calls_status ON calls(status);
    CREATE INDEX idx_calls_created_at ON calls(created_at);
    CREATE INDEX idx_call_transcripts_call_id ON call_transcripts(call_id);
    CREATE INDEX idx_call_results_call_id ON call_results(call_id);

    -- Updated_at trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Apply updated_at trigger to agent_configurations
    CREATE TRIGGER update_agent_configurations_updated_at
        BEFORE UPDATE ON agent_configurations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Insert sample agent configurations
    INSERT INTO agent_configurations (name, scenario_type, system_prompt, conversation_flow, retell_settings) VALUES
    (
        'Driver Check-in Agent',
        'driver_checkin',
        'You are a professional dispatch agent calling drivers for routine check-ins about their loads. Be friendly, efficient, and gather all necessary information about their status, location, and any delays.',
        '{
            "initial_greeting": "Hi {driver_name}, this is Dispatch with a check call on load {load_number}. Can you give me an update on your status?",
            "follow_up_questions": [
                "What is your current location?",
                "What is your estimated time of arrival?",
                "Are you experiencing any delays?",
                "Have you received the POD reminder?"
            ],
            "emergency_triggers": ["emergency", "accident", "breakdown", "help", "medical"]
        }',
        '{
            "voice": "professional",
            "speed": 1.0,
            "enable_backchannel": true,
            "filler_words": true,
            "interruption_sensitivity": 0.7,
            "enable_responsiveness": true
        }'
    ),
    (
        'Emergency Protocol Agent',
        'emergency_protocol',
        'You are an emergency dispatch agent. When drivers report emergencies, immediately gather critical safety information and escalate to human dispatchers. Prioritize safety above all else.',
        '{
            "emergency_response": "I understand this is an emergency. First, are you and everyone else safe?",
            "safety_questions": [
                "Are there any injuries?",
                "What is your exact location?",
                "What type of emergency is this?",
                "Is your load secure?"
            ],
            "escalation_message": "I am connecting you to a human dispatcher right now. Please stay on the line."
        }',
        '{
            "voice": "calm",
            "speed": 0.9,
            "enable_backchannel": true,
            "filler_words": false,
            "interruption_sensitivity": 0.9,
            "enable_responsiveness": true
        }'
    );
