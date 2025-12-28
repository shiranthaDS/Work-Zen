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
            
        # Start the MCP server process
        self.process = await asyncio.create_subprocess_exec(
            "node",
            "index.js",
            cwd=self.mcp_server_path,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Wait for initialization
        await asyncio.sleep(1)
        
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
        
        # Read response
        response_line = await asyncio.wait_for(
            self.process.stdout.readline(),
            timeout=10.0
        )
        
        if not response_line:
            raise Exception("No response from MCP server")
            
        response = json.loads(response_line.decode())
        
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
