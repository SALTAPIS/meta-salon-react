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
  // Log request details
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
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
      key: supabaseKey ? '✓ Set' : '✗ Missing',
      timestamp: new Date().toISOString()
    });

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header:', {
      present: !!authHeader,
      timestamp: new Date().toISOString()
    });

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

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);

    console.log('User verification:', {
      success: !!user,
      error: userError?.message,
      user_id: user?.id,
      timestamp: new Date().toISOString()
    });

    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid token',
          details: userError?.message
        }),
        { 
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Parse and validate request body
    let body: VoteRequest;
    try {
      const rawBody = await req.text();
      console.log('Raw request body:', rawBody);
      body = JSON.parse(rawBody);
      
      console.log('Parsed request body:', {
        ...body,
        timestamp: new Date().toISOString()
      });

      if (!body.artwork_id || !body.pack_id || typeof body.value !== 'number') {
        console.error('Validation failed:', {
          has_artwork_id: !!body.artwork_id,
          has_pack_id: !!body.pack_id,
          value_is_number: typeof body.value === 'number',
          value: body.value,
          timestamp: new Date().toISOString()
        });
        throw new Error('Missing required fields');
      }
    } catch (error) {
      console.error('Request body parsing error:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
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

    // Call the cast_vote function
    console.log('Calling cast_vote with params:', {
      p_artwork_id: body.artwork_id,
      p_pack_id: body.pack_id,
      p_value: body.value,
      user_id: user.id,
      timestamp: new Date().toISOString()
    });

    const { data: voteResult, error: voteError } = await supabaseClient.rpc('cast_vote', {
      p_artwork_id: body.artwork_id,
      p_pack_id: body.pack_id,
      p_value: body.value,
    });

    console.log('Vote result:', {
      success: !!voteResult,
      error: voteError?.message,
      details: voteError?.details,
      result: voteResult,
      timestamp: new Date().toISOString()
    });

    if (voteError) {
      console.error('Vote casting error:', {
        message: voteError.message,
        details: voteError.details,
        hint: voteError.hint,
        code: voteError.code,
        timestamp: new Date().toISOString()
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

    if (!voteResult || !voteResult.success) {
      console.error('Vote casting failed:', {
        result: voteResult,
        timestamp: new Date().toISOString()
      });
      return new Response(
        JSON.stringify({ 
          error: voteResult?.error || 'Failed to cast vote',
          details: voteResult
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

    console.log('Vote cast successfully:', {
      result: voteResult,
      artwork_id: body.artwork_id,
      pack_id: body.pack_id,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        vote_id: voteResult.vote_id,
        total_value: voteResult.total_value,
        votes_remaining: voteResult.votes_remaining,
        success: true
      }),
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
      cause: error.cause,
      timestamp: new Date().toISOString()
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
