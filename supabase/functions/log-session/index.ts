// supabase/functions/log-session/index.ts

import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from './cors.ts'

// Define the expected shape of the incoming data from the frontend
interface PlatformData {
  user_id: string;
  platform: string;
  device_type: string;
  os: string;
  os_version: string | null;
  browser: string | null;
  browser_version: string | null;
  user_agent: string;
  prefers_dark_mode: boolean | null;
  entry_point: string | null;
  session_start: string;
}

Deno.serve(async (req) => {
  // This is needed to invoke the function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const platformData: PlatformData = await req.json()

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get IP address from the request headers
    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null

    let geo_country = null
    let geo_city = null

    // If we have an IP, fetch geolocation data
    if (ip_address) {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip_address}?fields=country,city`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          geo_country = geoData.country || null;
          geo_city = geoData.city || null;
        }
      } catch (geoError) {
        console.error('Geolocation lookup failed:', geoError.message);
        // Don't block the main process if geo lookup fails
      }
    }

    // Combine all data and insert into the database
    const { error } = await supabaseAdmin.from('user_platform_sessions').insert([
      {
        ...platformData,
        ip_address,
        geo_country,
        geo_city,
      },
    ])

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
