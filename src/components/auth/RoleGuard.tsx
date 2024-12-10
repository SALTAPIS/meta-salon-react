import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';

export type UserRole = 'user' | 'admin' | 'artist' | 'moderator';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { session, loading } = useSession();
  
  // Get role from profile data in user_metadata
  const userRole = session?.user?.user_metadata?.role as UserRole;

  useEffect(() => {
    console.log('[RoleGuard] Session updated:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole,
      allowedRoles,
      loading,
      user: {
        role: session?.user?.role,
        metadata: {
          user_metadata: session?.user?.user_metadata,
          app_metadata: session?.user?.app_metadata
        },
        aud: session?.user?.aud,
      }
    });
  }, [session, userRole, allowedRoles, loading]);

  // Show nothing while loading
  if (loading) {
    console.log('[RoleGuard] Still loading session...');
    return null;
  }

  // No session means not authenticated
  if (!session) {
    console.warn('[RoleGuard] No session found, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // Check role access
  const hasAccess = userRole && allowedRoles.includes(userRole);
  console.log('[RoleGuard] Checking access:', {
    userRole,
    allowedRoles,
    hasAccess,
    metadata: {
      user_metadata: session.user?.user_metadata,
      app_metadata: session.user?.app_metadata
    },
  });

  if (!hasAccess) {
    console.warn('[RoleGuard] Access denied:', {
      userRole,
      allowedRoles,
      userId: session.user?.id,
      metadata: {
        user_metadata: session.user?.user_metadata,
        app_metadata: session.user?.app_metadata
      }
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
} 