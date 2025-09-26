# VoiceFleet - AI Logistics Voice Agent Platform

A sophisticated web application for configuring, testing, and monitoring AI voice agents specifically designed for logistics dispatch operations. Built to handle real-world driver check-ins, emergency scenarios, and dynamic conversation flows.

## 🎯 Project Overview

VoiceFleet enables non-technical administrators to:
- **Configure** intelligent AI voice agents with logistics-specific prompts
- **Trigger** real phone calls to drivers with contextual load information  
- **Monitor** live conversations through real-time webhook events
- **Analyze** structured call results with emergency detection capabilities

## 🏗️ Architecture & Tech Stack

### **Frontend** 
- **React 18** + **TypeScript** + **Vite** for modern development
- **shadcn/ui** + **TailwindCSS** for professional glassmorphic design
- **Framer Motion** for smooth animations and transitions
- **Lucide React** for consistent iconography
- **React Query** for efficient API state management

### **Backend**
- **FastAPI** with async/await for high-performance API  
- **Pydantic** for data models and settings validation
- **WebSockets** for real-time frontend updates
- **Retell SDK** for voice agent integration
- **Supabase Client** for direct database operations

### **Database & Services**
- **Supabase (PostgreSQL)** for scalable data storage
- **Retell AI** for advanced voice conversation handling
- **OpenAI GPT-4** for intelligent conversation guidance
- **Real-time webhooks** for live call monitoring

## 🚀 Key Features Implemented

### 1. **Agent Configuration Management**
- ✅ Dynamic prompt configuration with logistics scenarios
- ✅ Advanced voice settings (interruption sensitivity, backchannel, filler words)
- ✅ Voice model selection and language configuration
- ✅ Real-time Retell AI agent synchronization

### 2. **Call Triggering & Management** 
- ✅ Driver context input (name, phone, load number, locations)
- ✅ One-click call initiation through Retell AI
- ✅ Call status tracking (pending, in_progress, completed, failed)
- ✅ Integration with live monitoring dashboard

### 3. **Real-time Conversation Monitoring**
- ✅ **WebSocket-powered** live event streaming
- ✅ Real-time webhook processing from Retell AI
- ✅ Live conversation state updates
- ✅ Emergency detection and escalation alerts
- ✅ Auto-connecting monitor with instant updates

### 4. **Intelligent Results Analysis**
- ✅ **Structured data extraction** from raw transcripts
- ✅ Emergency scenario detection and handling
- ✅ Driver status classification (driving, arrived, delayed)
- ✅ Location and ETA tracking
- ✅ POD reminder acknowledgment tracking

### 5. **Modern Glassmorphic UI**
- ✅ **Fixed sidebar navigation** with consistent branding
- ✅ **Responsive design** optimized for all screen sizes
- ✅ **Real-time status indicators** with animated feedback
- ✅ **Professional card layouts** with hover effects
- ✅ **Consistent typography hierarchy** across all modules

## 📁 Project Structure

```
voicefleet/
├── frontend/                    # React TypeScript Application
│   ├── src/
│   │   ├── components/         
│   │   │   ├── layout/         # AppLayout, Sidebar, Header, Breadcrumb
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── AgentConfigurationForm.tsx
│   │   │   ├── CallTriggerForm.tsx
│   │   │   ├── CallResultsDisplay.tsx
│   │   │   └── LiveConversationMonitor.tsx
│   │   ├── pages/
│   │   │   └── Dashboard.tsx   # Main tabbed interface
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility functions
│   │   └── types/              # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── backend/                     # FastAPI Python Backend
│   ├── app/
│   │   ├── api/api_v1/endpoints/
│   │   │   ├── agents.py       # Agent CRUD operations
│   │   │   ├── calls.py        # Call management & transcripts
│   │   │   ├── webhooks.py     # Retell AI webhook handler
│   │   │   ├── monitor.py      # WebSocket real-time updates
│   │   │   └── health.py       # System health checks
│   │   ├── core/
│   │   │   ├── config.py       # Environment configuration
│   │   │   └── database.py     # Supabase connection
│   │   ├── models/             # Pydantic data models
│   │   ├── services/
│   │   │   ├── conversation_engine.py  # AI conversation logic
│   │   │   └── retell_client.py        # Retell AI integration
│   │   └── main.py            # FastAPI application entry
│   ├── requirements.txt
│   └── update_webhook.py       # Retell webhook configuration
├── database/
│   └── schema.sql             # PostgreSQL database schema
├── package.json               # Root development scripts
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js 18+** and **npm**
- **Python 3.9+** and **pip**
- **Supabase account** (free tier works)
- **Retell AI API access**
- **OpenAI API key**

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd voicefleet

# Install all dependencies (frontend + backend)
npm run install:all
```

