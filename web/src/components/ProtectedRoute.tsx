import { Navigate, Outlet } from 'react-router-dom';
import { UserData } from '../types/types';

interface ProtectedRouteProps {
  user: UserData | null;
  allowedRoles?: string[];
  disallowedRoles?: string[];
  redirectPath?: string;
}

export function ProtectedRoute({ user, allowedRoles, disallowedRoles, redirectPath = "/" }: ProtectedRouteProps) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectPath} replace />;
  }

  if (disallowedRoles && disallowedRoles.includes(user.role)) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
