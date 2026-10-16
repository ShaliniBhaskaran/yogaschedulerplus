import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }: { children: ReactNode; role?: 'manager' | 'instructor' }) {
  const { token, role: userRole } = useAuth();
  if (!token || !userRole) {
    return <Navigate to="/login" replace />;
  }
  if (role && userRole !== role) {
    return <Navigate to={userRole === 'instructor' ? '/instructor' : '/'} replace />;
  }
  return <>{children}</>;
}