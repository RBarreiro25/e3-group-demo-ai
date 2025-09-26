import React, { useState } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, BarChart3, Play, CheckCircle, AlertCircle, Phone, Activity } from 'lucide-react'
import AgentConfigurationForm from '@/components/AgentConfigurationForm'
import CallTriggerForm from '@/components/CallTriggerForm'
import LiveConversationMonitor from '@/components/LiveConversationMonitor'
import AppLayout from '@/components/layout/AppLayout'

interface DashboardProps {
  // Props can be added here if needed
}

const Dashboard: React.FC<DashboardProps> = () => {
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
    <AppLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      callInProgress={callInProgress}
    >
      {/* Call Progress Indicator */}
      {callInProgress && (
        <Card variant="elevated" className="border-primary/20 bg-primary/5 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="animate-pulse">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Call in Progress</div>
                  <div className="text-sm text-muted-foreground">
                    Call ID: {currentCallId} • Listening for real-time events...
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                🔴 LIVE
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Navigation - Show only on mobile when sidebar is hidden */}
      <div className="lg:hidden mb-6">
        <div className="mobile-nav-grid">
          {[
            { id: 'overview', icon: BarChart3, title: 'Overview' },
            { id: 'agents', icon: Settings, title: 'Configure' },
            { id: 'new-call', icon: Play, title: 'Test Call' },
            { id: 'results', icon: CheckCircle, title: 'Results' },
            { id: 'monitor', icon: Activity, title: 'Live Monitor' }
          ].map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Card
                key={tab.id}
                variant="glass"
                className={`interactive-card glow-on-hover animate-fade-in ${
                  isActive ? 'ring-2 ring-primary shadow-primary/25 scale-105' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setActiveTab(tab.id)}
              >
                <CardContent className="mobile-card-content text-center">
                  <div className={`mb-2 ${isActive ? 'animate-float' : ''}`}>
                    <Icon className={`mobile-icon-responsive mx-auto transition-colors duration-300 ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <h3 className={`font-medium mobile-text-responsive transition-colors duration-300 ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {tab.title}
                  </h3>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="section-spacing">
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          <TabsContent value="overview" className="section-spacing">
            <div className="card-grid">
              {/* Quick Actions */}
              <Card variant="glass" className="animate-slide-up glow-on-hover" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <CardTitle className="heading-3 flex items-center space-x-2">
                    <Play className="h-5 w-5 text-primary" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  <CardDescription className="body-text-sm">Rapid access to key platform functions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setActiveTab('new-call')} 
                    variant="glass"
                    className="w-full justify-start"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Test Call
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('monitor')} 
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Live Monitor
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('agents')} 
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Agent
                  </Button>
                </CardContent>
              </Card>

              {/* AI Agent Status */}
              <Card variant="glass" className="animate-slide-up glow-on-hover" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle className="heading-3 flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <span>AI Agent Status</span>
                  </CardTitle>
                  <CardDescription className="body-text-sm">Logistics voice agent configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-border/30 rounded-lg bg-card/20">
                    <div>
                      <p className="heading-4">Logistics AI Agent</p>
                      <p className="body-text-sm">Handles driver check-ins and emergency protocols dynamically</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status - Full Width */}
            <Card variant="glass" className="animate-slide-up glow-on-hover" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="heading-3 flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary status-pulse" />
                  <span>System Status</span>
                </CardTitle>
                <CardDescription className="body-text-sm">Platform health and connectivity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <span className="connection-indicator connected">
                      <CheckCircle className="h-4 w-4 text-green-500 status-pulse" />
                      <span className="body-text-sm text-foreground">Retell AI Connection</span>
                    </span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 animate-scale-in">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <span className="connection-indicator connected">
                      <CheckCircle className="h-4 w-4 text-green-500 status-pulse" />
                      <span className="body-text-sm text-foreground">Database Connection</span>
                    </span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 animate-scale-in">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '0.7s' }}>
                    <span className="connection-indicator">
                      <AlertCircle className="h-4 w-4 text-orange-500 status-pulse" />
                      <span className="body-text-sm text-foreground">Phone Service</span>
                    </span>
                    <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 animate-scale-in">Web Testing Mode</Badge>
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
    </AppLayout>
  )
}

export default Dashboard
