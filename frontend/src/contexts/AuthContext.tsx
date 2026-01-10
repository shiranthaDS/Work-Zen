'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (token: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username');
    
    if (token && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
    } else if (pathname !== '/login') {
      // Redirect to login if not authenticated and not already on login page
      router.push('/login');
    }
    
    setLoading(false);
  }, [pathname, router]);

  const login = (token: string, username: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
    setIsAuthenticated(true);
    setUsername(username);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername(null);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
