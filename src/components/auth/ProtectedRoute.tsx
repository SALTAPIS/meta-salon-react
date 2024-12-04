import { Navigate, useLocation } from 'react-router-dom';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';
import { useAuth } from './AuthProvider';
import type { UserRole } from '../../types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute state:', { 
    path: location.pathname,
    isLoading,
    hasUser: !!user,
    userRole: user?.role
  });

  if (isLoading) {
    return (
      <Center h="calc(100vh - 100px)">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading your profile...</Text>
        </VStack>
      </Center>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to signin from:', location.pathname);
    return <Navigate to="/auth/signin" state={{ from: location.pathname }} replace />;
  }

  if (requiredRoles && (!user.role || !requiredRoles.includes(user.role))) {
    console.log('Access denied - Required roles:', requiredRoles, 'User role:', user.role);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('Access granted to protected route:', location.pathname);
  return <>{children}</>;
} 