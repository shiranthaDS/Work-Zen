# Employee Management System - Architecture

## System Architecture

This EMS follows a modern, microservices-inspired architecture with MCP (Model Context Protocol) integration:

```
┌─────────────┐
│   User      │
│  Browser    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌──────────────────┐
│    Next.js       │
│  Frontend App    │ (Routing & UI)
│  Port: 3000      │
└────────┬─────────┘
         │ POST /api/chat
         ▼
┌──────────────────────┐
│   FastAPI Backend    │
│   (Python 3.9)       │
│   Port: 8000         │
│                      │
│  1. LLM Intent       │
│     Detection        │
│  2. Call MCP Client  │
│  3. LLM Response     │
│     Generation       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│    MCP Client        │
│  (Python asyncio)    │
│                      │
│  - Spawns MCP Server │
│  - JSON-RPC via stdio│
└────────┬─────────────┘
         │ stdio communication
         ▼
┌──────────────────────┐
│    MCP Server        │
│  (Node.js Process)   │
│                      │
│  16 MongoDB Tools:   │
│  - list_employees    │
│  - search_employees  │
│  - list_attendance   │
│  - list_leaves       │
│  - list_payroll      │
│  - etc.              │
└────────┬─────────────┘
         │ MongoDB Driver
         ▼
┌──────────────────────┐
│   MongoDB Atlas      │
│                      │
│  Collections:        │
│  - employees         │
│  - job_data          │
│  - attendance        │
│  - leaves            │
│  - payroll           │
└──────────────────────┘
         │
         ▼ (Data flows back)
┌──────────────────────┐
│  Dual LLM System     │
│  (OpenRouter/HF)     │
│                      │
│  LLM #1: Intent      │
│  Detection           │
│  LLM #2: Response    │
│  Formatting          │
└──────────────────────┘
```

## Data Flow

1. **User Query**: User types a question in the Next.js frontend
2. **Next.js**: Routes the request to FastAPI backend (`/api/chat`)
3. **FastAPI Backend**: 
   - Uses **LLM Intent Detection** (OpenRouter/HuggingFace) to understand query
   - No regex fallback - pure AI-powered intent detection
   - Calls MCP Client with appropriate tool and parameters
4. **MCP Client**: 
   - Spawns Node.js MCP Server process (if not running)
   - Sends JSON-RPC request via stdin
   - Receives JSON-RPC response via stdout
5. **MCP Server**: 
   - Receives tool call request
   - Queries MongoDB with appropriate filters
   - Returns data as JSON-RPC response
6. **Data Return Path**:
   - MCP Server → MCP Client (JSON-RPC response)
   - MCP Client → FastAPI Backend (parsed data)
   - FastAPI Backend → **LLM Response Generator** (OpenRouter/HuggingFace)
   - LLM formats data into natural language
   - Beautiful response → User

## Key Technologies

### Frontend
- **Next.js 14.0.4**: React framework with routing
- **React 18.2.0**: UI components
- **TailwindCSS 3.4.1**: Styling
- **TypeScript**: Type safety

### Backend
- **FastAPI 0.109.0**: Python web framework
- **Motor 3.3.2**: Async MongoDB driver
- **PyMongo 4.6.1**: MongoDB Python driver
- **asyncio**: Async subprocess management for MCP

### MCP Layer
- **MCP Client**: Python asyncio-based client
  - Manages MCP Server subprocess
  - JSON-RPC 2.0 protocol
  - stdio-based communication
- **MCP Server**: Node.js implementation
  - @modelcontextprotocol/sdk 0.5.0
  - 16 MongoDB tools
  - Direct MongoDB queries

### AI/LLM (Dual LLM Architecture)
- **Primary LLM**: OpenRouter API (mistralai/mistral-7b-instruct:free)
- **Backup LLM**: HuggingFace API (Mistral-7B-Instruct-v0.2)
- **LLM #1 - Intent Detection**: 
  - Analyzes user query
  - Selects appropriate MCP tool
  - Temperature: 0.3 (consistent)
  - **No regex fallback** - pure LLM
- **LLM #2 - Response Generation**:
  - Formats raw MongoDB data
  - Creates natural language responses
  - Temperature: 0.7 (conversational)
  - Smart fallback formatter if LLM unavailable

### Database
- **MongoDB Atlas**: Cloud-hosted MongoDB
- **Connection**: mongodb+srv://shiranthadw:admin@shopx.pfe2m4h.mongodb.net/
- **Database**: ems_database
- **Collections**: employees, job_data, attendance, leaves, payroll

## MCP Tools Available

1. **list_employees**: Get all employees with pagination
2. **get_employee**: Get single employee by ID
3. **search_employees**: Search employees by name/email
4. **list_job_data**: Get all job/organizational data
5. **get_job_data**: Get job data for specific employee
6. **list_attendance**: Get attendance records
7. **get_attendance**: Get attendance for specific employee
8. **list_leaves**: Get leave requests
9. **get_leave**: Get specific leave request
10. **pending_leaves**: Get pending leave requests
11. **get_leave_balance**: Get leave balance for employee
12. **list_payroll**: Get payroll records
13. **get_payroll**: Get payroll for specific employee
14. **department_employees**: Get employees by department
15. **stats_summary**: Get system statistics
16. **search**: General search across all collections

## Communication Protocol

### JSON-RPC Request (Python → Node.js)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_employees",
    "arguments": {
      "limit": 10
    }
  }
}
```

### JSON-RPC Response (Node.js → Python)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[{...employee data...}]"
      }
    ]
  }
}
```

## Running the Application

### Backend (FastAPI)
```bash
cd backend
./venv/bin/uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js)
```bash
cd frontend
npm run dev
```

### MCP Server
Automatically started by FastAPI backend on application startup via MCP Client.

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb+srv://shiranthadw:admin@shopx.pfe2m4h.mongodb.net/
DATABASE_NAME=ems_database

# LLM Configuration (Required for chat interface)
OPENROUTER_API_KEY=sk-or-v1-<your_key>  # Primary LLM (recommended)
HUGGINGFACE_API_KEY=hf_<your_key>       # Backup LLM (optional)

# Note: At least one LLM API key is required for chat to work
```

### MCP Server (.env)
```
MONGO_URL=mongodb+srv://shiranthadw:admin@shopx.pfe2m4h.mongodb.net/ems_database
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Why This Architecture?

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Scalability**: MCP Server can be scaled independently
3. **Flexibility**: Easy to add new tools to MCP Server
4. **Type Safety**: MCP protocol provides structure to data flow
5. **Dual LLM Intelligence**: 
   - LLM #1 understands user intent (no regex needed)
   - LLM #2 formats responses naturally
   - Both use AI for superior accuracy
6. **Process Isolation**: MCP Server runs in separate Node.js process
7. **Modern Standards**: Follows Model Context Protocol specification
8. **Reliability**: Primary/backup LLM system ensures availability
