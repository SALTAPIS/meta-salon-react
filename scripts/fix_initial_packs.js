import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixInitialPacks() {
  try {
    console.log('Starting initial pack fix...');

    // First get all users with basic packs
    const { data: packsData, error: packsError } = await supabase
      .from('vote_packs')
      .select('user_id')
      .eq('type', 'basic');

    if (packsError) {
      throw packsError;
    }

    const usersWithPacks = new Set((packsData || []).map(p => p.user_id));

    // Get all users
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email');

    if (userError) {
      throw userError;
    }

    // Filter users without basic packs
    const usersNeedingPacks = (users || []).filter(user => !usersWithPacks.has(user.id));

    console.log(`Found ${usersNeedingPacks.length} users without basic pack`);

    // Add basic pack for each user
    for (const user of usersNeedingPacks) {
      console.log(`Processing user: ${user.email}`);

      const { data: pack, error: packError } = await supabase
        .from('vote_packs')
        .insert({
          user_id: user.id,
          type: 'basic',
          votes_remaining: 10,
          vote_power: 1,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        })
        .select()
        .single();

      if (packError) {
        console.error(`Error creating pack for user ${user.email}:`, packError);
        continue;
      }

      console.log(`Created basic pack for user ${user.email}`);
    }

    console.log('Initial pack fix completed');
  } catch (error) {
    console.error('Error fixing initial packs:', error);
    throw error;
  }
}

// Run the fix
fixInitialPacks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 