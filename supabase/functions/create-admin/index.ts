import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create admin user
    const { data: { user }, error: createError } = await supabaseClient.auth.admin.createUser({
      email: 'admin@meta.salon',
      password: 'MetaSalon2023!',
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    });

    if (createError) {
      throw createError;
    }

    if (!user) {
      throw new Error('No user returned from create operation');
    }

    // Create admin profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        role: 'admin',
        display_name: 'Admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      throw profileError;
    }

    return new Response(
      JSON.stringify({
        message: 'Admin user created successfully',
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 