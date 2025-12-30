'use client';

import { useState, useRef, useEffect } from 'react';
import { FiSend, FiUser, FiCpu, FiLoader, FiTrash2, FiInfo, FiCopy, FiCheck } from 'react-icons/fi';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input field on mount
    inputRef.current?.focus();
  }, []);

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(messageId);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/chat`, {
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
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
            <FiCpu className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              AI Assistant
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Online</span>
            </h1>
            <p className="text-sm text-gray-500">Powered by HuggingFace & MCP</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="btn-secondary inline-flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
        >
          <FiTrash2 size={18} />
          Clear Chat
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3 shadow-sm">
        <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
        <div className="text-sm text-blue-800">
          <strong className="text-blue-900">Real-time Employee Intelligence:</strong> Ask anything about employees, attendance, leaves, or payroll. 
          Your queries are processed through advanced AI to deliver instant, accurate insights from your database.
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 card flex flex-col overflow-hidden shadow-lg border border-gray-200">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary-700 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                  <FiCpu className="text-white" size={18} />
                </div>
              )}
              <div className="flex flex-col gap-1 max-w-[75%]">
                <div
                  className={`rounded-2xl p-4 shadow-md transition-all hover:shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-gray-900 border border-blue-200'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <div className={`whitespace-pre-wrap text-sm leading-relaxed font-semibold ${message.role === 'user' ? 'text-gray-900' : ''}`}>
                    {message.content.split('\n').map((line, i) => (
                      <span key={i}>
                        {line.includes('**') ? (
                          <span dangerouslySetInnerHTML={{ 
                            __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>') 
                          }} />
                        ) : line.includes('```') ? (
                          <code className="bg-gray-800 text-green-400 px-2 py-1 rounded text-xs font-mono block my-1">{line.replace(/```/g, '')}</code>
                        ) : line.startsWith('•') || line.startsWith('-') ? (
                          <span className="flex items-start gap-2 my-1">
                            <span className="text-primary mt-1">●</span>
                            <span>{line.replace(/^[•\-]\s*/, '')}</span>
                          </span>
                        ) : (
                          line
                        )}
                        {i < message.content.split('\n').length - 1 && !line.startsWith('•') && !line.startsWith('-') && <br />}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-opacity-20" style={{borderColor: message.role === 'user' ? '#93c5fd' : '#e5e7eb'}}>
                    <p className={`text-xs font-medium ${message.role === 'user' ? 'text-gray-600' : 'text-gray-400'}`}>
                      {formatTime(message.timestamp)}
                    </p>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="text-gray-400 hover:text-primary transition-colors p-1 rounded hover:bg-gray-100"
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <FiCheck size={14} className="text-green-500" />
                        ) : (
                          <FiCopy size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                  <FiUser className="text-white" size={18} />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 justify-start animate-fadeIn">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-primary-700 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                <FiCpu className="text-white" size={18} />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md">
                <div className="flex items-center gap-3 text-gray-600">
                  <FiLoader className="animate-spin" size={18} />
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
                  <span className="text-sm font-medium">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        {messages.length <= 1 && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              Try these quick queries:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setInput(query)}
                  className="text-xs bg-white hover:bg-primary hover:text-white text-gray-700 px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md border border-gray-200 hover:border-primary font-medium"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about employees, attendance, leaves, or payroll..."
              className="flex-1 input-field shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <FiLoader className="animate-spin" size={20} />
              ) : (
                <div className="flex items-center gap-2">
                  <FiSend size={20} />
                  <span className="font-medium">Send</span>
                </div>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Press <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-600 font-mono">Enter</kbd> to send
          </p>
        </form>
      </div>
    </div>
  );
}
