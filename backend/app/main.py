from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from app.database import connect_to_mongo, close_mongo_connection
from app.mcp_client import mcp_client
from app.routes import employees, job_data, attendance, leaves, payroll, chat, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    await mcp_client.start()  # Start MCP Server process
    
    # Check LLM configuration
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
    huggingface_key = os.getenv("HUGGINGFACE_API_KEY", "")
    
    if not openrouter_key and not huggingface_key:
        print("⚠️  WARNING: No LLM API keys configured!")
        print("⚠️  Chat interface requires at least one of:")
        print("   - OPENROUTER_API_KEY (recommended)")
        print("   - HUGGINGFACE_API_KEY")
        print("⚠️  Chat queries will fail without LLM configuration")
    elif openrouter_key:
        print("✅ OpenRouter API configured (Primary LLM)")
    elif huggingface_key:
        print("✅ HuggingFace API configured (Backup LLM)")
    
    yield
    # Shutdown
    await mcp_client.stop()  # Stop MCP Server process
    await close_mongo_connection()

app = FastAPI(
    title="Employee Management System API",
    description="A comprehensive EMS with CRUD operations for Employee, Job, Attendance, Leave, and Payroll data",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Allow frontend access
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://workzen.duckdns.org",
    "*"  # Allow all origins for development
]

# Add EC2 frontend origin if FRONTEND_URL is set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
auth.router)  # Auth router
app.include_router(
# Include routers
app.include_router(employees.router, prefix="/api")
app.include_router(job_data.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(leaves.router, prefix="/api")
app.include_router(payroll.router, prefix="/api")
app.include_router(chat.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Employee Management System API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
