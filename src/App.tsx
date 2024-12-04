import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Auth Pages
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import AuthCallback from './pages/auth/callback';

// Main Pages
import GamePage from './pages/game/GamePage';
import ClassementPage from './pages/classement/ClassementPage';
import ArtworksPage from './pages/artworks/ArtworksPage';
import SubmitArtPage from './pages/submit/SubmitArtPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Callback - No Layout */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* All Other Routes - With Layout */}
        <Route element={<Layout />}>
          {/* Auth Routes */}
          <Route path="/auth/signin" element={<SignInPage />} />
          <Route path="/auth/signup" element={<SignUpPage />} />

          {/* Main Routes */}
          <Route index element={<Navigate to="/game" replace />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/classement" element={<ClassementPage />} />
          <Route path="/artworks" element={<ArtworksPage />} />
          <Route path="/submit" element={<SubmitArtPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
