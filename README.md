# Employee Management System (EMS)

A comprehensive, production-ready Employee Management System with AI-powered chat interface, built with modern technologies and following the Model Context Protocol (MCP) architecture...

## 🎯 Features

### Core Modules
1. **Employee Management**: Complete CRUD operations for employee data
2. **Job & Organizational Data**: Department, position, and reporting structure management
3. **Attendance Tracking**: Clock in/out, work hours, and attendance records
4. **Leave Management**: Leave requests, approvals, and balance tracking
5. **Payroll & Compensation**: Salary structures, payments, and compensation management

### AI Chat Interface
- Natural language queries to database
- **Dual LLM System**: Intent Detection + Response Generation
- **LLM-Only Mode**: No regex fallback - pure AI intelligence
- Powered by OpenRouter (Primary) & HuggingFace (Backup)
- Beautiful, formatted responses
- Real-time data retrieval via MCP

### Database Features
- **Foreign Key Relationships**: Proper indexes on `employee_id` linking all collections
- **Optimized MongoDB Queries**: Efficient aggregation pipelines
- **62+ Filter Parameters**: Comprehensive filtering across all collections

### Production Ready
- ✅ **Unified Environment Variables**: Consistent `MONGO_URL` and `MONGO_DB_NAME` across all services
- ✅ **Error Handling**: Comprehensive error logging with stderr capture
- ✅ **Health Checks**: Process monitoring and automatic recovery
- ✅ **Docker Support**: Full containerization with docker-compose
- ✅ **AWS EC2 Ready**: Complete deployment guide included

## 🏗️ Architecture

```
User → Next.js → FastAPI → LLM Intent Detection → MCP Client → stdio → MCP Server → MongoDB
                            ↑                                                           ↓
                      OpenRouter/HF                                                  Data
                            ↑                                                           ↓
                   LLM Response Generation ←────────────────────────────────────────┘
```

### Key Components
- **Next.js Frontend**: Modern React UI with TypeScript
- **FastAPI Backend**: High-performance Python REST API
- **MCP Server**: Node.js server providing MongoDB tools via stdio
- **Dual LLM System**: Intent detection + response generation
- **MongoDB Atlas**: Cloud-hosted NoSQL database

## 🚀 Quick Start

### Option 1: Docker (Recommended) 🐳

**Prerequisites**: Docker Desktop installed

```bash
# 1. Clone the repository
git clone https://github.com/shiranthaDS/Work-Zen.git
cd Work-Zen

# 2. Configure environment
cp .env.example .env
# Edit .env and add your MongoDB URL and API keys

# 3. Start all services
docker-compose up -d --build

# 4. Check container status
docker-compose ps

# 5. View logs
docker-compose logs -f              # All containers
docker-compose logs -f backend      # Backend only
docker-compose logs -f frontend     # Frontend only

# 6. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Common Docker Commands

```bash
# Start containers
docker-compose up -d                # Start in background
docker-compose up                   # Start with logs in foreground

# Stop containers
docker-compose stop                 # Stop containers
docker-compose down                 # Stop and remove containers

# Restart containers
docker-compose restart              # Restart all
docker-compose restart backend      # Restart backend only

# View logs
docker-compose logs -f backend      # Follow backend logs
docker-compose logs --tail=100 backend  # Last 100 lines
docker-compose logs --since 30m     # Last 30 minutes

# Check container status
docker-compose ps                   # List all containers
docker ps                          # List running containers

# Execute commands in container
docker-compose exec backend bash    # Access backend shell
docker-compose exec frontend sh     # Access frontend shell

# Rebuild specific service
docker-compose up -d --build backend

# Clean restart (remove volumes)
docker-compose down -v
docker-compose up -d --build
```

**See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed Docker instructions.**

**For AWS EC2 deployment, see [AWS_EC2_DEPLOYMENT.md](AWS_EC2_DEPLOYMENT.md).**

### Option 2: Manual Setup

**Prerequisites**
- Node.js 18+ and npm
- Python 3.9+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone and Setup

```bash
git clone https://github.com/shiranthaDS/Work-Zen.git
cd Work-Zen
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
# MongoDB Configuration
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
MONGO_DB_NAME=ems_database

