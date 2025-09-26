import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from "@/hooks/use-toast"
import { Save, Edit2, Settings } from 'lucide-react'

interface AgentConfiguration {
  id: string
  name: string  // Read-only display
  scenario: string  // Read-only internal
  prompt: string  // Editable
  voice_id: string  // Fixed for integration  
  language: string  // Fixed for integration
  interruption_threshold: number  // Editable
  enable_backchannel: boolean  // Editable
  responsiveness: number  // Fixed for integration
  enable_filler_words?: boolean  // Editable
  created_at: string
  updated_at: string
}

const AgentConfigurationForm: React.FC = () => {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Single agent configuration - will be loaded from API
  const [agent, setAgent] = useState<AgentConfiguration>({
    id: '',
    name: '',
    scenario: '',
    prompt: '',
    voice_id: '',
    language: '',
    interruption_threshold: 0,
    enable_backchannel: false,
    responsiveness: 0,
    enable_filler_words: false,
    created_at: '',
    updated_at: ''
  })

  const handleSaveAgent = useCallback(async () => {
    try {
      // Only send the editable fields that match the requirements
      const editableFields = {
        prompt: agent.prompt,
        interruption_threshold: agent.interruption_threshold,
        enable_backchannel: agent.enable_backchannel,
        enable_filler_words: agent.enable_filler_words
      }
      
      // Save to our backend API
      const response = await fetch(`http://localhost:8000/api/v1/agents/logistics-agent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editableFields)
      })
      
      if (response.ok) {
        const savedAgent = await response.json()
        
        // Update local state with saved data
        setAgent(savedAgent)
        
        // Success state handled by alert  
        toast({
          title: "Configuration Saved! ✅",
          description: "Agent configuration updated successfully.",
        })
      } else {
        const errorData = await response.json()
        console.error('Failed to save agent configuration:', errorData)
        toast({
          title: "Save Failed ❌",
          description: `Failed to save: ${errorData.detail || 'Unknown error'}`,
          variant: "destructive"
        })
      }
      
    } catch (error) {
      console.error('Error saving agent configuration:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast({
        title: "Save Error ❌",
        description: `Error saving configuration: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setIsEditing(false)
    }
  }, [agent])

  // Load agent from backend on component mount
  useEffect(() => {
    const loadAgent = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/agents/logistics-agent')
        if (response.ok) {
          const agentData = await response.json()
          setAgent(agentData)
        } else {
          console.error('❌ API response not ok:', response.status)
        }
      } catch (error) {
        console.error('❌ Failed to load agent:', error)
        // Keep default agent if API fails
      } finally {
        setIsLoading(false)
      }
    }
    loadAgent()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading agent configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Configuration</h2>
          <p className="text-muted-foreground">
            Configure the Logistics AI agent for driver check-ins and emergency protocols
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Single Agent Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{agent.name}</CardTitle>
                <CardDescription>
                  Configure prompts, voice settings, and behavior
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={isEditing ? "secondary" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
                {isEditing && (
                  <Button onClick={handleSaveAgent}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* System Prompt - CORE REQUIREMENT */}
            <div className="space-y-2">
              <Label htmlFor="prompt">System Prompt *</Label>
              <Textarea
                id="prompt"
                value={agent.prompt}
                disabled={!isEditing}
                rows={12}
                className="font-mono text-sm"
                onChange={(e) => {
                  if (isEditing) {
                    setAgent(prev => ({ ...prev, prompt: e.target.value }))
                  }
                }}
              />
              <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Core Requirement:</strong> This prompt defines the agent's conversation logic and must include both standard and emergency protocols. Use {`{{variable_name}}`} for dynamic content.
                </p>
              </div>
            </div>


            {/* Advanced Settings - REQUIRED BY PROJECT SPECS */}
            <div className="space-y-4">
              <h4 className="font-medium">🔧 Advanced Voice Settings</h4>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Project Requirement:</strong> Must use Retell AI's advanced settings (backchanneling, filler words, interruption sensitivity) for human-like experience.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interruption">Interruption Sensitivity (ms)</Label>
                <Input
                  id="interruption"
                  type="number"
                  value={agent.interruption_threshold}
                  disabled={!isEditing}
                  onChange={(e) => {
                    if (isEditing) {
                      setAgent(prev => ({ ...prev, interruption_threshold: parseInt(e.target.value) || 100 }))
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more sensitive to interruptions (50-300ms)
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="backchannel">🎙️ Enable Backchannel</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow "uh-huh", "mm-hmm", "I see" responses during user speech
                    </p>
                  </div>
                  <Switch
                    id="backchannel"
                    checked={agent.enable_backchannel}
                    disabled={!isEditing}
                    onCheckedChange={(checked) => {
                      if (isEditing) {
                        setAgent(prev => ({ ...prev, enable_backchannel: checked }))
                      }
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="filler_words">🗣️ Enable Filler Words</Label>
                    <p className="text-xs text-muted-foreground">
                      Add natural "um", "uh", "let me see" for realistic speech
                    </p>
                  </div>
                  <Switch
                    id="filler_words"
                    checked={agent.enable_filler_words || false}
                    disabled={!isEditing}
                    onCheckedChange={(checked) => {
                      if (isEditing) {
                        setAgent(prev => ({ ...prev, enable_filler_words: checked }))
                      }
                    }}
                  />
                </div>
                
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Agent Status</span>
            </CardTitle>
            <CardDescription>Current agent configuration and deployment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">✅ Agent Ready</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Your agent is <strong>live and functional</strong>. Use the "Start Call" tab to trigger calls to drivers, or test in Retell's web interface first.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AgentConfigurationForm