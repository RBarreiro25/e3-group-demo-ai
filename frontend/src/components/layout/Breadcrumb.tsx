import React from 'react'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbProps {
  activeTab: string
}

const breadcrumbLabels: Record<string, string> = {
  overview: 'Dashboard Overview',
  agents: 'Agent Configuration',
  'new-call': 'Start New Call',
  results: 'Call Results',
  monitor: 'Live Monitor'
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ activeTab }) => {
  const currentLabel = breadcrumbLabels[activeTab] || 'Dashboard'

  return (
    <div className="flex items-center space-x-2 text-caption animate-fade-in">
      <Home className="h-4 w-4 text-muted-foreground" />
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <span className="text-muted-foreground">VoiceFleet</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <span className="text-foreground font-medium">{currentLabel}</span>
    </div>
  )
}

export default Breadcrumb
