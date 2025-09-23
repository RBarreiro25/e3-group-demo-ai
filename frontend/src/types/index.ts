export interface AgentConfiguration {
  id: string
  name: string
  scenario_type: 'driver_checkin' | 'emergency_protocol'
  system_prompt: string
  conversation_flow: Record<string, any>
  retell_settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Call {
  id: string
  agent_configuration_id: string
  driver_name: string
  driver_phone: string
  load_number: string
  retell_call_id?: string
  status: 'initiated' | 'in_progress' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  duration_seconds?: number
  created_at: string
}

export interface CallResult {
  id: string
  call_id: string
  call_outcome: string
  structured_data: Record<string, any>
  confidence_score?: number
  processing_notes?: string
  created_at: string
}
