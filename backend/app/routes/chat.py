from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import os
from dotenv import load_dotenv
import json
import re
from ..mcp_client import mcp_client

load_dotenv()

router = APIRouter(prefix="/api/chat", tags=["chat"])

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
HUGGINGFACE_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")  # Alternative LLM API
OPENROUTER_MODEL = "openai/gpt-oss-20b:free"  # Free model

# Define ALL available MCP tools for the LLM (Full Access)
MCP_TOOLS = [
    # Employee Management (3 tools)
    {
        "name": "list_employees",
        "description": "Get list of all employees with optional filters. Use for 'show employees', 'list staff', 'all workers', 'active employees', 'full time employees', 'contract workers', etc.",
        "parameters": {
            "limit": "number (optional, default 50)",
            "status": "string (filter by employment_status: active/inactive/terminated)",
            "employment_type": "string (filter by type: full_time/part_time/contract/intern/temporary)"
        }
    },
    {
        "name": "search_employees",
        "description": "Smart search across ALL employee fields including: name (first_name, last_name), email, phone, employee_id, address (city, state, country), department, job_title, blood_group, gender, marital_status, nationality, division, work_location. Use for ANY specific employee query like 'find John', 'who is in Colombo', 'A+ blood type', 'male employees', 'IT department', 'single employees', 'engineers', 'managers'",
        "parameters": {"query": "string (any search term - searches across personal info, location, job data, demographics)"}
    },
    {
        "name": "get_employee",
        "description": "Get specific employee by ID or employee_id. Use when exact employee_id is mentioned like 'EM001' or MongoDB ObjectId",
        "parameters": {"identifier": "string (employee_id like EM001 or MongoDB _id)"}
    },
    
    # Attendance Management (2 tools)
    {
        "name": "list_attendance",
        "description": "Get attendance records with comprehensive filters. Use for 'show attendance', 'who came today', 'attendance records', 'absent employees', 'late employees', 'work from home', 'overtime hours'",
        "parameters": {
            "limit": "number (optional)",
            "employee_id": "string (filter by specific employee)",
            "status": "string (filter by: present/absent/late/half_day/work_from_home)",
            "date": "string (specific date: YYYY-MM-DD)",
            "date_from": "string (filter from date: YYYY-MM-DD)",
            "date_to": "string (filter to date: YYYY-MM-DD)",
            "clock_in": "string (filter by clock-in time)",
            "clock_out": "string (filter by clock-out time)",
            "work_hours_min": "number (minimum work hours)",
            "work_hours_max": "number (maximum work hours)",
            "overtime_hours_min": "number (minimum overtime hours)",
            "notes": "string (search in notes/remarks)"
        }
    },
    {
        "name": "get_attendance",
        "description": "Get specific attendance record by ID",
        "parameters": {"attendance_id": "string (MongoDB ObjectId)"}
    },
    
    # Leave Management (4 tools)
    {
        "name": "list_leaves",
        "description": "Get leave requests with comprehensive filters. Use for 'show leaves', 'leave requests', 'who is on leave', 'vacation days', 'pending leaves', 'approved leaves', 'sick leaves', 'long leaves', 'leaves approved by manager'",
        "parameters": {
            "limit": "number (optional)",
            "employee_id": "string (filter by specific employee)",
            "status": "string (filter by: pending/approved/rejected/cancelled)",
            "leave_type": "string (filter by: annual/sick/maternity/paternity/unpaid/personal)",
            "start_date_from": "string (leave starts from date: YYYY-MM-DD)",
            "start_date_to": "string (leave starts before date: YYYY-MM-DD)",
            "end_date_from": "string (leave ends from date: YYYY-MM-DD)",
            "end_date_to": "string (leave ends before date: YYYY-MM-DD)",
            "days_min": "number (minimum number of leave days)",
            "days_max": "number (maximum number of leave days)",
            "reason": "string (search in leave reason)",
            "approved_by": "string (filter by approver ID)",
            "rejected_by": "string (filter by rejecter ID)",
            "comments": "string (search in comments)"
        }
    },
    {
        "name": "get_leave",
        "description": "Get specific leave request by ID",
        "parameters": {"leave_id": "string (MongoDB ObjectId)"}
    },
    {
        "name": "list_leave_balances",
        "description": "Get leave balance information for all employees. Use for 'leave balances', 'remaining leaves', 'vacation days left'",
        "parameters": {"limit": "number (optional)"}
    },
    {
        "name": "get_leave_balance",
        "description": "Get leave balance for specific employee",
        "parameters": {"employee_id": "string"}
    },
    
    # Payroll & Salary (3 tools)
    {
        "name": "list_salary_structures",
        "description": "Get salary structure information with filters. Use for 'salary structures', 'pay grades', 'compensation levels', 'active salaries'",
        "parameters": {
            "limit": "number (optional)",
            "employee_id": "string (filter by specific employee)",
            "is_active": "boolean (filter by active status: true/false)"
        }
    },
    {
        "name": "list_payroll",
        "description": "Get payroll records with comprehensive filters. Use for 'show payroll', 'salary payments', 'payment records', 'wages', 'pending payments', 'processed payroll', 'high salary employees', 'bank transfers'",
        "parameters": {
            "limit": "number (optional)",
            "employee_id": "string (filter by specific employee)",
            "status": "string (filter by: pending/processed/paid/failed)",
            "pay_period_start_from": "string (pay period starts from: YYYY-MM-DD)",
            "pay_period_start_to": "string (pay period starts before: YYYY-MM-DD)",
            "pay_period_end_from": "string (pay period ends from: YYYY-MM-DD)",
            "pay_period_end_to": "string (pay period ends before: YYYY-MM-DD)",
            "payment_date_from": "string (payment date from: YYYY-MM-DD)",
            "payment_date_to": "string (payment date before: YYYY-MM-DD)",
            "basic_salary_min": "number (minimum basic salary)",
            "basic_salary_max": "number (maximum basic salary)",
            "net_salary_min": "number (minimum net salary)",
            "net_salary_max": "number (maximum net salary)",
            "gross_salary_min": "number (minimum gross salary)",
            "gross_salary_max": "number (maximum gross salary)",
            "payment_method": "string (filter by: bank_transfer/cash/cheque)",
            "bank_name": "string (filter by bank name)",
            "account_number": "string (filter by account number)"
        }
    },
    {
        "name": "get_payroll",
        "description": "Get specific payroll record by ID",
        "parameters": {"payroll_id": "string (MongoDB ObjectId)"}
    },
    
    # Job Data (3 tools)
    {
        "name": "list_job_data",
        "description": "Get job/organizational data with comprehensive filters. Use for 'job titles', 'departments', 'organizational structure', 'reporting managers', 'employees in IT department', 'engineers', 'managers in Colombo office', 'senior level employees', 'night shift workers', 'recently joined employees'",
        "parameters": {
            "limit": "number (optional)",
            "employee_id": "string (filter by specific employee)",
            "department": "string (filter by department: IT, HR, Finance, Sales, etc.)",
            "division": "string (filter by division)",
            "team": "string (filter by team name)",
            "job_title": "string (filter by job title: Engineer, Manager, Analyst, etc.)",
            "job_level": "string (filter by job level: Junior, Mid, Senior, Lead, etc.)",
            "job_grade": "string (filter by job grade)",
            "work_location": "string (filter by work location/office)",
            "office_location": "string (filter by office location)",
            "reporting_manager": "string (filter by manager ID)",
            "reporting_manager_name": "string (filter by manager name)",
            "employment_type": "string (filter by: full_time/part_time/contract)",
            "work_shift": "string (filter by shift: day/night/rotational)",
            "join_date_from": "string (joined from date: YYYY-MM-DD)",
            "join_date_to": "string (joined before date: YYYY-MM-DD)",
            "probation_end_date_from": "string (probation ends from: YYYY-MM-DD)",
            "probation_end_date_to": "string (probation ends before: YYYY-MM-DD)",
            "is_active": "boolean (filter by active status: true/false)",
            "work_email": "string (filter by work email)"
        }
    },
    {
        "name": "search_job_data",
        "description": "Search job data by department, job title, or division. Use for 'who works in IT', 'engineers', 'managers'",
        "parameters": {"query": "string (department, job title, or division)"}
    },
    {
        "name": "get_job_data",
        "description": "Get job data for specific employee",
        "parameters": {"employee_id": "string"}
    },
    
    # Export Tool (1 tool)
    {
        "name": "export_to_csv",
        "description": "Export data to CSV format. Use when user asks to 'export', 'download', or wants 'CSV format'",
        "parameters": {"collection": "string (employees/attendance/leaves/payroll/job_data)", "query": "object (optional filter)"}
    },
    
    # Comprehensive Employee Data (1 tool - JOINS ALL TABLES)
    {
        "name": "get_employee_complete",
        "description": "Get COMPLETE employee profile with data from ALL collections: personal info + job/organization data + recent attendance summary (30 days) + leave balance & requests + latest payroll info. Use for 'show complete profile', 'full employee details', 'employee overview', 'comprehensive info for [name/ID]'",
        "parameters": {
            "employee_id": "string (required: Employee ID like EM001)",
            "include_attendance": "boolean (include attendance summary, default: true)",
            "include_leaves": "boolean (include leave info, default: true)",
            "include_payroll": "boolean (include payroll info, default: true)",
            "include_job_data": "boolean (include job data, default: true)"
        }
    },
    
    # Optimized Multi-Employee Join (uses MongoDB $lookup - FAST!)
    {
        "name": "list_employees_with_relations",
        "description": "List MULTIPLE employees with ALL related data using optimized MongoDB aggregation pipeline (foreign key joins with $lookup). Much faster than separate queries. Returns employees with job data, attendance summary, leave balance, and latest payroll. Use for 'show all employees with details', 'list staff with attendance', 'employees with complete info'",
        "parameters": {
            "status": "string (filter by employment status)",
            "department": "string (filter by department)",
            "limit": "number (max results, default: 20)",
            "include_attendance_summary": "boolean (include attendance summary, default: true)",
            "include_leave_balance": "boolean (include leave balance, default: true)",
            "include_latest_payroll": "boolean (include latest payroll, default: true)"
        }
    }
]

