import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Center, Heading, Text, Button } from '@chakra-ui/react';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import AuthCallback from './pages/auth/AuthCallback';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import UnauthorizedPage from './pages/auth/unauthorized';
import GamePage from './pages/game/GamePage';
import ArtworksPage from './pages/artworks/ArtworksPage';
import ClassementPage from './pages/classement/ClassementPage';
import SubmitArtPage from './pages/submit/SubmitArtPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: (
      <Center h="100vh" flexDirection="column" gap={4}>
        <Heading>Oops!</Heading>
        <Text>Something went wrong.</Text>
        <Button as="a" href="/" colorScheme="blue">
          Go Home
        </Button>
      </Center>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'auth',
        children: [
          {
            path: 'signin',
            element: <SignInPage />,
          },
          {
            path: 'signup',
            element: <SignUpPage />,
          },
          {
            path: 'callback',
            element: <AuthCallback />,
          },
          {
            path: 'unauthorized',
            element: <UnauthorizedPage />,
          },
        ],
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'game',
        element: <GamePage />,
      },
      {
        path: 'artworks',
        element: <ArtworksPage />,
      },
      {
        path: 'classement',
        element: <ClassementPage />,
      },
      {
        path: 'submit',
        element: (
          <ProtectedRoute>
            <SubmitArtPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
    ]
  }
]); 