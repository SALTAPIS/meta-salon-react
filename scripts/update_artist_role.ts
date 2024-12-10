import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUserRole() {
  try {
    // First, get the user ID
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'qwer17@sln.io')
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!profiles) {
      throw new Error('User not found');
    }

    // Update the user's role in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'artist' })
      .eq('id', profiles.id);

    if (updateError) {
      throw updateError;
    }

    console.log('Successfully updated user role to artist');
  } catch (error) {
    console.error('Error updating user role:', error);
  }
}

updateUserRole(); 