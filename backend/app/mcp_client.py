"""
MCP Client - Communicates with MCP Server via stdio
"""
import asyncio
import json
from typing import Dict, Any, Optional
import os

class MCPClient:
    def __init__(self):
        self.process: Optional[asyncio.subprocess.Process] = None
        self.mcp_server_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "mcp-server"
        )
        
    async def start(self):
        """Start the MCP Server process"""
        if self.process:
            return
        
        # Prepare environment variables for MCP server
        env = os.environ.copy()
        # Ensure MongoDB connection variables are available
        if not env.get('MONGODB_URI') and env.get('MONGO_URL'):
            env['MONGODB_URI'] = env['MONGO_URL']
        if not env.get('DATABASE_NAME') and env.get('MONGO_DB_NAME'):
            env['DATABASE_NAME'] = env['MONGO_DB_NAME']
        
        print(f"🚀 Starting MCP Server from: {self.mcp_server_path}")
        print(f"🔑 MONGO_URL: {env.get('MONGO_URL', 'NOT SET')[:50]}...")
        print(f"🔑 MONGO_DB_NAME: {env.get('MONGO_DB_NAME', 'NOT SET')}")
            
        # Start the MCP server process
        self.process = await asyncio.create_subprocess_exec(
            "node",
            "index.js",
            cwd=self.mcp_server_path,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )
        
        # Wait for initialization and check if process is still running
        await asyncio.sleep(2)
        
        if self.process.returncode is not None:
            # Process died during startup
            stderr_output = await self.process.stderr.read()
            stdout_output = await self.process.stdout.read()
            raise Exception(
                f"MCP Server failed to start. Exit code: {self.process.returncode}\n"
                f"stderr: {stderr_output.decode()}\n"
                f"stdout: {stdout_output.decode()}"
            )
        
        print("✅ MCP Server started successfully")
        
    async def stop(self):
        """Stop the MCP Server process"""
        if self.process:
            try:
                self.process.terminate()
                await self.process.wait()
            except ProcessLookupError:
                pass  # Process already stopped
            finally:
                self.process = None
            
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call an MCP tool and get the result"""
        if not self.process:
            await self.start()
        
        # Check if process is still running
        if self.process.returncode is not None:
            # Process has died, try to get stderr
            stderr_output = await self.process.stderr.read()
            raise Exception(f"MCP Server process died. stderr: {stderr_output.decode()}")
            
        # Create the JSON-RPC request
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        
        # Send request to MCP server
        request_json = json.dumps(request) + "\n"
        self.process.stdin.write(request_json.encode())
        await self.process.stdin.drain()
        
        # Read response with better error handling
        try:
            response_line = await asyncio.wait_for(
                self.process.stdout.readline(),
                timeout=10.0
            )
        except asyncio.TimeoutError:
            # Try to read stderr for error info
            stderr_data = await asyncio.wait_for(
                self.process.stderr.read(1024),
                timeout=1.0
            ) if self.process.stderr else b""
            raise Exception(f"MCP Server timeout. stderr: {stderr_data.decode()}")
        
        if not response_line:
            # Try to read stderr for error info
            stderr_data = await self.process.stderr.read(1024) if self.process.stderr else b""
            raise Exception(f"No response from MCP server. stderr: {stderr_data.decode()}")
        
        # Decode and parse response
        response_text = response_line.decode().strip()
        if not response_text:
            stderr_data = await self.process.stderr.read(1024) if self.process.stderr else b""
            raise Exception(f"Empty response from MCP server. stderr: {stderr_data.decode()}")
        
        try:
            response = json.loads(response_text)
        except json.JSONDecodeError as e:
            # If JSON parse fails, read stderr for more context
            stderr_data = await self.process.stderr.read(1024) if self.process.stderr else b""
            raise Exception(f"Invalid JSON from MCP server: {response_text[:100]}... stderr: {stderr_data.decode()}")
        
        if "error" in response:
            raise Exception(f"MCP Error: {response['error']}")
            
        return response.get("result", {})
    
    async def list_employees(self, limit: int = 10) -> Dict[str, Any]:
        """List employees using MCP tool"""
        return await self.call_tool("list_employees", {"limit": limit})
    
    async def get_employee(self, employee_id: str) -> Dict[str, Any]:
        """Get employee by ID using MCP tool"""
        return await self.call_tool("get_employee", {"employee_id": employee_id})
    
    async def search_employees(self, query: str) -> Dict[str, Any]:
        """Search employees using MCP tool"""
        return await self.call_tool("search_employees", {"query": query})
    
    async def list_attendance(self, limit: int = 20) -> Dict[str, Any]:
        """List attendance records using MCP tool"""
        return await self.call_tool("list_attendance", {"limit": limit})
    
    async def list_leaves(self, limit: int = 20) -> Dict[str, Any]:
        """List leave requests using MCP tool"""
        return await self.call_tool("list_leaves", {"limit": limit})
    
    async def list_payroll(self, limit: int = 20) -> Dict[str, Any]:
        """List payroll records using MCP tool"""
        return await self.call_tool("list_payroll", {"limit": limit})
    
    async def get_leave_balance(self, employee_id: str) -> Dict[str, Any]:
        """Get leave balance using MCP tool"""
        return await self.call_tool("get_leave_balance", {"employee_id": employee_id})

# Global MCP client instance
mcp_client = MCPClient()
