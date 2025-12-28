'use client';

import { useState, useRef, useEffect } from 'react';
import { FiSend, FiUser, FiCpu, FiLoader, FiTrash2, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Hello! I'm your AI-powered Employee Management Assistant. I can help you with:

• **Employee Information** - Find employee details, search by name or ID
• **Attendance Records** - Check attendance history and patterns
• **Leave Management** - View leave balances and requests
• **Payroll Data** - Access salary and compensation information
• **Job & Organization** - Look up department and position details

Just ask me anything about your employees! For example:
- "Show me all employees in the Engineering department"
- "What's the leave balance for employee EMP001?"
- "List attendance records for this month"`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send to backend API that handles HuggingFace LLM + MCP Server
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I couldn\'t process your request. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Provide a fallback response when backend is not available
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I'm currently unable to connect to the backend service. Please ensure:

1. The FastAPI backend is running on port 8000
2. The MCP server is properly configured
3. The HuggingFace API key is valid

You can start the backend with:
\`\`\`bash
cd backend && uvicorn app.main:app --reload
\`\`\`

Once the backend is running, I'll be able to help you query employee data!`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, fallbackMessage]);
      toast.error('Failed to connect to AI service');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `👋 Chat cleared! I'm ready to help you with employee management queries. What would you like to know?`,
      timestamp: new Date(),
    }]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const suggestedQueries = [
    "List all active employees",
    "Show attendance for today",
    "Get pending leave requests",
    "Show payroll summary",
    "Find employees by department",
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Assistant</h1>
          <p className="text-gray-500">Ask questions about your employee data</p>
        </div>
        <button
          onClick={clearChat}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <FiTrash2 size={18} />
          Clear Chat
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-3">
        <FiInfo className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
        <div className="text-sm text-blue-700">
          <strong>Architecture:</strong> Your queries flow through Next.js → HuggingFace LLM → MCP Server → MongoDB, 
          returning beautifully formatted responses with real employee data.
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <FiCpu className="text-white" size={16} />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line.includes('**') ? (
                        <span dangerouslySetInnerHTML={{ 
                          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                        }} />
                      ) : line.includes('```') ? (
                        <code className="bg-gray-200 px-1 rounded text-xs">{line.replace(/```/g, '')}</code>
                      ) : (
                        line
                      )}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <FiUser className="text-white" size={16} />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <FiCpu className="text-white" size={16} />
              </div>
              <div className="bg-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <FiLoader className="animate-spin" size={16} />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        {messages.length <= 1 && (
          <div className="border-t border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-2">Suggested queries:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setInput(query)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about employees, attendance, leaves, or payroll..."
              className="flex-1 input-field"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <FiLoader className="animate-spin" size={20} />
              ) : (
                <FiSend size={20} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
