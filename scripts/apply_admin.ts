import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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

async function applyAdminSQL() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_admin.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }

    console.log('Successfully executed admin SQL');

    // Verify the admin user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const adminUser = users.find(user => user.email === 'admin@meta.salon');

    if (!adminUser) {
      console.log('Admin user not found after SQL execution');
      return;
    }

    console.log('Admin user verified:', {
      id: adminUser.id,
      email: adminUser.email,
      created_at: adminUser.created_at
    });

    // Verify admin profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (profileError) {
      console.error('Error checking admin profile:', profileError);
      return;
    }

    console.log('Admin profile verified:', profile);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

applyAdminSQL(); 