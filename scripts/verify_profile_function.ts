import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

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

async function verifyProfileFunction() {
  try {
    // Read and execute the SQL verification script
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'verify_profile_function.sql'),
      'utf8'
    );
    
    console.log('Checking function setup...');
    const { data: verificationResults, error: verificationError } = await supabase.rpc(
      'exec_sql',
      { sql: sqlScript }
    );

    if (verificationError) {
      console.error('Error verifying function setup:', verificationError);
      return;
    }

    console.log('Verification results:', verificationResults);

    // Create a test user
    console.log('Creating test user...');
    const email = `test${Date.now()}@example.com`;
    const password = 'testpassword123';

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !user) {
      console.error('Error creating test user:', signUpError);
      return;
    }

    console.log('Test user created:', user.id);

    // Wait for profile to be created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test profile update
    console.log('Testing profile update...');
    const updates = {
      profile_id: user.id,
      username_arg: 'testuser123',
      display_name_arg: 'Test User',
      bio_arg: 'This is a test bio',
      website_arg: 'https://example.com',
    };

    const { data: updateResult, error: updateError } = await supabase.rpc(
      'update_profile',
      updates
    );

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return;
    }

    console.log('Profile updated successfully:', updateResult);

    // Verify the update
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching updated profile:', profileError);
      return;
    }

    console.log('Updated profile:', profile);

    // Clean up
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('Error deleting test user:', deleteError);
      return;
    }

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

verifyProfileFunction().catch(console.error); 