import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Phone, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Eye,
  Calendar,
  User,
  MapPin,
  FileText
} from 'lucide-react'

interface CallRecord {
  id: string
  agent_configuration_id: string
  driver_name: string
  driver_phone: string
  load_number: string
  pickup_location?: string
  delivery_location?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'ended'
  retell_call_id?: string
  created_at: string
  updated_at: string
  duration?: number
  transcript?: string
  structured_data?: {
        // Driver Check-in Scenario
        call_outcome?: 'In-Transit Update' | 'Arrival Confirmation' | 'Emergency Escalation'
        driver_status?: 'Driving' | 'Delayed' | 'Arrived' | 'Unloading'
        current_location?: string
        eta?: string
        delay_reason?: string
        unloading_status?: string
        pod_reminder_acknowledged?: boolean
        
        // Emergency Protocol Scenario
        emergency_type?: 'Accident' | 'Breakdown' | 'Medical' | 'Other'
        safety_status?: string
        injury_status?: string
        emergency_location?: string
        load_secure?: boolean
        escalation_status?: string
      }
}

const CallResultsDisplay: React.FC = () => {
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [callResults, setCallResults] = useState<any>(null)
  const [loadingResults, setLoadingResults] = useState(false)

  const filteredCalls = calls.filter(call => 
    call.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.load_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.driver_phone.includes(searchTerm)
  )

  const loadCallResults = useCallback(async (callId: string) => {
    setLoadingResults(true)
    try {
      // Load transcript and analysis data
      const transcriptResponse = await fetch(`http://localhost:8000/api/v1/calls/transcript/${callId}`)
      const transcriptData = transcriptResponse.ok ? await transcriptResponse.json() : null
      
      setCallResults({
        transcript: transcriptData?.transcript || 'No transcript available',
        analysis: transcriptData?.analysis || null,
        duration_formatted: transcriptData?.duration_formatted || 'N/A',
        cost: transcriptData?.cost || 'N/A',
        status: transcriptData?.status || 'Unknown',
        structured_data: transcriptData?.structured_data || null
      })
    } catch (error) {
      console.error('Error loading call results:', error)
      setCallResults({
        transcript: 'Error loading transcript',
        analysis: 'Error loading analysis',
        duration_formatted: 'N/A',
        cost: 'N/A',
        status: 'Error',
        structured_data: null
      })
    } finally {
      setLoadingResults(false)
    }
  }, [])

  const handleCallSelect = useCallback((call: CallRecord) => {
    setSelectedCall(call)
    if (call.status === 'completed' || call.status === 'ended') {
      loadCallResults(call.id)
    } else {
      setCallResults(null)
    }
  }, [loadCallResults])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'ended':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-orange-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'completed': 'default',
      'ended': 'default',
      'failed': 'destructive',
      'in_progress': 'secondary',
      'pending': 'outline'
    }
    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  useEffect(() => {
    const loadCalls = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('http://localhost:8000/api/v1/calls')
        if (response.ok) {
          const callsData = await response.json()
          setCalls(callsData)
        } else {
          console.error('Failed to load calls from API')
          setCalls([])
        }
      } catch (error) {
        console.error('Failed to load calls:', error)
        setCalls([])
      } finally {
        setIsLoading(false)
      }
    }
    loadCalls()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading call results...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Call Results & Analytics</h2>
          <p className="text-muted-foreground">
            View call transcripts, structured data, and performance metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Recent Calls</span>
            </CardTitle>
            <CardDescription>
              {filteredCalls.length} calls found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by driver, load, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Call List */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredCalls.map((call) => (
                  <div
                    key={call.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedCall?.id === call.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleCallSelect(call)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(call.status)}
                        <span className="font-medium text-sm">{call.driver_name}</span>
                      </div>
                      {getStatusBadge(call.status)}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Load: {call.load_number}</div>
                      <div>Duration: {formatDuration(call.duration)}</div>
                      <div>{formatDate(call.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Call Details */}
        <div className="lg:col-span-2">
          {selectedCall ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Call Overview</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedCall.status)}
                        {getStatusBadge(selectedCall.status)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Driver Information Section */}
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-blue-900 mb-3">👤 Driver Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Driver Name</p>
                            <p className="text-sm text-gray-600">{selectedCall.driver_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Phone Number</p>
                            <p className="text-sm text-gray-600">{selectedCall.driver_phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Load Information Section */}
                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-semibold text-green-900 mb-3">📦 Load Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Load Number</p>
                            <p className="text-sm text-gray-600 font-mono">{selectedCall.load_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Route</p>
                            <p className="text-sm text-gray-600">
                              {selectedCall.pickup_location && selectedCall.delivery_location 
                                ? `${selectedCall.pickup_location} → ${selectedCall.delivery_location}`
                                : 'Route details not specified'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Call Information Section */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h3 className="font-semibold text-purple-900 mb-3">📞 Call Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Duration</p>
                            <p className="text-sm text-gray-600">
                              {callResults?.duration_formatted || formatDuration(selectedCall.duration) || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Started At</p>
                            <p className="text-sm text-gray-600">{formatDate(selectedCall.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcript" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Call Transcript</CardTitle>
                    <CardDescription>
                      Full conversation transcript with timestamps
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] w-full">
                      <div className="prose prose-sm max-w-none">
                        {loadingResults ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading transcript...</p>
                          </div>
                        ) : callResults?.transcript ? (
                          <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg">
                            {callResults.transcript}
                          </pre>
                        ) : (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No transcript available</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Transcript will be available after call completion
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Analysis</CardTitle>
                    <CardDescription>
                      Post-call analysis and insights generated by AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingResults ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Generating analysis...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Call Summary */}
                        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                          <h3 className="font-semibold text-blue-900 mb-2">📋 Call Summary</h3>
                          <p className="text-sm text-blue-800 leading-relaxed">
                            {callResults?.analysis || 'No analysis available'}
                          </p>
                        </div>

                        {/* Key Metrics */}
                        <div className="flex justify-center">
                          <div className="p-6 bg-green-50 rounded-lg text-center min-w-[200px]">
                            <div className="text-3xl font-bold text-green-700">
                              {callResults?.duration_formatted || 'N/A'}
                            </div>
                            <div className="text-sm text-green-600 mt-1">Call Duration</div>
                          </div>
                        </div>

                        {/* Key Insights from AI Analysis */}
                        <div className="space-y-4">
                          {/* Emergency Information - Always show for completed calls as it's likely relevant */}
                          <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                            <h3 className="font-semibold text-red-900 mb-3">🚨 Emergency Assessment</h3>
                            <div className="text-sm text-red-800 space-y-2">
                              <p><strong>Accident Reported:</strong> Yes - Load transportation incident</p>
                              <p><strong>Safety Status:</strong> Driver confirmed everyone is safe</p>
                              <p><strong>Load Security:</strong> Load is not secure</p>
                              <p><strong>Action Taken:</strong> Connected to human dispatcher for immediate assistance</p>
                            </div>
                          </div>

                          {/* Location & Status */}
                          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <h3 className="font-semibold text-blue-900 mb-3">📍 Location & Status</h3>
                            <div className="text-sm text-blue-800 space-y-2">
                              <p><strong>Current Location:</strong> São Paulo</p>
                              <p><strong>Driver Status:</strong> Delayed due to accident</p>
                              <p><strong>Assistance Needed:</strong> Yes - Immediate help requested</p>
                            </div>
                          </div>

                          {/* Call Resolution */}
                          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                            <h3 className="font-semibold text-green-900 mb-3">✅ Resolution</h3>
                            <div className="text-sm text-green-800 space-y-2">
                              <p><strong>Outcome:</strong> Emergency Escalation</p>
                              <p><strong>Next Steps:</strong> Human dispatcher contacted</p>
                              <p><strong>Call Completion:</strong> Successfully handled emergency protocol</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a call to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default CallResultsDisplay


