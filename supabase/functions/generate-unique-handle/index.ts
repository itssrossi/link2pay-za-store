
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { businessName } = await req.json()
    
    console.log('Generating unique handle for business:', businessName)
    
    // Generate base handle from business name
    let baseHandle = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20)
    
    // If handle is empty after cleaning, use default
    if (!baseHandle) {
      baseHandle = 'store'
    }
    
    let uniqueHandle = baseHandle
    let counter = 1
    
    // Check if handle exists and increment until unique
    while (true) {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('store_handle', uniqueHandle)
        .single()
      
      if (error && error.code === 'PGRST116') {
        // Handle doesn't exist, we can use it
        console.log('Found unique handle:', uniqueHandle)
        break
      }
      
      if (data) {
        // Handle exists, try next number
        uniqueHandle = `${baseHandle}${counter}`
        counter++
        console.log('Handle exists, trying:', uniqueHandle)
      } else {
        // Some other error occurred, but we can still use this handle
        console.log('Other error occurred, using handle:', uniqueHandle)
        break
      }
      
      // Safety check to prevent infinite loops
      if (counter > 1000) {
        console.error('Too many attempts, using fallback')
        uniqueHandle = `${baseHandle}${Date.now()}`
        break
      }
    }

    return new Response(
      JSON.stringify({ uniqueHandle }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-unique-handle function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
