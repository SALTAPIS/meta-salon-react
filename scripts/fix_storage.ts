import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase client with:', {
  url: supabaseUrl,
  serviceKey: supabaseServiceKey ? '✓ Set' : '✗ Missing'
});

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixStorage() {
  try {
    console.log('Starting storage fix...');

    // Create bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      throw bucketsError;
    }

    const artworksBucket = buckets?.find(b => b.id === 'artworks');
    
    if (!artworksBucket) {
      console.log('Creating artworks bucket...');
      const { error: createError } = await supabase
        .storage
        .createBucket('artworks', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
          fileSizeLimit: 10485760 // 10MB
        });

      if (createError) {
        throw createError;
      }
      console.log('Artworks bucket created successfully');
    } else {
      console.log('Artworks bucket already exists');
      
      // Update bucket configuration
      const { error: updateError } = await supabase
        .storage
        .updateBucket('artworks', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
          fileSizeLimit: 10485760 // 10MB
        });

      if (updateError) {
        throw updateError;
      }
      console.log('Bucket configuration updated');
    }

    // Apply storage policies
    const { error: policyError } = await supabase.rpc('apply_storage_policies');
    
    if (policyError) {
      console.warn('Warning: Error applying policies:', policyError);
    } else {
      console.log('Storage policies applied successfully');
    }

    console.log('Storage fix completed successfully');
  } catch (error) {
    console.error('Error fixing storage:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      stack: error?.stack
    });
    process.exit(1);
  }
}

fixStorage(); 