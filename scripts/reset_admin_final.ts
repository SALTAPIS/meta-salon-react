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

console.log('Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

async function resetAdmin() {
  try {
    // First, try to get the existing admin user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const existingAdmin = users.find(user => user.email === 'admin@meta.salon');

    if (existingAdmin) {
      console.log('Found existing admin user:', {
        id: existingAdmin.id,
        email: existingAdmin.email,
        created_at: existingAdmin.created_at
      });

      // Update existing admin user's password using direct API call
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existingAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          password: 'MetaSalon2023!',
          email_confirm: true,
          user_metadata: { role: 'admin' }
        })
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(`Failed to update admin user: ${JSON.stringify(responseData)}`);
      }

      console.log('Updated admin user password');

      // Update admin profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: existingAdmin.id,
          email: existingAdmin.email,
          role: 'admin',
          display_name: 'Admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error updating admin profile:', profileError);
        return;
      }

      console.log('Admin profile updated:', profile);
    } else {
      console.error('Admin user not found');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetAdmin(); 