# AI/LLM Configuration (Required for chat interface)
# Option 1: OpenRouter (Recommended - free tier available)
OPENROUTER_API_KEY=sk-or-v1-<your_api_key>

# Option 2: HuggingFace (Backup)
HUGGINGFACE_API_KEY=hf_<your_api_key>

# Note: At least one LLM API key is required for the chat interface to work
```

**Get API Keys:**
- **OpenRouter**: Sign up at [openrouter.ai](https://openrouter.ai) (Free tier available)
- **HuggingFace**: Sign up at [huggingface.co](https://huggingface.co/settings/tokens)

Start backend:
```bash
uvicorn app.main:app --reload --port 8000
```

**View Backend Logs:**
```bash
# Terminal shows live logs
# Look for these key messages:
# - "Connected to MongoDB: ems_database"
# - "✅ OpenRouter API configured (Primary LLM)"
# - "🚀 Starting MCP Server"
# - "✅ MCP Server started successfully"
```

**Verify LLM Setup:**
You should see one of these messages:
- `✅ OpenRouter API configured (Primary LLM)` ← Best option!
- `✅ HuggingFace API configured (Backup LLM)`
- `⚠️  WARNING: No LLM API keys configured!` ← Chat won't work

### 3. MCP Server Setup

```bash
cd mcp-server
npm install
```

Create `mcp-server/.env`:
```env
# MongoDB Configuration (same as backend)
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
MONGO_DB_NAME=ems_database
```

**Note**: MCP Server is automatically started by the FastAPI backend, no manual start needed.

### 4. Frontend Setup

```bash
cd frontend
npm install
```

**View Frontend Logs:**
```bash
# Terminal shows live logs
# Including build output and request logs
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Viewing Server Logs

**Docker Deployment:**
```bash
# View all logs
docker-compose logs -f

# Backend logs only (shows MongoDB, MCP, and LLM messages)
docker-compose logs -f backend

# Frontend logs only
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend

# Logs from last 30 minutes
docker-compose logs --since 30m backend

# Save logs to file
docker-compose logs backend > backend-logs.txt
```

**Manual Deployment:**
```bash
# Backend logs appear in terminal where uvicorn is running
# Frontend logs appear in terminal where npm run dev is running

# Redirect logs to file (backend)
uvicorn app.main:app --reload --port 8000 > backend.log 2>&1 &

# Redirect logs to file (frontend)
npm run dev > frontend.log 2>&1 &

# View logs
tail -f backend.log
tail -f frontend.log
```

**Key Log Messages to Look For:**
```
Backend startup:
✅ Connected to MongoDB: ems_database
✅ OpenRouter API configured (Primary LLM)
🚀 Starting MCP Server from: /app/mcp-server
🔑 MONGO_URL: mongodb+srv://...
✅ MCP Server started successfully
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000

MCP Server startup (in backend logs):
🔌 Connecting to MongoDB...
✅ Connected to MongoDB database: ems_database
✅ Database indexes created successfully
EMS MCP Server running on stdio
```
Start frontend:
```bash
npm run dev
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📁 Project Structure

```
work-zen/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── database.py     # MongoDB connection
│   │   ├── main.py         # FastAPI app
│   │   ├── mcp_client.py   # MCP Client for stdio communication
│   │   ├── models/         # Pydantic models
│   │   └── routes/         # API endpoints
│   │       ├── employees.py
│   │       ├── job_data.py
│   │       ├── attendance.py
│   │       ├── leaves.py
│   │       ├── payroll.py
│   │       └── chat.py     # AI chat endpoint
│   ├── requirements.txt
│   └── .env
│
├── mcp-server/             # MCP Server (Node.js)
│   ├── index.js           # MCP server with 16 MongoDB tools
│   ├── database.js        # MongoDB connection
│   ├── package.json
│   └── .env
│
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── employees/            # Employee pages
│   │   │   ├── job-data/             # Job data pages
│   │   │   ├── attendance/           # Attendance pages
│   │   │   ├── leaves/               # Leave pages
│   │   │   ├── payroll/              # Payroll pages
│   │   │   ├── salary-structures/    # Salary pages
│   │   │   └── chat/                 # AI chat page
│   │   ├── components/               # Reusable components
│   │   └── services/                 # API services
│   ├── package.json
│   └── .env.local
│
├── ARCHITECTURE.md        # Detailed architecture docs
└── README.md             # This file
```

## 🔧 API Endpoints

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/{id}` - Get employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Job Data
- `GET /api/job-data` - List all job data
- `POST /api/job-data` - Create job data
- `GET /api/job-data/{id}` - Get job data
- `PUT /api/job-data/{id}` - Update job data
- `DELETE /api/job-data/{id}` - Delete job data

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Create attendance
- `GET /api/attendance/{id}` - Get attendance
- `PUT /api/attendance/{id}` - Update attendance
- `DELETE /api/attendance/{id}` - Delete attendance

