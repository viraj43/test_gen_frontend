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

  // API base URL - make this configurable
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://test-gen-backend.onrender.com' 
    : 'http://localhost:3000';

  console.log('🌐 AuthContext initialized with API URL:', API_BASE_URL);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('🔍 Checking authentication status...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include', // This is crucial for cookies
      });

      console.log('📊 Auth check response status:', response.status);
      console.log('📋 Auth check response headers:', [...response.headers.entries()]);

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Authentication successful:', userData);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.log('❌ Not authenticated, status:', response.status);
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
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
    }
  };

  const login = async (email, password) => {
    console.log('🔐 Attempting login for:', email);
    
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
      console.log('📋 Login response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Login failed with error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      console.log('✅ Login successful:', userData);
      
      // Check if cookies are set after login
      console.log('🍪 Browser cookies after login:', document.cookie);
      
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
      console.log('📋 Signup response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Signup failed with error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      console.log('✅ Signup successful:', userData);
      
      // Check if cookies are set after signup
      console.log('🍪 Browser cookies after signup:', document.cookie);
      
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
        credentials: 'include', // Include cookies for logout
      });
      
      console.log('📊 Logout response status:', response.status);
      
      if (response.ok) {
        console.log('✅ Logout successful');
      } else {
        console.log('⚠️ Logout request failed, but clearing local state anyway');
      }
    } catch (error) {
      console.error('❌ Logout request failed:', error);
    } finally {
      // Clear state regardless of API call success
      setUser(null);
      setIsAuthenticated(false);
      console.log('🧹 Local auth state cleared');
      console.log('🍪 Browser cookies after logout:', document.cookie);
    }
  };

  // Helper function to manually refresh auth state
  const refreshAuth = async () => {
    setIsLoading(true);
    await checkAuthStatus();
  };

  // Debug function to check current state
  const debugAuth = () => {
    console.log('=== AUTH DEBUG INFO ===');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Current user:', user);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Is loading:', isLoading);
    console.log('Browser cookies:', document.cookie);
    console.log('Current domain:', window.location.hostname);
    console.log('Current protocol:', window.location.protocol);
    console.log('======================');
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
    debugAuth, // Add this for debugging
    API_BASE_URL // Expose for debugging
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};