async def llm_intent_detection(user_message: str) -> Optional[Dict[str, Any]]:
    """
    LLM-powered intent detection - uses AI to understand user intent.
    Returns tool name and parameters, or None if LLM unavailable.
    """
    
    # Create prompt for intent detection
    tools_description = "\n".join([
        f"- {tool['name']}: {tool['description']}" 
        for tool in MCP_TOOLS
    ])
    
    prompt = f"""<s>[INST] You are an intent detection system for an Employee Management System.

Available tools:
{tools_description}

User query: "{user_message}"

FILTERING INSTRUCTIONS:
1. Use list_* tools with filters when user specifies status, type, category, dates, or numeric ranges
2. Use search_* tools when user mentions specific names, locations, or general search terms
3. Extract ALL filter values from the query (status, dates, amounts, names, locations, etc.)
4. Support range filters (min/max) for numeric values (salary, hours, days)
5. Support date range filters (from/to) for all date fields

Analyze the user's intent and respond with ONLY a JSON object in this exact format:
{{
  "tool": "tool_name",
  "parameters": {{"param": "value"}},
  "reasoning": "why you chose this tool"
}}

Examples - EMPLOYEES:
- "Show all employees" → {{"tool": "list_employees", "parameters": {{"limit": 50}}}}
- "List active employees" → {{"tool": "list_employees", "parameters": {{"status": "active", "limit": 50}}}}
- "Show full time employees" → {{"tool": "list_employees", "parameters": {{"employment_type": "full_time", "limit": 50}}}}
- "Find John" → {{"tool": "search_employees", "parameters": {{"query": "john"}}}}
- "Employees in IT" → {{"tool": "search_employees", "parameters": {{"query": "IT"}}}}

Examples - LEAVES:
- "Show pending leaves" → {{"tool": "list_leaves", "parameters": {{"status": "pending", "limit": 50}}}}
- "Sick leave requests" → {{"tool": "list_leaves", "parameters": {{"leave_type": "sick", "limit": 50}}}}
- "Leaves more than 5 days" → {{"tool": "list_leaves", "parameters": {{"days_min": 5, "limit": 50}}}}
- "Approved annual leaves" → {{"tool": "list_leaves", "parameters": {{"status": "approved", "leave_type": "annual", "limit": 50}}}}

Examples - ATTENDANCE:
- "Present employees today" → {{"tool": "list_attendance", "parameters": {{"status": "present", "limit": 50}}}}
- "Absent employees" → {{"tool": "list_attendance", "parameters": {{"status": "absent", "limit": 50}}}}
- "Employees with overtime" → {{"tool": "list_attendance", "parameters": {{"overtime_hours_min": 1, "limit": 50}}}}
- "Work from home employees" → {{"tool": "list_attendance", "parameters": {{"status": "work_from_home", "limit": 50}}}}

Examples - JOB DATA:
- "IT department employees" → {{"tool": "list_job_data", "parameters": {{"department": "IT", "limit": 50}}}}
- "Show engineers" → {{"tool": "list_job_data", "parameters": {{"job_title": "engineer", "limit": 50}}}}
- "Senior level employees" → {{"tool": "list_job_data", "parameters": {{"job_level": "senior", "limit": 50}}}}
- "Night shift workers" → {{"tool": "list_job_data", "parameters": {{"work_shift": "night", "limit": 50}}}}
- "Employees in Colombo office" → {{"tool": "list_job_data", "parameters": {{"work_location": "colombo", "limit": 50}}}}

Examples - PAYROLL:
- "Pending payroll" → {{"tool": "list_payroll", "parameters": {{"status": "pending", "limit": 50}}}}
- "High salary employees" → {{"tool": "list_payroll", "parameters": {{"net_salary_min": 100000, "limit": 50}}}}
- "Bank transfer payments" → {{"tool": "list_payroll", "parameters": {{"payment_method": "bank_transfer", "limit": 50}}}}
- "Salaries above 50000" → {{"tool": "list_payroll", "parameters": {{"net_salary_min": 50000, "limit": 50}}}}

Examples - COMPREHENSIVE (ALL TABLES JOINED):
- "Show complete profile for EM001" → {{"tool": "get_employee_complete", "parameters": {{"employee_id": "EM001"}}}}
- "Full details of employee EM005" → {{"tool": "get_employee_complete", "parameters": {{"employee_id": "EM005"}}}}
- "Complete information for John" → First search for John to get ID, then use get_employee_complete
- "Employee overview with all data" → {{"tool": "get_employee_complete", "parameters": {{"employee_id": "EM001"}}}}
- "List all active employees with details" → {{"tool": "list_employees_with_relations", "parameters": {{"status": "Active", "limit": 20}}}}
- "Show IT dept employees with complete info" → {{"tool": "list_employees_with_relations", "parameters": {{"department": "IT", "limit": 20}}}}

Respond with JSON only, no other text: [/INST]"""
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:  # Increased timeout to 30 seconds
            
            # Try OpenRouter first (best for structured output)
            if OPENROUTER_API_KEY:
                try:
                    response = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": "http://localhost:3000",
                            "X-Title": "Work-Zen EMS Intent Detection"
                        },
                        json={
                            "model": OPENROUTER_MODEL,
                            "messages": [
                                {"role": "user", "content": prompt}
                            ],
                            "max_tokens": 150,
                            "temperature": 0.3  # Lower for more consistent output
                        }
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if "choices" in result and len(result["choices"]) > 0:
                            content = result["choices"][0]["message"]["content"].strip()
                            # Extract JSON from response
                            import re
                            json_match = re.search(r'\{.*\}', content, re.DOTALL)
                            if json_match:
                                intent_data = json.loads(json_match.group())
                                print(f"🤖 LLM Intent Detection: {intent_data}")
                                return {
                                    "tool": intent_data.get("tool"),
                                    "parameters": intent_data.get("parameters", {})
                                }
                            else:
                                print(f"⚠️  OpenRouter returned non-JSON response: {content[:200]}")
                        else:
                            print(f"⚠️  OpenRouter response missing choices: {result}")
                    else:
                        print(f"❌ OpenRouter API error {response.status_code}: {response.text[:200]}")
                except json.JSONDecodeError as e:
                    print(f"❌ OpenRouter JSON decode error: {e}")
                except httpx.TimeoutException as e:
                    print(f"❌ OpenRouter timeout: {e}")
                except Exception as e:
                    print(f"❌ OpenRouter intent detection error: {e}")
            
            # Try HuggingFace as backup
            if HUGGINGFACE_API_KEY:
                try:
                    # Use HuggingFace OpenAI-compatible chat completions endpoint
                    response = await client.post(
                        "https://router.huggingface.co/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "Qwen/Qwen2.5-Coder-32B-Instruct",
                            "messages": [
                                {"role": "user", "content": prompt}
                            ],
                            "temperature": 0.3,
                            "max_tokens": 150
                        }
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                        
                        if text:
                            import re
                            json_match = re.search(r'\{.*\}', text, re.DOTALL)
                            if json_match:
                                intent_data = json.loads(json_match.group())
                                print(f"🤖 LLM Intent Detection (HF): {intent_data}")
                                return {
                                    "tool": intent_data.get("tool"),
                                    "parameters": intent_data.get("parameters", {})
                                }
                            else:
                                print(f"⚠️  HuggingFace returned non-JSON: {text[:200]}")
                        else:
                            print(f"⚠️  HuggingFace returned empty text")
                    else:
                        print(f"❌ HuggingFace API error {response.status_code}: {response.text[:200]}")
                except json.JSONDecodeError as e:
                    print(f"❌ HuggingFace JSON decode error: {e}")
                except httpx.TimeoutException as e:
                    print(f"❌ HuggingFace timeout: {e}")
                except Exception as e:
                    print(f"❌ HuggingFace intent detection error: {e}")
                    
    except Exception as e:
        print(f"LLM intent detection failed: {e}")
    
    return None


