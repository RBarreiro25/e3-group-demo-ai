import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Settings, 
  Play, 
  CheckCircle, 
  Activity,
  ChevronRight 
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  callInProgress?: boolean
}

const navigationItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    description: 'Platform metrics and quick actions'
  },
  {
    id: 'agents',
    label: 'Agent Config',
    icon: Settings,
    description: 'Configure AI voice agent'
  },
  {
    id: 'new-call',
    label: 'Test Call',
    icon: Play,
    description: 'Start new voice call test'
  },
  {
    id: 'monitor',
    label: 'Live Monitor',
    icon: Activity,
    description: 'Real-time webhook events'
  },
  {
    id: 'results',
    label: 'Results',
    icon: CheckCircle,
    description: 'Call analysis and outcomes'
  }
]

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, callInProgress }) => {
  return (
    <div className="w-full h-[100dvh] glass-card border-r border-blue-500/20 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-blue-500/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="heading-4">VoiceFleet</h2>
            <p className="caption">Smart Logistics AI</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item, index) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const showBadge = item.id === 'monitor' && callInProgress

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-300 group",
                "hover:bg-secondary/20 hover:shadow-lg hover:scale-[1.02]",
                "animate-fade-in",
                isActive && "bg-primary/10 border border-primary/20 shadow-lg scale-[1.02]"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-300",
                isActive ? "bg-primary/20 text-primary" : "bg-secondary/20 text-muted-foreground group-hover:text-foreground"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "body-text-sm font-medium transition-colors duration-300",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.label}
                  </span>
                  {showBadge && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-scale-in">
                      LIVE
                    </Badge>
                  )}
                </div>
                <p className="caption text-left hidden lg:block">{item.description}</p>
              </div>

              {isActive && (
                <ChevronRight className="h-4 w-4 text-primary animate-fade-in" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-blue-500/20">
        <div className="flex items-center space-x-2 text-caption">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span>Admin</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
