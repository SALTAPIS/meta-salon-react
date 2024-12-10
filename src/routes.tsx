import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import App from './App';
import SignUpPage from './pages/auth/SignUpPage';
import SignInPage from './pages/auth/SignInPage';
import AuthCallback from './pages/auth/AuthCallback';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TokensPage } from './pages/tokens/TokensPage';
import SubmitArtPage from './pages/submit/SubmitArtPage';
import { ArtworksPage } from './pages/artworks/ArtworksPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGuard } from './components/auth/RoleGuard';
import { Layout } from './components/layout/Layout';
import GamePage from './pages/game/GamePage';
import ClassementPage from './pages/classement/ClassementPage';
import { ArtworkDetailsPage } from './pages/artworks/ArtworkDetailsPage';
import { EdgeFunctionTestPage } from './pages/test/EdgeFunctionTestPage';
import { DebugPage } from './pages/debug/DebugPage';
import { DashboardPage as ArtistDashboardPage } from './pages/artist/DashboardPage';
import { TokenDistributionTest } from './pages/debug/TokenDistributionTest';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            path: '/',
            element: <ArtworksPage />,
          },
          {
            path: '/auth/signup',
            element: <SignUpPage />,
          },
          {
            path: '/auth/signin',
            element: <SignInPage />,
          },
          {
            path: '/auth/callback',
            element: <AuthCallback />,
          },
          {
            path: '/dashboard',
            element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
          },
          {
            path: '/profile',
            element: <ProtectedRoute><ProfilePage /></ProtectedRoute>,
          },
          {
            path: '/admin',
            element: (
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleGuard>
              </ProtectedRoute>
            ),
          },
          {
            path: '/artist',
            element: (
              <ProtectedRoute>
                <RoleGuard allowedRoles={['artist', 'admin']}>
                  <ArtistDashboardPage />
                </RoleGuard>
              </ProtectedRoute>
            ),
          },
          {
            path: '/tokens',
            element: <ProtectedRoute><TokensPage /></ProtectedRoute>,
          },
          {
            path: '/submit',
            element: <ProtectedRoute><SubmitArtPage /></ProtectedRoute>,
          },
          {
            path: '/artworks',
            element: <ArtworksPage />,
          },
          {
            path: '/artwork/:id',
            element: <ArtworkDetailsPage />,
          },
          {
            path: '/game',
            element: <GamePage />,
          },
          {
            path: '/classement',
            element: <ClassementPage />,
          },
          {
            path: '/test/edge-function',
            element: <ProtectedRoute><EdgeFunctionTestPage /></ProtectedRoute>,
          },
          {
            path: '/debug',
            element: <DebugPage />,
          },
          {
            path: '/debug/token-distribution',
            element: (
              <ProtectedRoute>
                <RoleGuard allowedRoles={['admin', 'artist']}>
                  <TokenDistributionTest />
                </RoleGuard>
              </ProtectedRoute>
            ),
          }
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes); 