### Leaves
- `GET /api/leaves` - List leave requests
- `POST /api/leaves` - Create leave request
- `GET /api/leaves/{id}` - Get leave
- `PUT /api/leaves/{id}` - Update leave
- `DELETE /api/leaves/{id}` - Delete leave

### Payroll
- `GET /api/payroll` - List payroll records
- `POST /api/payroll` - Create payroll
- `GET /api/payroll/{id}` - Get payroll
- `PUT /api/payroll/{id}` - Update payroll
- `DELETE /api/payroll/{id}` - Delete payroll

### AI Chat
- `POST /api/chat` - Chat with AI assistant

## 🤖 AI Chat Commands

The AI understands natural language (LLM-powered, no keywords needed!):

### Employee Queries
- "Show me all employees"
- "Find employees named John"
- "Who works in Colombo?"
- "Show shirantha's details"
- "Employees with A+ blood type"
- "Who is male and single?"

### Department & Location
- "List IT department staff"
- "Show engineers in the company"
- "Who works at Malabe?"

### Other Modules
- "Show attendance records"
- "List all leave requests"
- "Pending leave approvals"
- "Show payroll information"
- "Give me system stats"

## 🧠 Dual LLM Architecture

The system uses **TWO LLMs** for optimal performance:

### LLM #1: Intent Detection
- **Purpose**: Understands what the user wants
- **Input**: User query (e.g., "show shirantha city")
- **Output**: Tool selection + parameters
- **Temperature**: 0.3 (consistent, precise)
- **No fallback**: Pure AI intelligence, no regex patterns

### LLM #2: Response Generation  
- **Purpose**: Formats data into natural language
- **Input**: Raw MongoDB data from MCP
- **Output**: Beautiful, conversational response
- **Temperature**: 0.7 (natural, friendly)
- **Fallback**: Smart formatter if LLM unavailable

### LLM Providers (Priority Order)
1. **OpenRouter** (Primary) - More reliable, free tier
2. **HuggingFace** (Backup) - Free API with rate limits

**Model**: Mistral-7B-Instruct-v0.2

## 🔑 MCP Tools

The MCP Server provides 16 tools for database operations:

1. `list_employees` - Get all employees
2. `get_employee` - Get employee by ID
3. `search_employees` - Search employees
4. `list_job_data` - Get all job data
5. `get_job_data` - Get job data by employee
6. `list_attendance` - Get attendance records
7. `get_attendance` - Get attendance by employee
8. `list_leaves` - Get leave requests
9. `get_leave` - Get specific leave
10. `pending_leaves` - Get pending leaves
11. `get_leave_balance` - Get leave balance
12. `list_payroll` - Get payroll records
13. `get_payroll` - Get payroll by employee
14. `department_employees` - Get employees by department
15. `stats_summary` - Get system statistics
16. `search` - General search

## 🛠️ Technologies

### Frontend
- **Next.js** 14.0.4
- **React** 18.2.0
- **TypeScript** 5
- **TailwindCSS** 3.4.1

### Backend
- **FastAPI** 0.109.0
- **Motor** 3.3.2 (Async MongoDB)
- **PyMongo** 4.6.1
- **Python** 3.9+

### MCP Layer
- **@modelcontextprotocol/sdk** 0.5.0
- **Node.js** 18+
- **JSON-RPC 2.0** over stdio

