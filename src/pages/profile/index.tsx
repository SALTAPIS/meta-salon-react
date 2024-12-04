import React from 'react';
import { UserProfile } from '../../components/profile/UserProfile';
import { UserStats } from '../../components/profile/UserStats';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage your account settings and view your activity
            </p>
          </div>

          {/* Stats Overview */}
          <UserStats />

          {/* Profile Settings */}
          <div className="mt-10">
            <UserProfile />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 