def regex_intent_detection(user_message: str) -> Dict[str, Any]:
    """
    Fallback intent detection using regex patterns.
    Used when LLM is unavailable or fails.
    """
    message_lower = user_message.lower()
    import re
    
    # Attendance queries - check first
    if any(word in message_lower for word in ["attendance", "present", "absent", "clock", "came today", "checked in"]):
        return {"tool": "list_attendance", "parameters": {"limit": 50}}
    
    # Leave queries
    if any(word in message_lower for word in ["leave", "vacation", "time off", "pto", "holiday", "day off"]):
        return {"tool": "list_leaves", "parameters": {"limit": 50}}
    
    # Payroll queries
    if any(word in message_lower for word in ["payroll", "salary", "payment", "compensation", "pay"]):
        return {"tool": "list_payroll", "parameters": {"limit": 50}}
    
    # Stats/Overview queries
    if any(word in message_lower for word in ["stats", "summary", "overview", "dashboard", "report"]):
        return {"tool": "stats_summary", "parameters": {}}
    
    # Blood type queries - HIGH PRIORITY (before generic patterns)
    # Check for blood-related keywords or blood type patterns
    blood_pattern = r'(a\+|a-|b\+|b-|o\+|o-|ab\+|ab-|a \+|a -|b \+|b -|o \+|o -|ab \+|ab -)'
    blood_match = re.search(blood_pattern, message_lower)
    
    if blood_match or "blood" in message_lower:
        if blood_match:
            blood_type = blood_match.group(1).replace(" ", "")  # Remove spaces
            print(f"  🩸 Blood type detected: {blood_type}")
            return {"tool": "search_employees", "parameters": {"query": blood_type}}
        return {"tool": "search_employees", "parameters": {"query": "blood"}}
    
    # Location-based - "in [location]", "at [location]" (before name search)
    location_patterns = [
        (r'\bin\s+(\w+)', 'in'),
        (r'\bat\s+(\w+)', 'at'),
        (r'\bfrom\s+(\w+)', 'from'),
        (r'\bworking\s+in\s+(\w+)', 'working in'),
        (r'\bbased\s+in\s+(\w+)', 'based in'),
    ]
    
    for pattern, _ in location_patterns:
        match = re.search(pattern, message_lower)
        if match:
            location = match.group(1)
            if location not in ["the", "a", "an", "employee", "staff", "worker"]:
                print(f"  📍 Location detected: {location}")
                return {"tool": "search_employees", "parameters": {"query": location}}
    
    # Check for "show all" or "list all" - explicit list requests FIRST
    # IMPORTANT: Only use list_employees for pure "list all" with NO filters
    # Use word boundaries to avoid false matches like "show shirantha" matching "show all"
    all_patterns = [r'\ball\s+employees\b', r'\ball\s+staff\b', r'\blist\s+all\b', r'\bshow\s+all\b', r'\beveryone\b', r'\beverybody\b']
    has_all_keyword = any(re.search(pattern, message_lower) for pattern in all_patterns)
    
    if has_all_keyword:
        # Check if there are filtering terms after "all"
        words_after_all = message_lower.split("all", 1)
        if len(words_after_all) > 1:
            remaining = words_after_all[1].strip()
            # Remove generic words
            remaining_words = [w for w in remaining.split() if w not in ["employees", "staff", "workers", "people", "active"]]
            # If there are specific words after "all", it's a filter query - use search
            if remaining_words:
                return {"tool": "search_employees", "parameters": {"query": " ".join(remaining_words[:3])}}
        # Pure "list all" with no filters
        print("  📋 List all detected (no filters)")
        return {"tool": "list_employees", "parameters": {"limit": 50}}
    
    # Name-based search - "find [name]", "search [name]", "who is [name]", "show [name]"
    search_triggers = ["find", "search", "lookup", "who is", "who has", "show"]
    for trigger in search_triggers:
        if trigger in message_lower:
            parts = message_lower.split(trigger, 1)
            if len(parts) > 1:
                search_text = parts[-1].strip()
                search_words = search_text.split()
                # Remove filler words
                search_words = [w for w in search_words if w not in ["employee", "employees", "staff", "worker", "person", "the", "a", "an"]]
                if search_words:
                    search_query = " ".join(search_words[:3])
                    print(f"  🔍 Search trigger '{trigger}' detected: {search_query}")
                    return {"tool": "search_employees", "parameters": {"query": search_query}}
    
    # Department/job queries
    dept_keywords = ["department", "dept", "engineer", "manager", "developer", "designer", "analyst"]
    for keyword in dept_keywords:
        if keyword in message_lower:
            # Extract department name or use keyword
            words = message_lower.split()
            for i, word in enumerate(words):
                if word == keyword and i + 1 < len(words):
                    return {"tool": "search_employees", "parameters": {"query": words[i+1]}}
            return {"tool": "search_employees", "parameters": {"query": keyword}}
    
    # IT/HR specific (short dept codes)
    if re.search(r'\bit\b', message_lower):
        return {"tool": "search_employees", "parameters": {"query": "it"}}
    if re.search(r'\bhr\b', message_lower):
        return {"tool": "search_employees", "parameters": {"query": "hr"}}
    
    # Gender/marital queries
    if any(word in message_lower for word in ["male", "female", "married", "single", "gender"]):
        for word in ["male", "female", "married", "single"]:
            if word in message_lower:
                return {"tool": "search_employees", "parameters": {"query": word}}
    
    # Nationality queries
    if any(word in message_lower for word in ["nationality", "citizen", "country of origin"]):
        words = message_lower.split()
        filtered = [w for w in words if w not in ["show", "get", "display", "the", "nationality", "citizen"]]
        if filtered:
            return {"tool": "search_employees", "parameters": {"query": " ".join(filtered[:2])}}
    
    # Default: ANY query with specific terms should use search_employees
    # Remove common command words
    words = message_lower.split()
    filtered_words = [w for w in words if w not in ["show", "get", "display", "give", "me", "the", "list", "employee", "employees", "staff"]]
    
    # If we have ANY specific terms, use search_employees (prefer searching over listing)
    if len(filtered_words) >= 1:
        search_query = " ".join(filtered_words[:3])
        return {"tool": "search_employees", "parameters": {"query": search_query}}
    
    # Absolute final fallback: list all employees (only if truly no searchable content)
    return {"tool": "list_employees", "parameters": {"limit": 50}}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    data: Optional[dict] = None


