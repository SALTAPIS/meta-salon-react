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

async function setAdminPassword() {
  const adminEmail = 'admin@meta.salon';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  try {
    // Get user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Error listing users: ${userError.message}`);
    }

    console.log('Found users:', users.map(u => ({ id: u.id, email: u.email })));
    
    let adminUser = users.find(user => user.email === adminEmail);
    
    if (!adminUser) {
      console.log('Admin user not found, creating...');
      // Create admin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          balance: 1000
        }
      });

      if (createError) {
        throw new Error(`Error creating admin user: ${createError.message}`);
      }

      adminUser = newUser.user;
      console.log('Admin user created successfully');
    }

    // Update user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { password: adminPassword }
    );

    if (updateError) {
      throw updateError;
    }

    console.log('Admin password set successfully');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('User ID:', adminUser.id);
    console.log('\nPlease change this password immediately after first login!');
  } catch (error) {
    console.error('Error setting admin password:', error);
    process.exit(1);
  }
}

setAdminPassword().catch(console.error); 