### 2. Database Configuration

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Run the database schema**:
   - Go to your Supabase dashboard → SQL Editor
   - Copy and execute the SQL from `database/schema.sql`
3. **Get your credentials**:
   - Project URL: `https://<project-id>.supabase.co`
   - API Key: Found in Settings → API

### 3. Environment Variables

Create `backend/.env` with your API credentials:

```bash
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# AI Services
RETELL_API_KEY=your-retell-api-key
OPENAI_API_KEY=your-openai-api-key

# Optional: Development settings
ENVIRONMENT=development
```

### 4. Retell AI Setup

```bash
# Update your Retell agent with webhook URL
cd backend
python update_webhook.py
```

> **Note**: For local development, use [ngrok](https://ngrok.com) to expose your backend:
> ```bash
> ngrok http 8000
> # Then update webhook with: https://your-ngrok-url.ngrok.io/api/v1/webhooks/retell
> ```

### 5. Run the Application

```bash
# Start both frontend and backend simultaneously
npm run dev

# Or run separately:
# Terminal 1 - Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## 🌐 Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000  
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📋 Core Logistics Scenarios

### **Scenario 1: Driver Check-in Call**
**Agent behavior**: Dynamic conversation flow that adapts based on driver status
**Structured data extracted**:
- `call_outcome`: "In-Transit Update" | "Arrival Confirmation"
- `driver_status`: "Driving" | "Delayed" | "Arrived" | "Unloading" 
- `current_location`: GPS or verbal location
- `eta`: Expected arrival time
- `delay_reason`: Traffic, weather, or other issues
- `pod_reminder_acknowledged`: Proof of delivery reminder

### **Scenario 2: Emergency Detection**
**Agent behavior**: Immediate protocol switch on emergency keywords
**Structured data extracted**:
- `call_outcome`: "Emergency Escalation"
- `emergency_type`: "Accident" | "Breakdown" | "Medical"
- `safety_status`: Driver and passenger safety confirmation
- `emergency_location`: Precise location for assistance
- `load_secure`: Load security status
- `escalation_status`: Human dispatcher connection

## 🔧 Advanced Features

### **Real-time WebSocket Integration**
- Live webhook event streaming to frontend
- Instant call result updates without page refresh
- Real-time conversation state monitoring
- Auto-connecting live monitor

### **Intelligent Conversation Engine**
- Emergency keyword detection and immediate escalation
- Dynamic response generation based on driver input
- Context-aware follow-up questions
- Graceful handling of unclear responses

### **Professional UI/UX**
- Glassmorphic design with smooth animations
- Responsive layout for desktop and mobile
- Consistent typography and color schemes
- Interactive feedback and status indicators

## 🚦 API Endpoints

### **Agent Management**
- `GET /api/v1/agents` - List all agent configurations
- `PUT /api/v1/agents/{id}` - Update agent configuration
- `POST /api/v1/agents/{id}/sync` - Sync with Retell AI

### **Call Operations**  
- `POST /api/v1/calls` - Trigger new call
- `GET /api/v1/calls` - List all calls
- `GET /api/v1/calls/transcript/{call_id}` - Get call transcript

### **Real-time Monitoring**
- `WebSocket /api/v1/monitor/conversation` - Live event stream
- `POST /api/v1/webhooks/retell` - Retell AI webhook handler

## 🎨 Design Philosophy

**VoiceFleet** implements a **futuristic glassmorphic design** with:
- **Depth and transparency** through backdrop blur effects
- **Consistent visual hierarchy** with defined typography scales
- **Smooth animations** that enhance user experience
- **Professional color palette** optimized for logistics workflows
- **Mobile-first responsive design** that works on all devices

## 🛡️ Production Considerations

- **Environment-based configuration** with Pydantic settings
- **Robust error handling** with detailed logging
- **Type safety** throughout with TypeScript and Pydantic
- **Clean database schema** optimized for performance
- **WebSocket connection management** with automatic cleanup
- **CORS configuration** for secure cross-origin requests

## 📖 Development Notes

This application demonstrates:
- **Modern React patterns** with hooks and context
- **FastAPI best practices** with async endpoints
- **Real-time architecture** using WebSockets
- **External API integration** with Retell AI and OpenAI
- **Responsive design** with TailwindCSS utilities
- **Professional UI components** with shadcn/ui

Built to showcase full-stack capabilities in a realistic logistics automation scenario.