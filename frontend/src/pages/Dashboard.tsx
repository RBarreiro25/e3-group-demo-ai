import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, BarChart3, Play, CheckCircle, AlertCircle, Phone, Activity } from 'lucide-react'
import AgentConfigurationForm from '@/components/AgentConfigurationForm'
import CallTriggerForm from '@/components/CallTriggerForm'
import LiveConversationMonitor from '@/components/LiveConversationMonitor'

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [completedCallData, setCompletedCallData] = useState<any>(null)
  const [callInProgress, setCallInProgress] = useState(false)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  
  // Navigation handler for child components
  const handleNavigateToTab = React.useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])
  
  // Handle call completion from LiveConversationMonitor
  const handleCallCompleted = React.useCallback((callData: any) => {
    setCompletedCallData(callData)
    setCallInProgress(false)
    setCurrentCallId(null)
    // Don't switch tabs - results will show in Live Monitor itself
  }, [])
  
  // Handle call start
  const handleCallStarted = React.useCallback((callId: string) => {
    setCallInProgress(true)
    setCurrentCallId(callId)
    setCompletedCallData(null) // Clear previous results
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            🚛 Logistics AI Voice Platform
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Manage driver check-ins and emergency protocols with intelligent voice agents
          </p>
        </div>

        {/* Call Progress Indicator */}
        {callInProgress && (
          <div className="mb-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="animate-pulse">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-blue-900">Call in Progress</div>
                      <div className="text-sm text-blue-700">
                        Call ID: {currentCallId} • Listening for real-time events...
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    🔴 LIVE
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configure</span>
            </TabsTrigger>
            <TabsTrigger value="new-call" className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Test Call</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Results</span>
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Live Monitor</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setActiveTab('agents')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Agents
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('new-call')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Test Call
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('monitor')} 
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Live Monitor
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Agent Status</CardTitle>
                  <CardDescription>Logistics voice agent configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Logistics AI Agent</p>
                      <p className="text-sm text-muted-foreground">Handles driver check-ins and emergency protocols dynamically</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Platform health and connectivity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Retell AI Connection</span>
                    </span>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Database Connection</span>
                    </span>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>OpenAI Integration</span>
                    </span>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Phone Service</span>
                    </span>
                    <Badge variant="outline">Web Testing Mode</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents">
            <AgentConfigurationForm />
          </TabsContent>


          <TabsContent value="new-call">
            <CallTriggerForm onNavigateToTab={handleNavigateToTab} />
          </TabsContent>

          <TabsContent value="results">
            {completedCallData ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Call Analysis Complete</span>
                    </CardTitle>
                    <CardDescription>
                      Real-time analysis from Retell AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.floor(completedCallData.duration / 60)}:{(completedCallData.duration % 60).toString().padStart(2, '0')}
                        </div>
                        <div className="text-sm text-gray-500">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{completedCallData.driver_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">Driver</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{completedCallData.load_number || 'N/A'}</div>
                        <div className="text-sm text-gray-500">Load Number</div>
                      </div>
                    </div>
                    
                    {/* Structured Analysis */}
                    {completedCallData.retell_analysis && Object.keys(completedCallData.retell_analysis).length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Structured Analysis</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          {Object.entries(completedCallData.retell_analysis).map(([key, value]) => (
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
                      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {completedCallData.transcript || 'No transcript available'}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Call Results</CardTitle>
                  <CardDescription>Complete a call to see analysis results here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Start a new call from the "New Call" tab to see real-time results appear here automatically.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="monitor">
            <LiveConversationMonitor 
              onCallCompleted={handleCallCompleted} 
              onCallStarted={handleCallStarted}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard
