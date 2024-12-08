import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/authService';
import { User } from '../../models/user';
import { supabase } from '../../lib/supabase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = AuthService.getInstance();

  useEffect(() => {
    // Listen for profile updates
    const unsubscribeProfileUpdate = authService.onProfileUpdate((updatedProfile) => {
      setUser(prevUser => prevUser ? { ...prevUser, ...updatedProfile } : null);
    });

    // Initial auth state check
    const checkAuth = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (session.data.session?.user) {
          const userProfile = await authService.loadUserProfile(session.data.session.user);
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userProfile = await authService.loadUserProfile(session.user);
        setUser(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeProfileUpdate();
    };
  }, []);

  return (
    <div>
      {children}
    </div>
  );
} 