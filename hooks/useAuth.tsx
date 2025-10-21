'use client';

import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: number;
  username: string;
  nick: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        const userData = localStorage.getItem('user');
        console.log('🔍 useAuth - Carregando dados do localStorage:', userData);
        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log('✅ useAuth - Usuário carregado:', parsedUser);
          setUser(parsedUser);
        } else {
          console.log('❌ useAuth - Nenhum usuário encontrado no localStorage');
        }
      } catch (error) {
        console.error('❌ useAuth - Erro ao carregar dados do usuário:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (userData: User) => {
    console.log('🚀 useAuth - Fazendo login com:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('✅ useAuth - Login realizado, dados salvos no localStorage');
  };

  const logout = () => {
    console.log('🚪 useAuth - Fazendo logout');
    setUser(null);
    localStorage.removeItem('user');
    console.log('✅ useAuth - Logout realizado, dados removidos do localStorage');
  };

  // Debug logs
  useEffect(() => {
    console.log('🔍 useAuth - Estado atual:', {
      user,
      isAuthenticated: !!user,
      isAdmin: user?.isAdmin || false,
      loading
    });
  }, [user, loading]);

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}