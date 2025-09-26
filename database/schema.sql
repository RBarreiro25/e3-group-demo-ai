CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS call_results CASCADE;
DROP TABLE IF EXISTS call_transcripts CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS agent_configurations CASCADE;

CREATE TABLE agent_configurations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    scenario VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    voice_id VARCHAR(50) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en-US',
    interruption_threshold INTEGER NOT NULL DEFAULT 7,
    enable_backchannel BOOLEAN NOT NULL DEFAULT TRUE,
    responsiveness DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    enable_filler_words BOOLEAN DEFAULT FALSE,
    ambient_sound_suppression VARCHAR(20) DEFAULT 'medium',
    retell_agent_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_configuration_id VARCHAR(50) REFERENCES agent_configurations(id),
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(20) NOT NULL,
    load_number VARCHAR(50) NOT NULL,
    pickup_location VARCHAR(200),
    delivery_location VARCHAR(200),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    retell_call_id VARCHAR(100),
    duration INTEGER,
    transcript TEXT,
    structured_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE call_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    speaker VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    timestamp_ms BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE call_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    call_outcome VARCHAR(100) NOT NULL,
    structured_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    processing_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_calls_agent_config ON calls(agent_configuration_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_created_at ON calls(created_at);
CREATE INDEX idx_call_transcripts_call_id ON call_transcripts(call_id);
CREATE INDEX idx_call_results_call_id ON call_results(call_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_configurations_updated_at
    BEFORE UPDATE ON agent_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

INSERT INTO agent_configurations (
    id, 
    name, 
    scenario, 
    prompt, 
    voice_id, 
    language, 
    interruption_threshold, 
    enable_backchannel, 
    responsiveness, 
    enable_filler_words, 
    ambient_sound_suppression,
    retell_agent_id
) VALUES 
(
    'logistics-agent',
    'Logistics AI Agent',
    'logistics',
    'You are a professional dispatch agent calling drivers for routine check-ins about their loads. Be friendly, efficient, and gather all necessary information about their status, location, and any delays.

Key Information to Gather:
- Driver name: {{driver_name}}
- Load number: {{load_number}}
- Current location and status
- Estimated time of arrival (ETA)
- Any delays or issues
- POD (Proof of Delivery) reminder acknowledgment

Conversation Flow:
1. Greet the driver professionally
2. Ask for status update on their current location
3. Get ETA for delivery
4. Check for any delays or issues
5. Remind about POD requirements
6. Thank them and end the call

Emergency Detection: If the driver mentions any emergency keywords (accident, breakdown, medical, help, emergency), immediately switch to emergency protocol and escalate to human dispatch.',
    'elevenlabs-adriel',
    'en-US',
    7,
    TRUE,
    1.0,
    TRUE,
    'medium',
    'agent_ce5abb04803a0603d614332ec3'
);
