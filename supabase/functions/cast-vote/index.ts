// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface VoteRequest {
  artwork_id: string;
  pack_id: string;
  value: number;
}

serve(async (req: Request) => {
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('Supabase configuration:', {
      url: supabaseUrl ? '✓ Set' : '✗ Missing',
      key: supabaseKey ? '✓ Set' : '✗ Missing'
    });

    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header:', authHeader ? authHeader.substring(0, 20) + '...' : 'missing');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get user from auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError) {
      console.error('Auth error:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      });
      return new Response(
        JSON.stringify({ error: 'Invalid auth token', details: authError }),
        { 
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!user) {
      console.error('No user found in auth response');
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Authenticated user:', {
      id: user.id,
      email: user.email
    });

    // Parse and validate request body
    let body: VoteRequest;
    try {
      const rawBody = await req.text();
      console.log('Raw request body:', rawBody);
      body = JSON.parse(rawBody);
      
      console.log('Parsed request body:', body);
      if (!body.artwork_id || !body.pack_id || typeof body.value !== 'number') {
        console.error('Validation failed:', {
          has_artwork_id: !!body.artwork_id,
          has_pack_id: !!body.pack_id,
          value_is_number: typeof body.value === 'number',
          value: body.value
        });
        throw new Error('Missing required fields');
      }
    } catch (error) {
      console.error('Request body parsing error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body', 
          details: error.message,
          stack: error.stack
        }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check if artwork exists and get its status
    const { data: artwork, error: artworkError } = await supabaseClient
      .from('artworks')
      .select('id, vault_status')
      .eq('id', body.artwork_id)
      .single();

    if (artworkError) {
      console.error('Error fetching artwork:', artworkError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch artwork', details: artworkError }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!artwork) {
      console.error('Artwork not found:', body.artwork_id);
      return new Response(
        JSON.stringify({ error: 'Artwork not found' }),
        { 
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Found artwork:', artwork);

    // Check vote pack ownership
    const { data: votePack, error: votePackError } = await supabaseClient
      .from('vote_packs')
      .select('*')
      .eq('id', body.pack_id)
      .eq('user_id', user.id)
      .single();

    if (votePackError) {
      console.error('Error fetching vote pack:', votePackError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch vote pack', details: votePackError }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!votePack) {
      console.error('Vote pack not found or not owned by user:', {
        pack_id: body.pack_id,
        user_id: user.id
      });
      return new Response(
        JSON.stringify({ error: 'Vote pack not found or not owned by user' }),
        { 
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Found vote pack:', votePack);

    // Call the cast_vote function
    console.log('Calling cast_vote with params:', {
      p_artwork_id: body.artwork_id,
      p_pack_id: body.pack_id,
      p_value: body.value
    });

    const { data, error: voteError } = await supabaseClient.rpc('cast_vote', {
      p_artwork_id: body.artwork_id,
      p_pack_id: body.pack_id,
      p_value: body.value,
    });

    if (voteError) {
      console.error('Vote casting error:', {
        message: voteError.message,
        details: voteError.details,
        hint: voteError.hint,
        code: voteError.code
      });
      return new Response(
        JSON.stringify({ 
          error: voteError.message,
          details: voteError.details,
          hint: voteError.hint,
          code: voteError.code
        }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Vote cast successfully:', data);

    return new Response(
      JSON.stringify({ vote_id: data }),
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Unhandled error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack,
        cause: error.cause
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
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
