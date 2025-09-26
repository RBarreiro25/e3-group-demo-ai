import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from "@/hooks/use-toast"
import { Phone, Play, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'

interface CallData {
  agent_configuration_id: string
  driver_name: string
  driver_phone: string
  load_number: string
  pickup_location?: string
  delivery_location?: string
  notes?: string
}

interface CallTriggerFormProps {
  onNavigateToTab?: (tab: string) => void
}

const CallTriggerForm: React.FC<CallTriggerFormProps> = ({ onNavigateToTab }) => {
  const { toast } = useToast()
  const [callData, setCallData] = useState<CallData>({
    agent_configuration_id: 'logistics-agent',
    driver_name: 'Raphael',
      driver_phone: '+18572405193',
    load_number: 'LD-2024-TEST01',
    pickup_location: 'Test Pickup Location',
    delivery_location: 'Test Delivery Location',
    notes: 'Testing with Twilio number'
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [lastCallResult, setLastCallResult] = useState<any>(null)
  
  // Show web testing mode info on component mount
  React.useEffect(() => {
    toast({
      title: "Web Testing Mode 🌐",
      description: "Calls will be created but won't trigger actual phone calls. Use Retell AI's web interface or Live Monitor to test.",
    })
  }, [toast])

  // Single agent - handles both scenarios dynamically

  const handleInputChange = useCallback((field: keyof CallData, value: string) => {
    setCallData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const formatPhoneNumber = (phone: string): string => {
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `+1${cleaned}`
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`
    }
    return phone
  }

  // Navigation handlers
  const handleViewRecentCalls = useCallback(() => {
    if (onNavigateToTab) {
      onNavigateToTab('calls')
    }
  }, [onNavigateToTab])

  const handleTriggerCall = useCallback(async () => {
    setIsLoading(true)
    try {
      // Format phone number
      const formattedPhone = formatPhoneNumber(callData.driver_phone)
      
      const payload = {
        ...callData,
        driver_phone: formattedPhone
      }

      
      // Create call record in database
      const response = await fetch('http://localhost:8000/api/v1/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const callRecord = await response.json()
      
      // Trigger Retell AI call via backend
      const triggerResponse = await fetch(`http://localhost:8000/api/v1/calls/trigger/${callRecord.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (triggerResponse.ok) {
        const triggerResult = await triggerResponse.json()
        setLastCallResult({
          ...callRecord,
          retell_call_id: triggerResult.retell_call_id || triggerResult.call_id,
          access_token: triggerResult.access_token,
          web_call_url: triggerResult.web_call_url,
          triggerResult: triggerResult, // Add full response for debugging
          message: 'Call created successfully! The AI agent will call the driver phone number you provided.'
        })
        toast({
          title: "Call Triggered Successfully! 📞",
          description: "The AI agent is now calling the driver's phone number. Check the 'Calls' tab to monitor the call status.",
        })
      } else {
        // Call record created but Retell trigger failed
        const errorData = await triggerResponse.json().catch(() => ({ detail: 'Unknown error' }))
        setLastCallResult({
          ...callRecord,
          warning: true,
          message: 'Call record created, but Retell AI trigger failed. Using web testing mode.'
        })
        toast({
          title: "Call Trigger Failed ⚠️",
          description: `Call record created, but couldn't trigger Retell AI: ${errorData.detail}`,
          variant: "destructive"
        })
      }
      
      // Reset form
      setCallData({
        agent_configuration_id: 'logistics-agent',
        driver_name: '',
        driver_phone: '',
        load_number: '',
        pickup_location: '',
        delivery_location: '',
        notes: ''
      })

    } catch (error) {
      console.error('Error triggering call:', error)
      setLastCallResult({
        error: true,
        message: 'Failed to trigger call. Please check your configuration.'
      })
      toast({
        title: "Call Failed ❌",
        description: `Failed to trigger call: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [callData])


  const isFormValid = callData.driver_name && callData.driver_phone && callData.load_number

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Start New Call</h2>
        <p className="text-muted-foreground">
          Trigger AI voice calls to drivers for check-ins and logistics coordination
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Call Configuration</span>
              </CardTitle>
              <CardDescription>
                Enter driver details and select the appropriate agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agent Selection */}

              {/* Driver Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driver-name">Driver Name *</Label>
                  <Input
                    id="driver-name"
                    placeholder="John Smith"
                    value={callData.driver_name}
                    onChange={(e) => handleInputChange('driver_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver-phone">Driver Phone *</Label>
                  <Input
                    id="driver-phone"
                    placeholder="+18572405193 (your Twilio number)"
                    value={callData.driver_phone}
                    onChange={(e) => handleInputChange('driver_phone', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    US phone number format required
                  </p>
                </div>
              </div>

              {/* Load Information */}
              <div className="space-y-2">
                <Label htmlFor="load-number">Load Number *</Label>
                <Input
                  id="load-number"
                  placeholder="LD-2024-001234"
                  value={callData.load_number}
                  onChange={(e) => handleInputChange('load_number', e.target.value)}
                />
              </div>

              {/* Location Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup-location">Pickup Location</Label>
                  <Input
                    id="pickup-location"
                    placeholder="123 Warehouse St, City, State"
                    value={callData.pickup_location}
                    onChange={(e) => handleInputChange('pickup_location', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-location">Delivery Location</Label>
                  <Input
                    id="delivery-location"
                    placeholder="456 Destination Ave, City, State"
                    value={callData.delivery_location}
                    onChange={(e) => handleInputChange('delivery_location', e.target.value)}
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Input
                  id="notes"
                  placeholder="Special instructions or context for the call"
                  value={callData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>


              {/* Trigger Button */}
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleTriggerCall}
                  disabled={!isFormValid || isLoading}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>{isLoading ? 'Creating Call...' : 'Start Call'}</span>
                </Button>
                
                {!isFormValid && (
                  <p className="text-sm text-muted-foreground">
                    Please fill in all required fields (*)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call Status & Info */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Call Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Phone Service</span>
                  <Badge variant="outline">Web Testing</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Retell AI</span>
                  <Badge variant="secondary">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge variant="secondary">Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Call Result */}
          {lastCallResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {lastCallResult.error ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  <span>Last Call Result</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lastCallResult.error ? (
                  <div className="text-red-600 text-sm">
                    {lastCallResult.message}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Call ID:</span> {lastCallResult.id}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Status:</span> 
                      <Badge variant="secondary" className="ml-2">
                        {lastCallResult.status || 'Created'}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Driver:</span> {lastCallResult.driver_name}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Load:</span> {lastCallResult.load_number}
                    </div>
                    {lastCallResult.access_token && (
                      <div className="mt-4 p-3 bg-green-50 rounded-md">
                        <div className="text-sm font-medium text-green-900 mb-2">
                          📞 Call Initiated Successfully!
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600">
                            Call ID: {lastCallResult.retell_call_id}
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <p className="text-sm mb-2">
                              <strong>What happens next:</strong>
                            </p>
                            <ol className="text-sm text-gray-700 space-y-1">
                              <li>1. 📞 The AI agent is calling <strong>{lastCallResult.driver_phone}</strong> right now</li>
                              <li>2. 📱 <strong>Answer your phone</strong> to have a conversation with the AI dispatcher</li>
                              <li>3. 🗣️ Talk naturally - ask about load status, location, delays, etc.</li>
                              <li>4. 📊 Call results will appear in the <strong>"Calls"</strong> tab when done</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    )}
                    {lastCallResult.message && (
                      <div className="mt-2 text-sm text-gray-600">
                        {lastCallResult.message}
                      </div>
                    )}
                    
                    {/* Results will appear automatically via real-time webhooks */}
                    {lastCallResult.id && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          ✨ <strong>Call analysis will appear automatically</strong> when the call completes.
                          <br />
                          Watch the Live Monitor for real-time updates!
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}


          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleViewRecentCalls}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Recent Calls
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CallTriggerForm
