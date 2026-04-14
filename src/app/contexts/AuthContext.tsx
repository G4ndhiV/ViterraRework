import { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agente';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users para demo
const mockUsers: { email: string; password: string; user: User }[] = [
  {
    email: 'admin@viterra.com',
    password: 'admin123',
    user: { id: '1', email: 'admin@viterra.com', name: 'Admin Viterra', role: 'admin' }
  },
  {
    email: 'carlos@viterra.com',
    password: 'agente123',
    user: { id: '2', email: 'carlos@viterra.com', name: 'Carlos Rodríguez', role: 'agente' }
  },
  {
    email: 'ana@viterra.com',
    password: 'agente123',
    user: { id: '3', email: 'ana@viterra.com', name: 'Ana Martínez', role: 'agente' }
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('viterra_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (email: string, password: string): boolean => {
    const found = mockUsers.find(u => u.email === email && u.password === password);

    if (found) {
      setUser(found.user);
      localStorage.setItem('viterra_user', JSON.stringify(found.user));
      localStorage.setItem('viterra_session_start', new Date().toISOString());
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('viterra_user');
    localStorage.removeItem('viterra_session_start');
  };

  // Check session expiration (8 hours)
  const checkSessionExpiration = () => {
    const sessionStart = localStorage.getItem('viterra_session_start');
    if (sessionStart) {
      const elapsed = Date.now() - new Date(sessionStart).getTime();
      const eightHours = 8 * 60 * 60 * 1000;
      if (elapsed > eightHours) {
        logout();
      }
    }
  };

  // Check on mount
  if (user) {
    checkSessionExpiration();
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin'
    }}>
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
