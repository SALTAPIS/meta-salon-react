import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';

export type UserRole = 'user' | 'admin' | 'artist' | 'moderator';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { session } = useSession();
  
  // Check both metadata and user data for role
  const userRole = (
    session?.user?.role as UserRole || 
    session?.user?.user_metadata?.role as UserRole
  );

  console.log('[RoleGuard] Checking access:', {
    userRole,
    allowedRoles,
    userId: session?.user?.id,
    metadata: session?.user?.user_metadata,
    hasRole: allowedRoles.includes(userRole)
  });

  if (!userRole || !allowedRoles.includes(userRole)) {
    console.warn('[RoleGuard] Access denied:', {
      userRole,
      allowedRoles,
      userId: session?.user?.id,
      metadata: session?.user?.user_metadata
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
} 