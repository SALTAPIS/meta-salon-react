import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export class ProfileService {
  private static instance: ProfileService;

  private constructor() {}

  static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    try {
      // Validate username format if provided
      if (updates.username) {
        const isValid = await this.validateUsername(updates.username);
        if (!isValid) {
          throw new Error('Invalid username format');
        }

        const isAvailable = await this.checkUsernameAvailability(updates.username, userId);
        if (!isAvailable) {
          throw new Error('Username is already taken');
        }
      }

      // Validate website format if provided
      if (updates.website) {
        const urlPattern = /^https?:\/\/([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;
        const isValidUrl = urlPattern.test(updates.website);
        if (!isValidUrl) {
          throw new Error('Invalid website URL format');
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Profile not found');
      
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async checkUsernameAvailability(username: string, userId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('username', username);

      if (userId) {
        // Filter out the current user's profile
        query = query.neq('id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw error;
    }
  }

  async validateUsername(username: string): Promise<boolean> {
    // Username requirements:
    // - 3-30 characters
    // - Letters, numbers, underscores, and hyphens only
    // - Must start with a letter or number
    const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/;
    return usernameRegex.test(username);
  }

  async updateAvatar(userId: string, file: File): Promise<string> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      return publicUrl;
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  }

  async removeAvatar(userId: string): Promise<void> {
    try {
      // Get current avatar URL
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (profile?.avatar_url) {
        // Extract file path from URL
        const url = new URL(profile.avatar_url);
        const filePath = url.pathname.split('/').slice(-2).join('/');

        // Remove file from storage
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([filePath]);

        if (deleteError) throw deleteError;
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error removing avatar:', error);
      throw error;
    }
  }
} 