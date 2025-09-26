import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useToast } from "@/hooks/use-toast"
import { 
  Activity, 
  Phone, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Wifi,
  WifiOff,
  ExternalLink 
} from 'lucide-react'

interface WebhookEvent {
  timestamp: string
  type: string
  data: {
    event_type: string
    call_id?: string
    user_input?: string
    agent_response?: string
    conversation_state?: string
    emergency_check?: boolean
    error?: string
    call_data?: {
      call_id: string
      transcript: string
      duration: number
      retell_analysis: any
      status: string
      database_call_id?: string
      driver_name?: string
      load_number?: string
    }
    analysis_data?: {
      call_id: string
      database_call_id?: string
      analysis: any
      status: string
    }
  }
}

interface LiveConversationMonitorProps {
  onCallCompleted?: (callData: any) => void
  onCallStarted?: (callId: string) => void
}

const LiveConversationMonitor: React.FC<LiveConversationMonitorProps> = ({ onCallCompleted, onCallStarted }) => {
  const { toast } = useToast()
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [currentCall, setCurrentCall] = useState<string | null>(null)
  const [conversationFlow, setConversationFlow] = useState<{ user: string; agent: string; timestamp: string }[]>([])
  const [completedCallData, setCompletedCallData] = useState<any>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const connectWebSocket = () => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setConnectionStatus('connecting')
    const ws = new WebSocket('ws://localhost:8000/api/v1/monitor/conversation')
    
    ws.onopen = () => {
      setConnectionStatus('connected')
      toast({
        title: "Monitor Connected! 🔗",
        description: "Now listening for live webhook events from Retell AI.",
      })
    }

    ws.onmessage = (event) => {
      try {
        const webhookEvent: WebhookEvent = JSON.parse(event.data)
        setEvents(prev => [...prev, webhookEvent])
        
        // Track current call and handle call start
        if (webhookEvent.data.call_id) {
          setCurrentCall(webhookEvent.data.call_id)
          
          // Handle call start
          if (webhookEvent.data.event_type === 'call_started' || webhookEvent.data.event_type === 'call_initialized') {
            if (onCallStarted) {
              onCallStarted(webhookEvent.data.call_id)
            }
          }
        }
        
        // Build conversation flow
        if (webhookEvent.data.event_type === 'agent_response' && webhookEvent.data.user_input && webhookEvent.data.agent_response) {
          setConversationFlow(prev => [...prev, {
            user: webhookEvent.data.user_input!,
            agent: webhookEvent.data.agent_response!,
            timestamp: webhookEvent.timestamp
          }])
        }
        
        // Handle call completion
        if (webhookEvent.data.event_type === 'call_completed' && webhookEvent.data.call_data) {
          toast({
            title: "Call Completed!",
            description: "Analysis and transcript are now available.",
          })
          
          // Store completed call data locally
          setCompletedCallData(webhookEvent.data.call_data)
          
          // Still notify parent for other potential uses
          if (onCallCompleted) {
            onCallCompleted(webhookEvent.data.call_data)
          }
        }
        
        // Handle call analysis (post-call analysis from Retell AI)
        if (webhookEvent.data.event_type === 'call_analyzed' && webhookEvent.data.analysis_data) {
          console.log("FRONTEND: Received call_analyzed event:", webhookEvent.data.analysis_data)
          
          toast({
            title: "Analysis Complete!",
            description: "Post-call analysis from Retell AI is now available.",
          })
          
          // Update existing call data with analysis
          setCompletedCallData((prev: any) => {
            console.log("FRONTEND: Previous data:", prev)
            console.log("FRONTEND: Analysis data:", webhookEvent.data.analysis_data?.analysis)
            return {
              ...prev,
              retell_analysis: webhookEvent.data.analysis_data?.analysis
            }
          })
        }
        
        // Show emergency alerts
        if (webhookEvent.data.emergency_check) {
          toast({
            title: "EMERGENCY DETECTED!",
            description: "Agent has switched to emergency protocol mode.",
            variant: "destructive"
          })
        }
        
        // Auto-scroll to bottom
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
          }
        }, 100)
      } catch (error) {
        console.error('Error parsing webhook event:', error)
      }
    }

    ws.onclose = () => {
      setConnectionStatus('disconnected')
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('disconnected')
    }

    websocketRef.current = ws
  }

  const disconnectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }
  }

  const clearEvents = () => {
    setEvents([])
    setCurrentCall(null)
    setConversationFlow([])
    setCompletedCallData(null)
    toast({
      title: "Events Cleared ✨",
      description: "Monitor reset successfully.",
    })
  }

  useEffect(() => {
    // Auto-connect when component mounts
    connectWebSocket()
    
    return () => {
      disconnectWebSocket()
    }
  }, [])

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'call_started':
      case 'call_initialized':
        return <Phone className="h-4 w-4 text-green-500" />
      case 'call_ended':
      case 'call_completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'agent_response':
        return <MessageCircle className="h-4 w-4 text-purple-500" />
      case 'user_speech':
        return <Activity className="h-4 w-4 text-orange-500" />
      case 'webhook_error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getEventBadgeColor = (eventType: string, emergencyCheck?: boolean) => {
    if (emergencyCheck) return 'destructive'
    
    switch (eventType) {
      case 'call_started':
      case 'call_initialized':
        return 'default'
      case 'call_completed':
        return 'secondary'
      case 'agent_response':
        return 'outline'
      case 'webhook_error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Conversation Monitor
              </CardTitle>
              <CardDescription>
                Real-time webhook events from Retell AI conversations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                {connectionStatus}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={clearEvents} variant="outline" size="sm">
              Clear Events
            </Button>
          </div>
          
          {currentCall && (
            <div className="mt-3 p-2 bg-blue-50 rounded border">
              <p className="text-sm font-medium">Active Call: {currentCall}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Conversation Flow */}
      {conversationFlow.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Live Conversation
            </CardTitle>
            <CardDescription>
              Real-time conversation flow between user and AI agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full rounded border p-4">
              <div className="space-y-4">
                {conversationFlow.map((turn, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          User
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(turn.timestamp)}
                        </span>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm">"{turn.user}"</p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Badge variant="secondary" className="text-xs w-fit">
                        AI Agent
                      </Badge>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-sm">"{turn.agent}"</p>
                      </div>
                    </div>
                    {index < conversationFlow.length - 1 && (
                      <hr className="my-2 border-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {connectionStatus === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://retell.ai/dashboard', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Retell Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('http://localhost:3000', '_blank')}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Trigger New Call
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Stream */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Events Stream</CardTitle>
          <CardDescription>
            Live events from your webhook as you test in Retell AI dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full rounded border p-4" ref={scrollAreaRef}>
            {events.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No webhook events yet</p>
                <p className="text-sm">Start a test call in Retell AI dashboard to see live events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.data.event_type)}
                        <Badge variant={getEventBadgeColor(event.data.event_type, event.data.emergency_check)}>
                          {event.data.event_type}
                          {event.data.emergency_check && ' 🚨'}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                    
                    {event.data.call_id && (
                      <p className="text-xs text-gray-600 mb-1">
                        Call: {event.data.call_id}
                      </p>
                    )}
                    
                    {event.data.user_input && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-blue-600">User:</p>
                        <p className="text-sm bg-blue-50 p-2 rounded">
                          "{event.data.user_input}"
                        </p>
                      </div>
                    )}
                    
                    {event.data.agent_response && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-purple-600">Agent Response:</p>
                        <p className="text-sm bg-purple-50 p-2 rounded">
                          "{event.data.agent_response}"
                        </p>
                      </div>
                    )}
                    
                    {event.data.conversation_state && (
                      <div className="mb-2">
                        <p className="text-xs font-medium">State:</p>
                        <Badge variant="outline" className="text-xs">
                          {event.data.conversation_state}
                        </Badge>
                      </div>
                    )}
                    
                    {event.data.error && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-red-600">Error:</p>
                        <p className="text-sm bg-red-50 p-2 rounded text-red-700">
                          {event.data.error}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Call Results Section */}
      {completedCallData && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Call Analysis Complete</span>
            </CardTitle>
            <CardDescription>
              Real-time analysis from your completed call
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor((completedCallData.duration || 0) / 60)}:{((completedCallData.duration || 0) % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-500">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedCallData.driver_name || 'Test Driver'}</div>
                <div className="text-sm text-gray-500">Driver</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{completedCallData.load_number || 'Web Test'}</div>
                <div className="text-sm text-gray-500">Load Number</div>
              </div>
            </div>
            
            {/* Structured Analysis */}
            {completedCallData.retell_analysis && Object.keys(completedCallData.retell_analysis).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Structured Analysis</h3>
                <div className="bg-white rounded-lg p-4 border">
                  {Object.entries(completedCallData.retell_analysis)
                    .filter(([key]) => key !== 'custom_analysis_data')
                    .map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                      <span className="font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Transcript */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Call Transcript</h3>
              <div className="bg-white rounded-lg p-4 max-h-64 overflow-y-auto border">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {completedCallData.transcript || 'No transcript available'}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default LiveConversationMonitor
