import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import {
  Container,
  Center,
  VStack,
  Heading,
  Text,
  Button,
  Link,
  Spinner,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

export type UserRole = 'user' | 'admin' | 'artist' | 'moderator';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { session, loading } = useSession();
  const location = useLocation();
  
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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Center h="calc(100vh - 64px)" p={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading your profile...</Text>
        </VStack>
      </Center>
    );
  }

  // For non-authenticated users, show invitation request UI
  if (!session) {
    console.warn('[RoleGuard] No session found, showing invitation request UI');
    return (
      <Container maxW="container.xl" py={8}>
        <Center minH="60vh">
          <VStack spacing={8}>
            <Heading 
              size="2xl" 
              fontFamily="'Allan', cursive"
              letterSpacing="wide"
              textAlign="center"
            >
              Request Artist Invitation
            </Heading>
            <Text fontSize="lg" color="gray.500" maxW="600px" textAlign="center">
              Want to share your art with the world? Request an artist invitation by contacting us.
            </Text>
            <Link href="mailto:sal@meta.salon" isExternal>
              <Button
                size="lg"
                colorScheme="blue"
                rightIcon={<ExternalLinkIcon />}
              >
                Request Invitation
              </Button>
            </Link>
          </VStack>
        </Center>
      </Container>
    );
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

  // For artist-only routes, show invitation request UI instead of redirecting
  if (!hasAccess && allowedRoles.includes('artist')) {
    console.warn('[RoleGuard] Non-artist accessing artist route:', {
      userRole,
      allowedRoles,
      userId: session.user?.id,
    });
    return (
      <Container maxW="container.xl" py={8}>
        <Center minH="60vh">
          <VStack spacing={8}>
            <Heading 
              size="2xl" 
              fontFamily="'Allan', cursive"
              letterSpacing="wide"
              textAlign="center"
            >
              Request Artist Invitation
            </Heading>
            <Text fontSize="lg" color="gray.500" maxW="600px" textAlign="center">
              Want to share your art with the world? Request an artist invitation by contacting us.
            </Text>
            <Link href="mailto:sal@meta.salon" isExternal>
              <Button
                size="lg"
                colorScheme="blue"
                rightIcon={<ExternalLinkIcon />}
              >
                Request Invitation
              </Button>
            </Link>
          </VStack>
        </Center>
      </Container>
    );
  }

  // For other role restrictions, redirect to signin
  if (!hasAccess) {
    console.warn('[RoleGuard] Access denied:', {
      userRole,
      allowedRoles,
      userId: session.user?.id,
    });
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
} 