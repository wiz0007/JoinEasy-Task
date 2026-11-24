import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ActiveGroupSummary } from '../../types/index.js';
import { apiRequest } from '../../lib/api.js';

interface AuthContextType {
  user: User | null;
  activeGroup: ActiveGroupSummary | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeGroup, setActiveGroup] = useState<ActiveGroupSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest<{
        id: string;
        name: string;
        email: string;
        role: User['role'];
        studentId?: string | null;
        status: User['status'];
        createdAt: string;
        activeGroup: ActiveGroupSummary | null;
      }>('/auth/me');

      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        studentId: data.studentId,
        status: data.status,
        createdAt: data.createdAt,
      });
      setActiveGroup(data.activeGroup);
    } catch {
      setUser(null);
      setActiveGroup(null);
      localStorage.removeItem('accessToken');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('accessToken', token);
    setUser(userData);
    fetchProfile();
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout network failure
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      setActiveGroup(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeGroup,
        isLoading,
        login,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
