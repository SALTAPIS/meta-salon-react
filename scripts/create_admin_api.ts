import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);

async function createAdmin() {
  try {
    // First, try to get the existing admin user
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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

      // Update existing admin user's password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingAdmin.id,
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
      // Create new admin user
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          email: 'admin@meta.salon',
          password: 'MetaSalon2023!',
          email_confirm: true,
          user_metadata: {
            role: 'admin'
          }
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to create admin user: ${JSON.stringify(responseData)}`);
      }

      console.log('Admin user created:', responseData);

      // Create admin profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: responseData.id,
          email: responseData.email,
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
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdmin(); 