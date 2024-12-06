import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function updateAdminUser() {
  const adminId = 'b0005ad6-cc12-4e6c-9bf1-467eb4383e60';

  try {
    // Update auth.users metadata
    const { error: authError } = await supabase.auth.admin.updateUserById(
      adminId,
      {
        user_metadata: {
          role: 'admin',
          balance: 1000
        }
      }
    );

    if (authError) throw authError;

    // Update public.profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        balance: 1000,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId);

    if (profileError) throw profileError;

    console.log('Admin user updated successfully');
  } catch (error) {
    console.error('Error updating admin user:', error);
    process.exit(1);
  }
}

updateAdminUser().catch(console.error); 