import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import SignUpPage from './pages/auth/SignUpPage';
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            path: '/signup',
            element: <SignUpPage />,
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
            path: '/game',
            element: <GamePage />,
          },
          {
            path: '/classement',
            element: <ClassementPage />,
          },
          {
            path: '/',
            element: <ArtworksPage />,
          }
        ],
      },
    ],
  },
]); 