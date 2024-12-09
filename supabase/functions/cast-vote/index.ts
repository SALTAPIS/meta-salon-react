// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing authorization header',
          request_id: crypto.randomUUID()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        url: !!supabaseUrl,
        anon_key: !!supabaseAnonKey,
        service_key: !!supabaseServiceKey
      });
      throw new Error('Missing Supabase configuration');
    }

    // Create auth client
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    // Verify JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid authentication token',
          details: userError.message,
          request_id: crypto.randomUUID()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User not found',
          request_id: crypto.randomUUID()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { artwork_id, pack_id, value } = await req.json();

    // Log request details
    console.log('Request:', {
      user_id: user.id,
      artwork_id,
      pack_id,
      value
    });

    if (!artwork_id || !pack_id || typeof value !== 'number') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing or invalid required fields',
          details: {
            artwork_id: !artwork_id ? 'missing' : 'ok',
            pack_id: !pack_id ? 'missing' : 'ok',
            value: typeof value !== 'number' ? 'not a number' : 'ok'
          },
          request_id: crypto.randomUUID()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create admin client for database operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Call the database function
    const { data, error: dbError } = await adminClient.rpc('cast_vote', {
      p_artwork_id: artwork_id,
      p_pack_id: pack_id,
      p_value: value
    });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          details: dbError.message,
          code: dbError.code,
          request_id: crypto.randomUUID()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data,
        request_id: crypto.randomUUID()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        request_id: crypto.randomUUID()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/cast-vote' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
