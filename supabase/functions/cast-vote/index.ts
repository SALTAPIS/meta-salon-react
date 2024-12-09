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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
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
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No authorization header' 
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

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid token',
          details: {
            message: userError?.message
          }
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

    // Parse request body
    let body: VoteRequest;
    try {
      body = JSON.parse(await req.text());
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid request body',
          details: {
            message: error.message
          }
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

    // Validate request body
    if (!body.artwork_id || !body.pack_id || typeof body.value !== 'number' || body.value <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid request parameters',
          details: {
            artwork_id: !body.artwork_id ? 'missing' : 'ok',
            pack_id: !body.pack_id ? 'missing' : 'ok',
            value: typeof body.value !== 'number' ? 'not a number' : 
                   body.value <= 0 ? 'must be greater than 0' : 'ok'
          }
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
    const { data: voteResult, error: voteError } = await supabaseClient.rpc('cast_vote', {
      p_artwork_id: body.artwork_id,
      p_pack_id: body.pack_id,
      p_value: body.value,
    });

    if (voteError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: voteError.message,
          details: {
            code: voteError.code,
            hint: voteError.hint,
            details: voteError.details
          }
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
      return new Response(
        JSON.stringify({ 
          success: false,
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

    return new Response(
      JSON.stringify({
        success: true,
        vote_id: voteResult.vote_id,
        total_value: voteResult.total_value,
        votes_remaining: voteResult.votes_remaining
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
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: {
          message: error.message
        }
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
