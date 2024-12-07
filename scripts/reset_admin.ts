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
    persistSession: false
  }
});

async function resetAdmin() {
  try {
    // First, check if admin user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const adminUser = users.find(u => u.email === 'admin@meta.salon');

    if (adminUser) {
      console.log('Found existing admin user:', {
        id: adminUser.id,
        email: adminUser.email,
        created_at: adminUser.created_at
      });

      // Update existing user
      const { data: { user: updatedUser }, error: updateError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        {
          password: 'MetaSalon2023!',
          email_confirm: true,
          user_metadata: {
            role: 'admin'
          }
        }
      );

      if (updateError) {
        console.error('Error updating admin user:', updateError);
        return;
      }

      console.log('Updated admin user:', {
        id: updatedUser?.id,
        email: updatedUser?.email,
        created_at: updatedUser?.created_at
      });

      // Ensure admin profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: adminUser.id,
          email: adminUser.email,
          role: 'admin',
          display_name: 'Admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error ensuring admin profile:', profileError);
        return;
      }

      console.log('Admin profile ensured:', profile);
    } else {
      // Create new admin user using signUp
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@meta.salon',
        password: 'MetaSalon2023!',
        options: {
          data: {
            role: 'admin'
          }
        }
      });

      if (signUpError) {
        console.error('Error creating admin user:', signUpError);
        return;
      }

      if (!data.user) {
        console.error('No user returned from sign up');
        return;
      }

      console.log('Created new admin user:', {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      });

      // Confirm email directly
      const { error: confirmError } = await supabase.rpc('confirm_user', {
        user_id: data.user.id
      });

      if (confirmError) {
        console.error('Error confirming admin user:', confirmError);
        return;
      }

      console.log('Confirmed admin user email');

      // Create admin profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          role: 'admin',
          display_name: 'Admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating admin profile:', profileError);
        return;
      }

      console.log('Admin profile created:', profile);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetAdmin(); 