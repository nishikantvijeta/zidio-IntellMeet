import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken, getAccessToken } from '../../services/api';
import { User } from '../../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, avatarUrl?: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Validate session on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getAccessToken();
      
      if (storedToken) {
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data.user);
        } catch (err) {
          // Token expired or invalid, attempt silent refresh
          try {
            const refreshRes = await api.post('/auth/refresh');
            setAccessToken(refreshRes.data.accessToken);
            const userRes = await api.get('/auth/profile');
            setUser(userRes.data.user);
          } catch (refreshErr) {
            // Refresh token expired or unavailable, clear storage
            setAccessToken('');
            setUser(null);
          }
        }
      } else {
        // No access token, check for a refresh cookie
        try {
          const refreshRes = await api.post('/auth/refresh');
          setAccessToken(refreshRes.data.accessToken);
          const userRes = await api.get('/auth/profile');
          setUser(userRes.data.user);
        } catch (refreshErr) {
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  };

  const signup = async (username: string, email: string, password: string, avatarUrl?: string) => {
    await api.post('/auth/signup', { username, email, password, avatarUrl });
  };

  const verifyEmail = async (token: string) => {
    await api.get(`/auth/verify?token=${token}`);
  };

  const forgotPassword = async (email: string) => {
    await api.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (token: string, password: string) => {
    await api.post('/auth/reset-password', { token, password });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      setAccessToken('');
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    // For local fallback or live updates
    // In our simplified DB, we update user fields
    // Let's call updates if there's a route, or update state
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
        updateProfile,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
export default AuthContext;