async def execute_mcp_tool(tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute the MCP tool that LLM selected with full filter support.
    Returns structured data from MongoDB via MCP Server.
    """
    try:
        # Map tool name to mcp_client method with filter parameters
        if tool_name == "list_employees":
            # Support filtering by status and employment_type
            filter_params = {
                "limit": parameters.get("limit", 50)
            }
            if parameters.get("status"):
                filter_params["status"] = parameters["status"]
            if parameters.get("employment_type"):
                filter_params["employment_type"] = parameters["employment_type"]
            
            result = await mcp_client.call_tool("list_employees", filter_params)
            
        elif tool_name == "search_employees":
            query = parameters.get("query", "")
            result = await mcp_client.search_employees(query)
            
        elif tool_name == "get_employee":
            identifier = parameters.get("identifier", parameters.get("employee_id", ""))
            result = await mcp_client.call_tool("get_employee", {"identifier": identifier})
            
        elif tool_name == "list_attendance":
            # Support comprehensive filtering for attendance
            filter_params = {"limit": parameters.get("limit", 50)}
            
            # Basic filters
            if parameters.get("employee_id"):
                filter_params["employee_id"] = parameters["employee_id"]
            if parameters.get("status"):
                filter_params["status"] = parameters["status"]
            
            # Date filters
            if parameters.get("date"):
                filter_params["date"] = parameters["date"]
            if parameters.get("date_from"):
                filter_params["date_from"] = parameters["date_from"]
            if parameters.get("date_to"):
                filter_params["date_to"] = parameters["date_to"]
            
            # Time filters
            if parameters.get("clock_in"):
                filter_params["clock_in"] = parameters["clock_in"]
            if parameters.get("clock_out"):
                filter_params["clock_out"] = parameters["clock_out"]
            
            # Work hours filters
            if parameters.get("work_hours_min"):
                filter_params["work_hours_min"] = parameters["work_hours_min"]
            if parameters.get("work_hours_max"):
                filter_params["work_hours_max"] = parameters["work_hours_max"]
            if parameters.get("overtime_hours_min"):
                filter_params["overtime_hours_min"] = parameters["overtime_hours_min"]
            
            # Notes filter
            if parameters.get("notes"):
                filter_params["notes"] = parameters["notes"]
            
            result = await mcp_client.call_tool("list_attendance", filter_params)
            
        elif tool_name == "list_leaves":
            # Support comprehensive filtering for leaves
            filter_params = {"limit": parameters.get("limit", 50)}
            
            # Basic filters
            if parameters.get("employee_id"):
                filter_params["employee_id"] = parameters["employee_id"]
            if parameters.get("status"):
                filter_params["status"] = parameters["status"]
            if parameters.get("leave_type"):
                filter_params["leave_type"] = parameters["leave_type"]
            
            # Date range filters
            if parameters.get("start_date_from"):
                filter_params["start_date_from"] = parameters["start_date_from"]
            if parameters.get("start_date_to"):
                filter_params["start_date_to"] = parameters["start_date_to"]
            if parameters.get("end_date_from"):
                filter_params["end_date_from"] = parameters["end_date_from"]
            if parameters.get("end_date_to"):
                filter_params["end_date_to"] = parameters["end_date_to"]
            
            # Days filters
            if parameters.get("days_min"):
                filter_params["days_min"] = parameters["days_min"]
            if parameters.get("days_max"):
                filter_params["days_max"] = parameters["days_max"]
            
            # Text search filters
            if parameters.get("reason"):
                filter_params["reason"] = parameters["reason"]
            if parameters.get("comments"):
                filter_params["comments"] = parameters["comments"]
            
            # Approver filters
            if parameters.get("approved_by"):
                filter_params["approved_by"] = parameters["approved_by"]
            if parameters.get("rejected_by"):
                filter_params["rejected_by"] = parameters["rejected_by"]
            
            result = await mcp_client.call_tool("list_leaves", filter_params)
            
        elif tool_name == "list_salary_structures":
            # Support filtering by employee_id, is_active
            filter_params = {
                "limit": parameters.get("limit", 50)
            }
            if parameters.get("employee_id"):
                filter_params["employee_id"] = parameters["employee_id"]
            if "is_active" in parameters:
                filter_params["is_active"] = parameters["is_active"]
            
            result = await mcp_client.call_tool("list_salary_structures", filter_params)
            
        elif tool_name == "list_payroll":
            # Support comprehensive filtering for payroll
            filter_params = {"limit": parameters.get("limit", 50)}
            
            # Basic filters
            if parameters.get("employee_id"):
                filter_params["employee_id"] = parameters["employee_id"]
            if parameters.get("status"):
                filter_params["status"] = parameters["status"]
            
            # Pay period filters
            if parameters.get("pay_period_start_from"):
                filter_params["pay_period_start_from"] = parameters["pay_period_start_from"]
            if parameters.get("pay_period_start_to"):
                filter_params["pay_period_start_to"] = parameters["pay_period_start_to"]
            if parameters.get("pay_period_end_from"):
                filter_params["pay_period_end_from"] = parameters["pay_period_end_from"]
            if parameters.get("pay_period_end_to"):
                filter_params["pay_period_end_to"] = parameters["pay_period_end_to"]
            
            # Payment date filters
            if parameters.get("payment_date_from"):
                filter_params["payment_date_from"] = parameters["payment_date_from"]
            if parameters.get("payment_date_to"):
                filter_params["payment_date_to"] = parameters["payment_date_to"]
            
            # Salary amount filters
            if parameters.get("basic_salary_min"):
                filter_params["basic_salary_min"] = parameters["basic_salary_min"]
            if parameters.get("basic_salary_max"):
                filter_params["basic_salary_max"] = parameters["basic_salary_max"]
            if parameters.get("net_salary_min"):
                filter_params["net_salary_min"] = parameters["net_salary_min"]
            if parameters.get("net_salary_max"):
                filter_params["net_salary_max"] = parameters["net_salary_max"]
            if parameters.get("gross_salary_min"):
                filter_params["gross_salary_min"] = parameters["gross_salary_min"]
            if parameters.get("gross_salary_max"):
                filter_params["gross_salary_max"] = parameters["gross_salary_max"]
            
            # Payment method filters
            if parameters.get("payment_method"):
                filter_params["payment_method"] = parameters["payment_method"]
            if parameters.get("bank_name"):
                filter_params["bank_name"] = parameters["bank_name"]
            if parameters.get("account_number"):
                filter_params["account_number"] = parameters["account_number"]
            
            result = await mcp_client.call_tool("list_payroll", filter_params)
            
        elif tool_name == "list_job_data":
            # Support comprehensive filtering for job data
            filter_params = {"limit": parameters.get("limit", 50)}
            
            # Employee ID filter
            if parameters.get("employee_id"):
                filter_params["employee_id"] = parameters["employee_id"]
            
            # Organizational structure filters
            if parameters.get("department"):
                filter_params["department"] = parameters["department"]
            if parameters.get("division"):
                filter_params["division"] = parameters["division"]
            if parameters.get("team"):
                filter_params["team"] = parameters["team"]
            
            # Job details filters
            if parameters.get("job_title"):
                filter_params["job_title"] = parameters["job_title"]
            if parameters.get("job_level"):
                filter_params["job_level"] = parameters["job_level"]
            if parameters.get("job_grade"):
                filter_params["job_grade"] = parameters["job_grade"]
            
            # Location filters
            if parameters.get("work_location"):
                filter_params["work_location"] = parameters["work_location"]
            if parameters.get("office_location"):
                filter_params["office_location"] = parameters["office_location"]
            
            # Reporting structure filters
            if parameters.get("reporting_manager"):
                filter_params["reporting_manager"] = parameters["reporting_manager"]
            if parameters.get("reporting_manager_name"):
                filter_params["reporting_manager_name"] = parameters["reporting_manager_name"]
            
            # Employment details filters
            if parameters.get("employment_type"):
                filter_params["employment_type"] = parameters["employment_type"]
            if parameters.get("work_shift"):
                filter_params["work_shift"] = parameters["work_shift"]
            
            # Date filters
            if parameters.get("join_date_from"):
                filter_params["join_date_from"] = parameters["join_date_from"]
            if parameters.get("join_date_to"):
                filter_params["join_date_to"] = parameters["join_date_to"]
            if parameters.get("probation_end_date_from"):
                filter_params["probation_end_date_from"] = parameters["probation_end_date_from"]
            if parameters.get("probation_end_date_to"):
                filter_params["probation_end_date_to"] = parameters["probation_end_date_to"]
            
            # Status and email filters
            if "is_active" in parameters:
                filter_params["is_active"] = parameters["is_active"]
            if parameters.get("work_email"):
                filter_params["work_email"] = parameters["work_email"]
            
            result = await mcp_client.call_tool("list_job_data", filter_params)
            
        elif tool_name == "search_job_data":
            query = parameters.get("query", "")
            result = await mcp_client.call_tool("search_job_data", {"query": query})
            
        elif tool_name == "get_job_data":
            employee_id = parameters.get("employee_id", "")
            result = await mcp_client.call_tool("get_job_data", {"employee_id": employee_id})
            
        elif tool_name == "get_employee_complete":
            # Get comprehensive employee data from all collections
            employee_id = parameters.get("employee_id", "")
            filter_params = {"employee_id": employee_id}
            
            # Optional inclusion flags (all default to true)
            if "include_attendance" in parameters:
                filter_params["include_attendance"] = parameters["include_attendance"]
            if "include_leaves" in parameters:
                filter_params["include_leaves"] = parameters["include_leaves"]
            if "include_payroll" in parameters:
                filter_params["include_payroll"] = parameters["include_payroll"]
            if "include_job_data" in parameters:
                filter_params["include_job_data"] = parameters["include_job_data"]
            
            result = await mcp_client.call_tool("get_employee_complete", filter_params)
            
        elif tool_name == "list_employees_with_relations":
            # List employees with all related data using optimized aggregation pipeline
            filter_params = {"limit": parameters.get("limit", 20)}
            
            # Status and department filters
            if parameters.get("status"):
                filter_params["status"] = parameters["status"]
            if parameters.get("department"):
                filter_params["department"] = parameters["department"]
            
            # Optional inclusion flags (all default to true)
            if "include_attendance_summary" in parameters:
                filter_params["include_attendance_summary"] = parameters["include_attendance_summary"]
            if "include_leave_balance" in parameters:
                filter_params["include_leave_balance"] = parameters["include_leave_balance"]
            if "include_latest_payroll" in parameters:
                filter_params["include_latest_payroll"] = parameters["include_latest_payroll"]
            
            result = await mcp_client.call_tool("list_employees_with_relations", filter_params)
            
        elif tool_name == "stats_summary":
            # Get counts from all collections
            emp_result = await mcp_client.list_employees(limit=1000)
            leave_result = await mcp_client.list_leaves(limit=1000)
            
            emp_content = emp_result.get("content", [])
            emp_count = 0
            if emp_content and len(emp_content) > 0:
                emp_data = json.loads(emp_content[0].get("text", "[]"))
                emp_count = len(emp_data)
            
            leave_content = leave_result.get("content", [])
            pending_count = 0
            if leave_content and len(leave_content) > 0:
                all_leaves = json.loads(leave_content[0].get("text", "[]"))
                pending_count = len([l for l in all_leaves if l.get("status") == "pending"])
            
            return {
                "stats": {
                    "total_employees": emp_count,
                    "pending_leaves": pending_count
                }
            }
        else:
            return {"error": f"Unknown tool: {tool_name}"}
        
        # Parse MCP response
        content = result.get("content", [])
        if content and len(content) > 0:
            data = json.loads(content[0].get("text", "[]"))
            return {"data": data, "tool_used": tool_name}
        
        return {"data": [], "tool_used": tool_name}
        
    except Exception as e:
        print(f"Error executing MCP tool: {e}")
        return {"error": str(e)}


async def format_response_with_llm(user_message: str, data: Dict[str, Any], tool_used: str) -> str:
    """
    Generate natural language responses using HuggingFace LLM.
    Falls back to smart formatting if LLM unavailable.
    """
    
    result_data = data.get("data", [])
    
    # Handle empty results
    if not result_data or (isinstance(result_data, list) and len(result_data) == 0):
        return "📋 No results found for your query."
    
    # Prepare data summary for LLM
    data_summary = json.dumps(result_data, indent=2, default=str)
    if len(data_summary) > 3000:  # Limit data size for LLM
        if isinstance(result_data, list):
            data_summary = json.dumps(result_data[:5], indent=2, default=str)
            data_summary += f"\n... and {len(result_data) - 5} more records"
    
    # Create prompt for LLM
    prompt = f"""<s>[INST] You are an AI assistant for an Employee Management System. A user asked: "{user_message}"

The system retrieved the following data using the {tool_used} tool:

{data_summary}

Generate a natural, conversational response that:
1. Directly answers the user's question
2. Presents the data in a clear, organized format
3. Uses appropriate emojis (👥 📧 📱 📍 🩸 👤 🏢 💼 📅 ✅ ❌)
4. Is concise but informative
5. Focuses only on relevant fields based on the user's query

Response: [/INST]"""

    # Try LLM APIs (OpenRouter first, then HuggingFace)
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            
            # Try OpenRouter (better, more reliable)
            if OPENROUTER_API_KEY:
                try:
                    response = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": "http://localhost:3000",
                            "X-Title": "Work-Zen EMS"
                        },
                        json={
                            "model": OPENROUTER_MODEL,
                            "messages": [
                                {"role": "system", "content": "You are an AI assistant for an Employee Management System. Present data clearly and professionally."},
                                {"role": "user", "content": f"User query: {user_message}\n\nData from system:\n{json.dumps(result_data, indent=2, default=str)[:2000]}\n\nGenerate a natural, clear response with emojis."}
                            ],
                            "max_tokens": 500,
                            "temperature": 0.7
                        }
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if "choices" in result and len(result["choices"]) > 0:
                            generated_text = result["choices"][0]["message"]["content"]
                            if generated_text:
                                print("✅ OpenRouter LLM response generated")
                                return generated_text.strip()
                except Exception as e:
                    print(f"OpenRouter API error: {e}")
            
            # Try HuggingFace chat completions API
            if HUGGINGFACE_API_KEY:
                try:
                    response = await client.post(
                        "https://router.huggingface.co/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "Qwen/Qwen2.5-Coder-32B-Instruct",
                            "messages": [
                                {"role": "user", "content": prompt}
                            ],
                            "temperature": 0.7,
                            "max_tokens": 500
                        }
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        generated_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                        if generated_text:
                            print("✅ HuggingFace LLM response generated")
                            return generated_text.strip()
                    
                    print(f"HuggingFace API response: {response.status_code} - {response.text[:200]}")
                except Exception as e:
                    print(f"HuggingFace API error: {e}")
    
    except Exception as e:
        print(f"HuggingFace LLM error: {e}")
    
    # Fallback: Smart context-aware formatting
    return await format_response_fallback(user_message, result_data, tool_used)


async def format_response_fallback(user_message: str, result_data: Any, tool_used: str) -> str:
    """
    Fallback formatting when LLM is unavailable.
    Provides context-aware display based on query keywords.
    """
    query_lower = user_message.lower()
    
    # Employee queries - context-aware display
    if tool_used in ["list_employees", "search_employees"]:
        if not isinstance(result_data, list):
            result_data = [result_data]
            
        response = f"👥 **Found {len(result_data)} employee(s)**\n\n"
        
        for emp in result_data[:10]:
            name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
            response += f"• **{name}** (ID: {emp.get('employee_id', 'N/A')})\n"
            response += f"  📧 {emp.get('email', 'N/A')} | 📱 {emp.get('phone', 'N/A')}\n"
            
            # Context-aware field display based on query
            addr = emp.get('address', {})
            
            # Show location if query mentions location-related terms
            if any(word in query_lower for word in ['location', 'city', 'state', 'country', 'address', 'where', 'colombo', 'malabe', 'badulla', 'work']):
                if addr.get('city') or addr.get('state'):
                    location_parts = [addr.get('city'), addr.get('state'), addr.get('country')]
                    location = ', '.join([p for p in location_parts if p])
                    response += f"  📍 {location}\n"
            
            # Show blood group if query mentions it
            if any(word in query_lower for word in ['blood', 'group', 'type', 'a+', 'a-', 'o+', 'o-', 'b+', 'b-', 'ab+', 'ab-']):
                if emp.get('blood_group'):
                    response += f"  🩸 Blood Group: {emp.get('blood_group')}\n"
            
            # Show personal info if query mentions gender/marital
            if any(word in query_lower for word in ['gender', 'male', 'female', 'marital', 'married', 'single', 'divorced', 'personal']):
                personal = []
                if emp.get('gender'): personal.append(emp.get('gender'))
                if emp.get('marital_status'): personal.append(emp.get('marital_status'))
                if personal:
                    response += f"  👤 {', '.join(personal)}\n"
            
            # Show nationality if query mentions it
            if any(word in query_lower for word in ['nationality', 'national', 'country', 'citizen']):
                if emp.get('nationality'):
                    response += f"  🌍 Nationality: {emp.get('nationality')}\n"
            
            # Show department/job if query mentions work-related terms
            if any(word in query_lower for word in ['department', 'job', 'title', 'position', 'role', 'work', 'engineer', 'manager', 'developer']) or 'all' in query_lower:
                if emp.get('department') or emp.get('job_title'):
                    job_info = []
                    if emp.get('department'): job_info.append(emp.get('department'))
                    if emp.get('job_title'): job_info.append(emp.get('job_title'))
                    response += f"  🏢 {' - '.join(job_info)}\n"
            
            # Show employment details if query mentions it
            if any(word in query_lower for word in ['employment', 'status', 'type', 'full', 'part', 'contract', 'active']):
                emp_details = []
                if emp.get('employment_type'): emp_details.append(emp.get('employment_type'))
                if emp.get('employment_status'): emp_details.append(emp.get('employment_status'))
                if emp_details:
                    response += f"  � {' | '.join(emp_details)}\n"
            
            # Show hire date if query mentions it
            if any(word in query_lower for word in ['hire', 'joined', 'start', 'date']):
                if emp.get('hire_date'):
                    response += f"  � Hired: {emp.get('hire_date')}\n"
            
            response += "\n"
        
        return response.strip()
    
    # Attendance queries
    elif tool_used == "list_attendance":
        if not isinstance(result_data, list):
            result_data = [result_data]
            
        response = f"📅 **Found {len(result_data)} attendance record(s)**\n\n"
        for att in result_data[:10]:
            status_emoji = "✅" if att.get('status') == 'present' else "❌"
            response += f"{status_emoji} **{att.get('employee_id', 'N/A')}** - {att.get('date', 'N/A')}\n"
            if att.get('work_hours'):
                response += f"   ⏰ Work Hours: {att.get('work_hours')}h\n"
            if att.get('status'):
                response += f"   Status: {att.get('status').title()}\n"
            response += "\n"
        return response.strip()
    
    # Leave queries
    elif tool_used == "list_leaves":
        if not isinstance(result_data, list):
            result_data = [result_data]
            
        response = f"🏖️ **Found {len(result_data)} leave request(s)**\n\n"
        for leave in result_data[:10]:
            response += f"• **{leave.get('employee_id', 'N/A')}** - {leave.get('leave_type', 'N/A').title()}\n"
            response += f"  📅 {leave.get('start_date', 'N/A')} to {leave.get('end_date', 'N/A')} ({leave.get('days', 0)} days)\n"
            response += f"  Status: {leave.get('status', 'N/A').title()}\n"
            if leave.get('reason'):
                response += f"  📝 Reason: {leave.get('reason')}\n"
            response += "\n"
        return response.strip()
    
    # Payroll queries
    elif tool_used == "list_payroll":
        if not isinstance(result_data, list):
            result_data = [result_data]
            
        response = f"💰 **Found {len(result_data)} payroll record(s)**\n\n"
        for pay in result_data[:10]:
            response += f"• **{pay.get('employee_id', 'N/A')}**\n"
            response += f"  💵 Net Salary: {pay.get('net_salary', 0)}\n"
            response += f"  📅 Period: {pay.get('pay_period_start', 'N/A')} to {pay.get('pay_period_end', 'N/A')}\n"
            response += f"  Status: {pay.get('status', 'N/A').title()}\n\n"
        return response.strip()
    
    # Stats summary
    elif tool_used == "stats_summary":
        stats = data.get("stats", {})
        return f"""📊 **System Overview**

• 👥 **Total Employees:** {stats.get('total_employees', 0)}
• 🏖️ **Pending Leaves:** {stats.get('pending_leaves', 0)}

What would you like to know more about?"""
    
    # Comprehensive employee data (all tables joined)
    elif tool_used == "get_employee_complete":
        if not isinstance(result_data, dict):
            return "📋 No employee data found."
        
        response = "👤 **COMPLETE EMPLOYEE PROFILE**\n\n"
        
        # Basic employee info
        emp = result_data.get('employee', {})
        if emp:
            name = f"{emp.get('first_name', '')} {emp.get('last_name', '')}".strip()
            response += f"**{name}** (ID: {emp.get('employee_id', 'N/A')})\n"
            response += f"📧 {emp.get('email', 'N/A')} | 📱 {emp.get('phone', 'N/A')}\n"
            if emp.get('address'):
                addr = emp['address']
                location = ', '.join(filter(None, [addr.get('city'), addr.get('state'), addr.get('country')]))
                if location:
                    response += f"📍 {location}\n"
            response += "\n"
        
        # Job & Organization data
        job = result_data.get('job_data')
        if job:
            response += "🏢 **JOB & ORGANIZATION**\n"
            if job.get('department'):
                response += f"• Department: {job.get('department')}\n"
            if job.get('job_title'):
                response += f"• Title: {job.get('job_title')}\n"
            if job.get('job_level'):
                response += f"• Level: {job.get('job_level')}\n"
            if job.get('work_location'):
                response += f"• Location: {job.get('work_location')}\n"
            if job.get('reporting_manager_name'):
                response += f"• Reports to: {job.get('reporting_manager_name')}\n"
            if job.get('work_shift'):
                response += f"• Shift: {job.get('work_shift')}\n"
            response += "\n"
        
        # Attendance summary
        att = result_data.get('attendance_summary')
        if att and att.get('last_30_days'):
            summary = att['last_30_days']
            response += "📅 **ATTENDANCE (Last 30 Days)**\n"
            response += f"• Present: {summary.get('present', 0)} days\n"
            response += f"• Absent: {summary.get('absent', 0)} days\n"
            if summary.get('late', 0) > 0:
                response += f"• Late: {summary.get('late', 0)} days\n"
            if summary.get('work_from_home', 0) > 0:
                response += f"• WFH: {summary.get('work_from_home', 0)} days\n"
            response += f"• Total Work Hours: {summary.get('total_work_hours', 0)}h\n"
            if float(summary.get('total_overtime_hours', 0)) > 0:
                response += f"• Overtime: {summary.get('total_overtime_hours', 0)}h\n"
            response += "\n"
        
        # Leave information
        leave = result_data.get('leave_info')
        if leave:
            response += "🏖️ **LEAVE INFORMATION**\n"
            balance = leave.get('balance')
            if balance:
                response += f"• Annual Leave: {balance.get('annual_leave_balance', 0)} days\n"
                response += f"• Sick Leave: {balance.get('sick_leave_balance', 0)} days\n"
            summary = leave.get('requests_summary', {})
            response += f"• Leave Requests: {summary.get('total', 0)} "
            response += f"(Pending: {summary.get('pending', 0)}, "
            response += f"Approved: {summary.get('approved', 0)})\n\n"
        
        # Payroll information
        payroll = result_data.get('payroll_info')
        if payroll:
            response += "💰 **PAYROLL INFORMATION**\n"
            latest = payroll.get('latest_payment')
            if latest:
                response += f"• Latest Net Salary: ${latest.get('net_salary', 0):,.2f}\n"
                response += f"• Payment Date: {latest.get('payment_date', 'N/A')}\n"
                response += f"• Status: {latest.get('status', 'N/A').title()}\n"
            avg_salary = payroll.get('average_net_salary', 0)
            if avg_salary:
                response += f"• Average Salary (last 3): ${float(avg_salary):,.2f}\n"
        
        return response.strip()
    
    # List employees with relations (aggregation pipeline)
    elif tool_used == "list_employees_with_relations":
        if not isinstance(result_data, list):
            result_data = [result_data]
        
        response = f"👥 **Found {len(result_data)} employee(s) with complete data**\n\n"
        
        for emp in result_data[:10]:  # Show max 10
            response += f"**{emp.get('employee_id', 'N/A')} - {emp.get('name', 'N/A')}**\n"
            
            # Job info
            job = emp.get('job_data')
            if job:
                info = []
                if job.get('job_title'): info.append(job.get('job_title'))
                if job.get('department'): info.append(job.get('department'))
                if info: response += f"  🏢 {' | '.join(info)}\n"
            
            # Attendance summary
            att_summary = emp.get('attendance_summary')
            if att_summary and att_summary.get('total_days', 0) > 0:
                response += f"  📅 Attendance (30d): {att_summary.get('present_days', 0)}P / {att_summary.get('absent_days', 0)}A | {att_summary.get('total_work_hours', 0)}h\n"
            
            # Leave balance
            leave = emp.get('leave_balance')
            if leave:
                response += f"  🏖️ Leave: Annual {leave.get('annual_leave_balance', 0)} | Sick {leave.get('sick_leave_balance', 0)}\n"
            
            # Latest payroll
            payroll = emp.get('latest_payroll')
            if payroll:
                response += f"  💰 Salary: ${payroll.get('net_salary', 0):,.2f} ({payroll.get('payment_date', 'N/A')})\n"
            
            response += "\n"
        
        if len(result_data) > 10:
            response += f"...and {len(result_data) - 10} more.\n"
        
        return response.strip()
    
    # Default response for other tools
    if isinstance(result_data, list):
        return f"✅ Retrieved {len(result_data)} records successfully."
    return "✅ Operation completed successfully."


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI-powered chat endpoint with LLM intent detection.
    Complete LLM-driven pipeline: intent detection + response generation.
    
    Flow:
    1. User sends natural language query
    2. LLM analyzes intent → selects MCP tool (with regex fallback)
    3. Execute MCP tool via stdio protocol
    4. LLM generates natural response from data
    """
    try:
        user_message = request.message
        
        # Step 1: LLM-powered intent detection ONLY (no regex fallback)
        print(f"📝 User Query: {user_message}")
        
        # Use LLM intent detection only
        intent = await llm_intent_detection(user_message)
        
        if not intent:
            # If LLM fails, return error message
            print("❌ LLM intent detection failed")
            return ChatResponse(
                response="Sorry, I'm having trouble understanding your request right now. Please try again or rephrase your question.",
                data=None
            )
        
        tool_name = intent.get("tool", "list_employees")
        parameters = intent.get("parameters", {})
        
        print(f"🔍 Intent detected: {tool_name} with params: {parameters}")
        
        # Step 2: Execute the tool via MCP
        result = await execute_mcp_tool(tool_name, parameters)
        
        # Step 3: LLM generates natural response (with smart fallback)
        response = await format_response_with_llm(
            user_message,
            result,
            tool_name
        )
        
        return ChatResponse(response=response, data=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    """Format payroll records"""
    response = f"💰 **Found {len(payroll)} payroll record(s)**\n\n"
    for pay in payroll[:10]:
        response += f"• **{pay.get('employee_id', 'N/A')}**\n"
        response += f"  💵 Net Salary: {pay.get('net_salary', 0)}\n"
        response += f"  📅 Period: {pay.get('pay_period_start', 'N/A')} to {pay.get('pay_period_end', 'N/A')}\n"
        response += f"  Status: {pay.get('status', 'N/A').title()}\n\n"
    return response.strip()


def format_stats_response(stats: Dict) -> str:
    """Format system statistics"""
    return f"""📊 **System Overview**

• 👥 **Total Employees:** {stats.get('total_employees', 0)}
• 🏖️ **Pending Leaves:** {stats.get('pending_leaves', 0)}

What would you like to know more about?"""


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI Chat with intelligent intent detection.
    
    Flow:
    1. User asks question in natural language
    2. Smart intent detection selects correct MCP tool
    3. Execute tool via MCP Client → MCP Server → MongoDB
    4. LLM formats the retrieved data beautifully
    """
    try:
        # Step 1: Intelligent intent detection selects tool
        tool_call = smart_intent_detection(request.message)
        tool_name = tool_call.get("tool", "list_employees")
        parameters = tool_call.get("parameters", {})
        
        print(f"🔍 Intent detected: {tool_name} with params: {parameters}")
        
        # Step 2: Execute the tool via MCP
        result = await execute_mcp_tool(tool_name, parameters)
        
        # Step 3: LLM formats the response beautifully
        response = await format_response_with_llm(
            request.message,
            result,
            tool_name
        )
        
        return ChatResponse(response=response, data=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
