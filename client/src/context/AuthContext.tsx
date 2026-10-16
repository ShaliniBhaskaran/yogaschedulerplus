import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import client from '../api/client';

type Role = 'manager' | 'instructor';

interface AuthContextType {
  token: string | null;
  email: string | null;
  role: Role | null;
  instructorId: string | null;
  login: (email: string, password: string) => Promise<{ role: Role; instructorId: string | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeEmailFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.email === 'string' ? decoded.email : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [email, setEmail] = useState<string | null>(decodeEmailFromToken(localStorage.getItem('token')));
  const [role, setRole] = useState<Role | null>(localStorage.getItem('role') as Role | null);
  const [instructorId, setInstructorId] = useState<string | null>(localStorage.getItem('instructorId'));

  async function login(email: string, password: string) {
    const res = await client.post('/auth/login', { email, password });
    const { token: newToken, role: newRole, instructorId: newInstructorId } = res.data;

    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    if (newInstructorId) {
      localStorage.setItem('instructorId', newInstructorId);
    } else {
      localStorage.removeItem('instructorId');
    }

    setToken(newToken);
    setEmail(decodeEmailFromToken(newToken));
    setRole(newRole);
    setInstructorId(newInstructorId ?? null);

    return { role: newRole as Role, instructorId: newInstructorId ?? null };
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('instructorId');
    setToken(null);
    setEmail(null);
    setRole(null);
    setInstructorId(null);
  }

  return (
    <AuthContext.Provider value={{ token, email, role, instructorId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}