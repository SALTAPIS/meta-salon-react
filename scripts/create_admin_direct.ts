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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  try {
    // First, try to delete the existing admin user if it exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const existingAdmin = users.find(user => user.email === 'admin@meta.salon');

    if (existingAdmin) {
      console.log('Found existing admin user, deleting...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingAdmin.id);

      if (deleteError) {
        console.error('Error deleting existing admin:', deleteError);
        return;
      }

      console.log('Existing admin user deleted');
    }

    // Create new admin user
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@meta.salon',
      password: 'MetaSalon2023!',
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    });

    if (createError) {
      console.error('Error creating admin user:', createError);
      return;
    }

    if (!user) {
      console.error('No user returned from create operation');
      return;
    }

    console.log('Admin user created:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    });

    // Create admin profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        role: 'admin',
        display_name: 'Admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating admin profile:', profileError);
      return;
    }

    console.log('Admin profile created:', profile);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdmin(); 