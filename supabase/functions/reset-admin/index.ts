import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

console.log('Hello from reset-admin function!')

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers()
    
    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }

    const adminUser = users.find(user => user.email === 'admin@meta.salon')
    
    if (!adminUser) {
      return new Response(JSON.stringify({ error: 'Admin user not found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      })
    }

    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      adminUser.id,
      {
        password: 'MetaSalon2023!',
        email_confirm: true,
        user_metadata: { role: 'admin' }
      }
    )

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: adminUser.id,
        email: adminUser.email,
        role: 'admin',
        display_name: 'Admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }

    return new Response(
      JSON.stringify({ 
        message: 'Admin user updated successfully',
        id: adminUser.id,
        email: adminUser.email
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
}) 