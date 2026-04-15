import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

export type Role = 'Super Admin' | 'Admin' | 'User' | 'Manajemen';

export interface User {
  id: string;
  nama: string;
  email: string;
  role: Role;
  preferences?: { darkMode?: boolean; emailNotif?: boolean; pushNotif?: boolean } | string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  requiresPasswordChange: boolean; // <-- State baru
  setRequiresPasswordChange: (status: boolean) => void; // <-- Fungsi untuk mereset status
  login: (email: string, password: string) => Promise<{ success: boolean; requiresPasswordChange: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('authUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(() => {
    return localStorage.getItem('requiresPasswordChange') === 'true';
  });

  const isAuthenticated = !!user;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('https://sitor-backend-production.up.railway.app/api/login', {
        email: email,
        password: password
      });

      const { access_token, user: userData, requires_password_change } = response.data;

      const authUser: User = { 
        id: userData.id.toString(), 
        nama: userData.nama, 
        email: userData.email, 
        role: userData.role as Role 
      };

      setUser(authUser);
      setRequiresPasswordChange(requires_password_change);

      localStorage.setItem('token', access_token);
      localStorage.setItem('authUser', JSON.stringify(authUser));
      localStorage.setItem('requiresPasswordChange', requires_password_change.toString());

      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Kembalikan status ke komponen Login
      return { success: true, requiresPasswordChange: requires_password_change };

    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Terjadi kesalahan saat terhubung ke server database.');
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('https://sitor-backend-production.up.railway.app/api/logout');
      }
    } catch (error) {
      console.error('Error saat logout server', error);
    } finally {
      setUser(null);
      setRequiresPasswordChange(false);
      localStorage.removeItem('authUser');
      localStorage.removeItem('token');
      localStorage.removeItem('requiresPasswordChange');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, requiresPasswordChange, setRequiresPasswordChange, login, logout }}>
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
