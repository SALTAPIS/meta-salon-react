import { createBrowserRouter, Navigate, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { lazy, Suspense } from 'react';
import { Center, Spinner, Box, Heading, Text, Button } from '@chakra-ui/react';

// Lazy load pages
const SignInPage = lazy(() => import('./pages/auth/SignInPage'));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'));
const GamePage = lazy(() => import('./pages/game/GamePage'));
const ClassementPage = lazy(() => import('./pages/classement/ClassementPage'));
const ArtworksPage = lazy(() => import('./pages/artworks/ArtworksPage'));
const SubmitArtPage = lazy(() => import('./pages/submit/SubmitArtPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const UnauthorizedPage = lazy(() => import('./pages/auth/unauthorized'));

const LoadingFallback = () => (
  <Center h="100vh">
    <Spinner size="xl" />
  </Center>
);

function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return (
      <Center h="100vh" flexDirection="column" gap={4}>
        <Heading>
          {error.status} {error.statusText}
        </Heading>
        <Text>Sorry, the page you're looking for doesn't exist.</Text>
        <Button as="a" href="/" colorScheme="blue">
          Go Home
        </Button>
      </Center>
    );
  }

  return (
    <Center h="100vh" flexDirection="column" gap={4}>
      <Heading>Oops!</Heading>
      <Text>Sorry, an unexpected error has occurred.</Text>
      <Button as="a" href="/" colorScheme="blue">
        Go Home
      </Button>
    </Center>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'auth/signin',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SignInPage />
          </Suspense>
        ),
      },
      {
        path: 'auth/signup',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SignUpPage />
          </Suspense>
        ),
      },
      {
        path: 'game',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <GamePage />
          </Suspense>
        ),
      },
      {
        path: 'classement',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ClassementPage />
          </Suspense>
        ),
      },
      {
        path: 'artworks',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ArtworksPage />
          </Suspense>
        ),
      },
      {
        path: 'submit',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SubmitArtPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'unauthorized',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <UnauthorizedPage />
          </Suspense>
        ),
      },
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <GamePage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ],
  },
]); 