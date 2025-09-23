# AI Voice Agent Platform

A professional web application for configuring, testing, and analyzing AI voice agents for logistics dispatch operations.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui + TailwindCSS
- **Backend**: FastAPI + SQLAlchemy + Pydantic
- **Database**: Supabase (PostgreSQL)
- **Voice AI**: Retell AI
- **AI Processing**: OpenAI GPT-4

## Project Structure

```
e3-project/
├── frontend/          # React TypeScript application
├── backend/           # FastAPI Python backend
├── database/          # Database schema and migrations
└── README.md
```

## Features

- 📞 **Agent Configuration**: Define prompts and conversation logic
- 🚛 **Call Management**: Trigger calls to drivers with load context
- 📊 **Results Analysis**: View structured call results and full transcripts
- 🚨 **Emergency Handling**: Dynamic response to emergency situations
- 🎯 **Real-time Processing**: Live conversation guidance via webhooks

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.9+
- Supabase account
- Retell AI API access
- OpenAI API key

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `backend/env.example` to `backend/.env` and fill in your API keys:

```bash
cp backend/env.example backend/.env
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL in `database/schema.sql` in your Supabase SQL Editor
3. Add your Supabase URL and key to `backend/.env`

### 4. Run the Application

```bash
# Start backend (Terminal 1)
cd backend
uvicorn app.main:app --reload --port 8000

# Start frontend (Terminal 2)
cd frontend
npm run dev
```

## API Documentation

Once running, visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development Guidelines

- **TypeScript**: Strict typing throughout
- **Clean Code**: No unnecessary comments, simple yet powerful
- **Real Integrations**: No mocked data or hardcoded responses
- **Professional UI**: Modern, impressive interface using shadcn/ui