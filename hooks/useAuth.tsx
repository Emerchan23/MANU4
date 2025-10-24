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

// Função para ler cookies no cliente
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// Função para definir cookie no cliente
function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=lax`;
}

// Função para remover cookie no cliente
function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        console.log('🔍 useAuth - Iniciando verificação de autenticação...');
        
        // Primeiro, verificar cookie (prioridade para consistência com middleware)
        const userCookie = getCookie('user');
        console.log('🍪 useAuth - Cookie encontrado:', userCookie ? 'SIM' : 'NÃO');
        
        // Segundo, verificar localStorage
        const userLocalStorage = localStorage.getItem('user');
        console.log('💾 useAuth - LocalStorage encontrado:', userLocalStorage ? 'SIM' : 'NÃO');
        
        let userData: User | null = null;
        
        // Priorizar cookie se existir (consistência com middleware)
        if (userCookie) {
          try {
            userData = JSON.parse(decodeURIComponent(userCookie));
            console.log('✅ useAuth - Usuário carregado do COOKIE:', userData);
            
            // Sincronizar com localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('🔄 useAuth - LocalStorage sincronizado com cookie');
          } catch (error) {
            console.error('❌ useAuth - Erro ao parsear cookie:', error);
            removeCookie('user');
          }
        } 
        // Se não há cookie, verificar localStorage
        else if (userLocalStorage) {
          try {
            userData = JSON.parse(userLocalStorage);
            console.log('✅ useAuth - Usuário carregado do LOCALSTORAGE:', userData);
            
            // Sincronizar com cookie
            setCookie('user', JSON.stringify(userData));
            console.log('🔄 useAuth - Cookie sincronizado com localStorage');
          } catch (error) {
            console.error('❌ useAuth - Erro ao parsear localStorage:', error);
            localStorage.removeItem('user');
          }
        }
        
        if (userData) {
          setUser(userData);
          console.log('🎯 useAuth - Usuário autenticado:', {
            name: userData.name,
            role: userData.role,
            isAdmin: userData.isAdmin
          });
        } else {
          console.log('❌ useAuth - Nenhum usuário autenticado encontrado');
        }
        
      } catch (error) {
        console.error('❌ useAuth - Erro geral ao carregar dados do usuário:', error);
        // Limpar tudo em caso de erro
        localStorage.removeItem('user');
        removeCookie('user');
      } finally {
        setLoading(false);
        console.log('✅ useAuth - Verificação de autenticação concluída');
      }
    };

    loadUser();
  }, []);

  const login = (userData: User) => {
    console.log('🚀 useAuth - Fazendo login com:', userData);
    setUser(userData);
    
    // Salvar em ambos: localStorage E cookie
    localStorage.setItem('user', JSON.stringify(userData));
    setCookie('user', JSON.stringify(userData));
    
    console.log('✅ useAuth - Login realizado, dados salvos em localStorage E cookie');
  };

  const logout = () => {
    console.log('🚪 useAuth - Fazendo logout');
    setUser(null);
    
    // Remover de ambos: localStorage E cookie
    localStorage.removeItem('user');
    removeCookie('user');
    
    console.log('✅ useAuth - Logout realizado, dados removidos de localStorage E cookie');
  };

  // Debug logs
  useEffect(() => {
    console.log('🔍 useAuth - Estado atual:', {
      user: user ? { name: user.name, role: user.role, isAdmin: user.isAdmin } : null,
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