import React from 'react'

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        AI Voice Agent Platform
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Agent Configuration</h2>
          <p className="text-muted-foreground">
            Configure your AI voice agents for different scenarios
          </p>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Start Call</h2>
          <p className="text-muted-foreground">
            Trigger test calls to drivers with load information
          </p>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Call Results</h2>
          <p className="text-muted-foreground">
            View structured results and call transcripts
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
