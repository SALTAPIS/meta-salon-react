import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/user';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !user.role || !allowedRoles.includes(user.role as UserRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 