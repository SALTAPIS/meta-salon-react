import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function createTestUser(email: string, password: string, role: string = 'user') {
  try {
    // Create user in auth.users
    const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError) {
      throw signUpError;
    }

    if (!authUser.user) {
      throw new Error('User creation failed');
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        role,
        balance: 0,
      });

    if (profileError) {
      throw profileError;
    }

    console.log(`Created user: ${email} with role: ${role}`);
    return authUser.user.id;
  } catch (error) {
    console.error(`Failed to create user ${email}:`, error);
    throw error;
  }
}

async function createTestUsers() {
  try {
    await createTestUser('test1@example.com', 'test123', 'user');
    await createTestUser('test2@example.com', 'test123', 'user');
    await createTestUser('moderator@example.com', 'test123', 'moderator');
    console.log('All test users created successfully');
  } catch (error) {
    console.error('Failed to create test users:', error);
  }
}

createTestUsers(); 