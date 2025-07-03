// AuthContext.js - Completely browser-safe version
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔧 SIMPLE APPROACH: Hard-coded URLs based on hostname
  const getApiUrl = () => {
    const hostname = window.location.hostname;
    
    // If we're on localhost or local network, use local backend
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return 'http://localhost:5000'; // Your local backend
    }
    
    // If we're on the production domain, use production backend
    return 'https://test-gen-backend.onrender.com';
  };

  const API_BASE_URL = getApiUrl();

  console.log('🌐 AuthContext initialized');
  console.log('🔧 Current hostname:', window.location.hostname);
  console.log('🎯 API URL:', API_BASE_URL);
  console.log('📍 Frontend URL:', window.location.origin);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('🔍 Checking authentication status...');
    console.log('🎯 Making request to:', `${API_BASE_URL}/auth/me`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include', // This is crucial for cookies
      });

      console.log('📊 Auth check response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Authentication successful:', userData);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.log('❌ Not authenticated, status:', response.status);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('🏁 Auth check completed');
      console.log('🍪 Current cookies:', document.cookie);
    }
  };

  const login = async (email, password) => {
    console.log('🔐 Attempting login for:', email);
    console.log('🎯 Making request to:', `${API_BASE_URL}/auth/login`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Critical for cookies
        body: JSON.stringify({ email, password }),
      });

      console.log('📊 Login response status:', response.status);
      console.log('📋 Response headers:');
      for (let [key, value] of response.headers.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Login failed:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      console.log('✅ Login successful:', userData);
      
      // Wait a moment then check cookies
      setTimeout(() => {
        console.log('🍪 Cookies after login:', document.cookie);
        const hasJwtCookie = document.cookie.includes('jwt=');
        console.log('🔑 JWT cookie found:', hasJwtCookie ? '✅ YES' : '❌ NO');
        
        if (!hasJwtCookie) {
          console.warn('⚠️ WARNING: Login successful but no JWT cookie in browser!');
          console.log('🔍 Check browser dev tools → Application → Cookies');
        }
      }, 1000);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { success: false, error: error.message };
    }
  };

  const signup = async (email, username, password) => {
    console.log('📝 Attempting signup for:', email);
    console.log('🎯 Making request to:', `${API_BASE_URL}/auth/signup`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Critical for cookies
        body: JSON.stringify({ email, username, password }),
      });

      console.log('📊 Signup response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Signup failed:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      console.log('✅ Signup successful:', userData);
      
      // Check cookies after signup
      setTimeout(() => {
        console.log('🍪 Cookies after signup:', document.cookie);
        const hasJwtCookie = document.cookie.includes('jwt=');
        console.log('🔑 JWT cookie found:', hasJwtCookie ? '✅ YES' : '❌ NO');
      }, 1000);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Signup failed:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    console.log('🚪 Attempting logout...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      console.log('📊 Logout response status:', response.status);
      
      if (response.ok) {
        console.log('✅ Logout successful');
      } else {
        console.log('⚠️ Logout request failed, clearing state anyway');
      }
    } catch (error) {
      console.error('❌ Logout request failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      console.log('🧹 Auth state cleared');
      console.log('🍪 Cookies after logout:', document.cookie);
    }
  };

  // Helper functions
  const refreshAuth = async () => {
    setIsLoading(true);
    await checkAuthStatus();
  };

  const debugAuth = () => {
    console.log('=== 🔍 AUTH DEBUG INFO ===');
    console.log('🎯 API URL:', API_BASE_URL);
    console.log('🌐 Frontend:', window.location.origin);
    console.log('👤 User:', user);
    console.log('🔐 Authenticated:', isAuthenticated);
    console.log('⏳ Loading:', isLoading);
    console.log('🍪 Cookies:', document.cookie || 'None');
    console.log('🔑 Has JWT:', document.cookie.includes('jwt=') ? 'YES' : 'NO');
    console.log('========================');
  };

  const testConnection = async () => {
    console.log('🧪 Testing backend connection...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connection successful:', data);
        return { success: true, data };
      } else {
        console.log('❌ Backend returned error:', response.status);
        return { success: false, status: response.status };
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    checkAuthStatus,
    refreshAuth,
    debugAuth,
    testConnection,
    API_BASE_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Test component to verify everything works
export const AuthQuickTest = () => {
  const { 
    debugAuth, 
    testConnection, 
    login, 
    user, 
    isAuthenticated, 
    API_BASE_URL 
  } = useAuth();
  
  const [credentials, setCredentials] = useState({
    email: 'viraj@gmail.com',
    password: 'password123'
  });

  const runTest = async () => {
    console.log('🚀 Running quick auth test...');
    
    // Step 1: Debug current state
    debugAuth();
    
    // Step 2: Test backend connection
    const connectionResult = await testConnection();
    if (!connectionResult.success) {
      console.error('❌ Cannot connect to backend');
      return;
    }
    
    // Step 3: Try login
    console.log('🔐 Testing login...');
    const loginResult = await login(credentials.email, credentials.password);
    console.log('Login result:', loginResult);
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #e11d48', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#fef2f2'
    }}>
      <h3 style={{ color: '#be123c', margin: '0 0 15px 0' }}>
        🧪 Auth Quick Test
      </h3>
      
      <div style={{ marginBottom: '15px', fontSize: '14px' }}>
        <div><strong>API URL:</strong> {API_BASE_URL}</div>
        <div><strong>Status:</strong> {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</div>
        {user && <div><strong>User:</strong> {user.email}</div>}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <input
          type="email"
          placeholder="Email"
          value={credentials.email}
          onChange={(e) => setCredentials({...credentials, email: e.target.value})}
          style={{ margin: '5px', padding: '8px', width: '200px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          style={{ margin: '5px', padding: '8px', width: '200px' }}
        />
      </div>
      
      <button 
        onClick={runTest}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#dc2626', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          marginRight: '10px'
        }}
      >
        🚀 Run Full Test
      </button>
      
      <button 
        onClick={debugAuth}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#6b7280', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px'
        }}
      >
        🔍 Debug Only
      </button>
    </div>
  );
};