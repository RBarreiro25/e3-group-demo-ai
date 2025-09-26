import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Breadcrumb from './Breadcrumb'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  activeTab?: string
  onTabChange?: (tab: string) => void
  callInProgress?: boolean
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  activeTab = 'overview', 
  onTabChange = () => {}, 
  callInProgress = false 
}) => {
  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-accent/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar - FIXED TO LEFT EDGE */}
      <div className="fixed left-0 top-0 z-10 hidden lg:flex w-64 h-[100dvh]">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={onTabChange}
          callInProgress={callInProgress}
        />
      </div>

      {/* Main Content Area - WITH LEFT MARGIN FOR SIDEBAR */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0 h-[100dvh] lg:ml-64">
        {/* Header - Fixed Height */}
        <div className="flex-shrink-0">
          <Header title={title} subtitle={subtitle} />
        </div>
        
         {/* Breadcrumb - Fixed Height */}
         <div className="px-6 py-3 border-b border-blue-500/10 flex-shrink-0">
          <Breadcrumb activeTab={activeTab} />
        </div>

        {/* Main Content - Scrollable Area - FULL WIDTH */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 w-full max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
