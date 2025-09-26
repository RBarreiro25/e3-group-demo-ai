import React from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Settings, User, Zap } from 'lucide-react'

interface HeaderProps {
  title?: string
  subtitle?: string
}

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="glass-card border-b border-blue-500/10 px-6 py-4 sticky top-0 z-50" style={{height: '70.7px'}}>
      <div className="flex items-center justify-end">

        {/* Status & Actions */}
        <div className="flex items-center space-x-2">

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="glass-input hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="glass-input hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="glass-input border-border/30 hover:bg-secondary/20"
            >
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