### AI/LLM
- **OpenRouter API** (Primary - Free tier)
- **HuggingFace API** (Backup)
- **Mistral-7B-Instruct-v0.2**
- **LLM-Powered Intent Detection** (No regex fallback)

### Database
- **MongoDB Atlas**

## 📊 Database Schema

### employees
```javascript
{
  _id: ObjectId,
  employee_id: String,       // Unique employee ID (e.g., EM001)
  first_name: String,
  last_name: String,
  email: String,
  phone: String,
  date_of_birth: String,
  gender: String,
  marital_status: String,
  nationality: String,
  address: {
    street, city, state, postal_code, country
  },
  emergency_contact: {
    name, relationship, phone, email
  },
  hire_date: String,
  employment_status: String,  // active, inactive, terminated
  employment_type: String,    // full_time, part_time, contract
  national_id: String,
  passport_number: String,
  driving_license: String,
  profile_picture: String,
  blood_group: String,
  created_at: Date,
  updated_at: Date
}
```

### job_data
```javascript
{
  _id: ObjectId,
  employee_id: String,        // Reference to employee
  job_title: String,
  department: String,
  division: String,
  reporting_manager_id: String,
  work_location: String,
  work_phone: String,
  work_email: String,
  employee_grade: String,
  cost_center: String,
  probation_end_date: String,
  confirmation_date: String,
  notice_period_days: Number,
  created_at: Date,
  updated_at: Date
}
```

### attendance
```javascript
{
  _id: ObjectId,
  employee_id: String,
  date: String,
  clock_in: String,           // Time (HH:MM)
  clock_out: String,          // Time (HH:MM)
  work_hours: Number,
  status: String,             // present, absent, half_day, late
  break_hours: Number,
  overtime_hours: Number,
  notes: String,
  created_at: Date,
  updated_at: Date
}
```

### leaves
```javascript
{
  _id: ObjectId,
  employee_id: String,
  leave_type: String,         // sick, annual, personal, unpaid
  start_date: String,
  end_date: String,
  days: Number,
  reason: String,
  status: String,             // pending, approved, rejected, cancelled
  approved_by: String,
  approval_date: String,
  notes: String,
  created_at: Date,
  updated_at: Date
}
```

### payroll
```javascript
{
  _id: ObjectId,
  employee_id: String,
  pay_period_start: String,
  pay_period_end: String,
  basic_salary: Number,
  allowances: Number,
  deductions: Number,
  net_salary: Number,
  payment_date: String,
  payment_method: String,     // bank_transfer, cash, check
  tax_amount: Number,
  status: String,             // pending, paid, cancelled
  notes: String,
  created_at: Date,
  updated_at: Date
}
```

## 🧪 Testing

### Test Backend API
```bash
# Health check
curl http://localhost:8000/health

# List employees
curl http://localhost:8000/api/employees

# Get API documentation
open http://localhost:8000/docs
```

### Test AI Chat
```bash
# Test chat endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me all employees"}'
```

### Test MCP Communication
Check backend logs to see MCP Client ↔ MCP Server communication:
```bash
tail -f /tmp/backend.log | grep -E "(MCP|Calling|Received)"
```

## 🐛 Troubleshooting

### Docker Issues
```bash
# Check container logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart containers
docker-compose down
docker-compose up -d --build

# Clean rebuild
docker-compose down -v
docker system prune -af
docker-compose up -d --build
```

### Backend won't start
- Check Python version: `python3 --version` (should be 3.9+)
- Verify MongoDB connection string in `.env`
- Check environment variables: `MONGO_URL` and `MONGO_DB_NAME`
- Check if port 8000 is available: `lsof -i :8000`
- Kill existing process: `lsof -ti:8000 | xargs kill -9`

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Delete `node_modules` and `.next`, then run `npm install`
- Check if port 3000 is available: `lsof -i :3000`
- Kill existing process: `lsof -ti:3000 | xargs kill -9`

### MCP Server issues
- Check MCP Server logs in backend terminal (look for "🚀 Starting MCP Server")
- Verify Node.js is installed: `node --version`
- Check environment variables are passed: `MONGO_URL`, `MONGO_DB_NAME`
- Check backend logs for detailed error messages with stderr output
- Verify `mcp-server/index.js` exists and dependencies are installed

