import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

let channel: RealtimeChannel | null = null;
let isCleaningUp = false;

const cleanupSubscription = async (userId: string) => {
  if (isCleaningUp) return;
  
  try {
    isCleaningUp = true;
    
    console.log('Starting subscription cleanup:', { userId });
    
    // First unsubscribe
    if (channel?.subscribe) {
      await channel.unsubscribe();
      // Add delay to ensure unsubscribe completes
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Then remove channel only if it exists
    if (channel && supabase.getChannels().length > 0) {
      await supabase.removeChannel(channel);
    }
    
    channel = null;
    
  } catch (error) {
    console.error('Subscription cleanup error:', error);
  } finally {
    isCleaningUp = false;
  }
};

export const setupRealtimeSubscription = (userId: string) => {
  if (!userId) return;
  
  try {
    // Clean up existing subscription first
    if (channel) {
      cleanupSubscription(userId);
    }
    
    // Set up new subscription
    channel = supabase
      .channel(`tokens:${userId}`)
      .on('presence', { event: 'sync' }, () => {
        // Handle presence sync
      })
      .on('presence', { event: 'join' }, () => {
        // Handle join
      })
      .on('presence', { event: 'leave' }, () => {
        // Handle leave
      })
      .subscribe((status: 'SUBSCRIBED' | 'CLOSED' | 'TIMED_OUT' | 'CHANNEL_ERROR') => {
        console.log('🔌 Subscription status:', status);
      });
      
  } catch (error) {
    console.error('Subscription setup error:', error);
  }
}; 