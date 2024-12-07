import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { Center, Spinner, VStack, Text } from '@chakra-ui/react';
import type { UserRole } from '../../types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading && !user && !location.pathname.startsWith('/auth/')) {
    return (
      <Center h="calc(100vh - 64px)" p={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading your profile...</Text>
        </VStack>
      </Center>
    );
  }

  if (!user && !location.pathname.startsWith('/auth/')) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  if (requiredRoles && (!user?.role || !requiredRoles.includes(user.role as UserRole))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
} 