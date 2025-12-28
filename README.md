# Employee Management System (EMS)

A comprehensive, full-stack Employee Management System with AI-powered chat interface, built with modern technologies and following the Model Context Protocol (MCP) architecture.

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
- **Optimized Joins**: MongoDB aggregation pipeline with `$lookup` for efficient data retrieval
- **Dual Join Strategies**: Application-level and database-level joins
- **62+ Filter Parameters**: Comprehensive filtering across all collections
- See [FOREIGN_KEYS_AND_JOINS.md](FOREIGN_KEYS_AND_JOINS.md) for details

## 🏗️ Architecture

```
User → Next.js → FastAPI → LLM Intent Detection → MCP Client → stdio → MCP Server → MongoDB
                            ↑                                                           ↓
                      OpenRouter/HF                                                  Data
                            ↑                                                           ↓
                   LLM Response Generation ←────────────────────────────────────────┘
```

**See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.**

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

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed Docker instructions.**

**For AWS EC2 deployment, see [AWS_EC2_DEPLOYMENT.md](AWS_EC2_DEPLOYMENT.md).**

### Option 2: Manual Setup

### Prerequisites
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
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ems_database
```

**Note**: MCP Server is automatically started by the FastAPI backend, no manual start needed.

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
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

### Backend won't start
- Check Python version: `python3 --version` (should be 3.9+)
- Check MongoDB connection in `.env`
- Check if port 8000 is available: `lsof -i :8000`
- Kill existing process: `lsof -ti:8000 | xargs kill -9`

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Delete `node_modules` and `.next`, then run `npm install`
- Check if port 3000 is available: `lsof -i :3000`
- Kill existing process: `lsof -ti:3000 | xargs kill -9`

### MCP Server issues
- Check MCP Server logs in backend terminal
- Verify Node.js is installed: `node --version`
- Check `mcp-server/.env` configuration
- Verify `mcp-server/index.js` exists

### AI Chat not responding
- **REQUIRED**: Set up at least one LLM API key in `backend/.env`:
  - `OPENROUTER_API_KEY` (recommended - free tier available)
  - `HUGGINGFACE_API_KEY` (backup)
- Get OpenRouter key: [openrouter.ai](https://openrouter.ai/keys)
- Get HuggingFace key: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- Check backend logs for LLM errors: `tail -f /tmp/backend.log | grep "LLM"`
- Test MCP Server is running: Check backend startup logs for "MCP Server process started"
- Without LLM keys, chat will return: "Sorry, I'm having trouble understanding your request"

### Database connection issues
- Verify MongoDB Atlas connection string in `.env` files
- Check if IP is whitelisted in MongoDB Atlas
- Test connection: Use MongoDB Compass with the connection string

## 🔒 Security Notes

- Never commit `.env` files to version control
- Keep MongoDB credentials secure
- Rotate HuggingFace API keys regularly
- Use environment variables for all sensitive data
- In production, use proper authentication and authorization

## 📚 Additional Documentation

- [Architecture Documentation](ARCHITECTURE.md) - Detailed system architecture
- [API Documentation](http://localhost:8000/docs) - Interactive API docs (when running)

## 🚀 Deployment

### Backend (Example with Docker)
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app/ ./app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend (Example with Vercel)
```bash
cd frontend
vercel deploy
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
