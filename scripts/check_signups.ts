import { supabase } from '../src/lib/supabaseClient';

async function checkSignups() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email, created_at, email_verified')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    console.log('Recent signups:', data);
  } catch (error) {
    console.error('Error checking signups:', error);
  }
}

checkSignups(); 