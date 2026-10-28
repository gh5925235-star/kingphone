import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/admin/context/AuthContext';
import { Loader2 } from 'lucide-react';

export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <Loader2 size={24} className="animate-spin text-gold-300" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
