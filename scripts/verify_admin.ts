import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyAdmin() {
  try {
    // Check if admin user exists in auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error listing users:', authError);
      return;
    }

    const adminUser = users.find(user => user.email === 'admin@meta.salon');

    if (!adminUser) {
      console.log('Admin user not found in auth.users');
      return;
    }

    console.log('Admin user found in auth.users:', {
      id: adminUser.id,
      email: adminUser.email,
      created_at: adminUser.created_at
    });

    // Check if admin user exists in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (profileError) {
      console.error('Error checking admin profile:', profileError);
      return;
    }

    if (!profile) {
      console.log('Admin profile not found in profiles table');
      return;
    }

    console.log('Admin profile found:', profile);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

verifyAdmin(); 