### AI Chat not responding
- **REQUIRED**: Set up at least one LLM API key in `.env`:
  - `OPENROUTER_API_KEY` (recommended - free tier available)
  - `HUGGINGFACE_API_KEY` (backup)
- Get OpenRouter key: [openrouter.ai](https://openrouter.ai/keys)
- Get HuggingFace key: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- Check backend logs for LLM errors
- Check for "✅ OpenRouter API configured" or "✅ HuggingFace API configured" message
- Without LLM keys, you'll see: "⚠️  WARNING: No LLM API keys configured!"

### MongoDB Connection Errors
- **Backend**: Verify `MONGO_URL` and `MONGO_DB_NAME` in backend `.env`
- **MCP Server**: Verify same variables in mcp-server `.env`
- Check MongoDB Atlas:
  - IP whitelist (add `0.0.0.0/0` for testing)
  - Database user credentials
  - Network access settings
- Test connection string with MongoDB Compass
- Look for "Connected to MongoDB: ems_database" in logs

## 🔒 Security Notes

- Never commit `.env` files to version control
- Keep MongoDB credentials secure
- Rotate HuggingFace API keys regularly
- Use environment variables for all sensitive data
- In production, use proper authentication and authorization

## 📚 Additional Documentation

- [AWS EC2 Deployment Guide](AWS_EC2_DEPLOYMENT.md) - Deploy to AWS EC2
- [Docker Setup Guide](DOCKER_SETUP.md) - Detailed Docker instructions
- [Deployment Quick Start](DEPLOYMENT_QUICK_START.md) - Fast deployment guide
- [API Documentation](http://localhost:8000/docs) - Interactive API docs (when running)

## 🚀 Deployment

### Docker Deployment (Recommended)

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed instructions.

```bash
# Quick deploy with Docker
docker-compose up -d --build
```

### AWS EC2 Deployment

See [AWS_EC2_DEPLOYMENT.md](AWS_EC2_DEPLOYMENT.md) for step-by-step guide.

Key steps:
1. Launch EC2 instance (Ubuntu 22.04)
2. Install Docker and Docker Compose
3. Configure security groups (ports 3000, 8000, 80, 443)
4. Clone repository and set up `.env`
5. Run with Docker Compose
6. Configure domain and SSL (optional)

### CI/CD with Jenkins

Automated deployment pipeline using Jenkins. See [JENKINS_SETUP.md](JENKINS_SETUP.md) for complete setup guide.

**Pipeline Features:**
- ✅ Automated testing on commit
- ✅ Docker image building and pushing
- ✅ Automated deployment to EC2
- ✅ Health checks and rollback
- ✅ GitHub webhook integration

**Quick Jenkins Setup:**
```bash
# Install Jenkins
# See JENKINS_SETUP.md for detailed instructions

# The Jenkinsfile in the root handles:
# 1. Code checkout
# 2. Testing (backend & frontend)
# 3. Docker image building
# 4. Push to Docker Hub
# 5. Deploy to EC2
# 6. Health checks
```

### Environment Variables

Ensure these are set in your `.env` file:
```env
# MongoDB
MONGO_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/
MONGO_DB_NAME=ems_database

# LLM APIs (at least one required)
OPENROUTER_API_KEY=sk-or-v1-...
HUGGINGFACE_API_KEY=hf_...

# Frontend URL (for CORS)
FRONTEND_URL=http://your-domain.com:3000

# API URL for frontend
NEXT_PUBLIC_API_URL=http://your-domain.com:8000
```

## 📝 License

MIT License

## 👥 Contributors

- Shirantha Dissanayake

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
- [HuggingFace](https://huggingface.co) for LLM API
- [FastAPI](https://fastapi.tiangolo.com) framework
- [Next.js](https://nextjs.org) team
- [MongoDB](https://mongodb.com) for the database

## 📧 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ using FastAPI, Next.js, and Model Context Protocol**

<!-- CI/CD Pipeline Test -->

<!-- CI/CD Full Pipeline Test - Deployment Enabled -->


