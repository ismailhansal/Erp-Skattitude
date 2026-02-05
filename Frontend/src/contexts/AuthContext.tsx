import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = user !== null;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/user');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log('🔐 Connexion...');
    
    // 1. Récupérer le token CSRF
    await api.get('/sanctum/csrf-cookie');
    console.log('✅ CSRF token récupéré');
    console.log('Cookies après CSRF:', document.cookie);
    
    // 2. Petite pause
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 3. Tenter la connexion
    const loginResponse = await api.post('/login', { email, password });
    console.log('✅ Login réussi, status:', loginResponse.status);
    console.log('Cookies après login:', document.cookie);
    
    // 4. Attendre un peu plus pour que la session soit bien établie
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 5. Récupérer les infos utilisateur
    console.log('👤 Tentative de récupération user...');
    console.log('Cookies avant /api/user:', document.cookie);
    
    const response = await api.get('/api/user');
    console.log('✅ User data:', response.data);
    
    setUser(response.data);
    return true;
    
  } catch (error: any) {
    console.error('❌ Erreur de connexion:', error);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Cookies au moment de l\'erreur:', document.cookie);
    return false;
  }
};

  const logout = async () => {
    try {
      await api.post('/logout');
      setUser(null);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};