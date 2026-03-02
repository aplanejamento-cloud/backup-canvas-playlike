import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if email exists in profiles (via auth user join)
    const { data } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const found = data?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    return new Response(JSON.stringify({ exists: !!found }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ exists: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
