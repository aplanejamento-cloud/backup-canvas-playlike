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
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all auth users
    const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const allAuthUsers = authData?.users || [];

    // Get all profile user_ids
    const { data: profiles } = await adminClient.from("profiles").select("user_id");
    const profileUserIds = new Set((profiles || []).map((p: any) => p.user_id));

    // Find ghost users (in auth but no profile)
    const ghosts = allAuthUsers.filter((u) => !profileUserIds.has(u.id));

    let deleted = 0;
    for (const ghost of ghosts) {
      // Also clean up any orphan data
      await adminClient.from("user_roles").delete().eq("user_id", ghost.id);
      await adminClient.from("user_referrals").delete().eq("user_id", ghost.id);
      const { error } = await adminClient.auth.admin.deleteUser(ghost.id);
      if (!error) deleted++;
    }

    return new Response(
      JSON.stringify({
        total_auth_users: allAuthUsers.length,
        profiles_count: profileUserIds.size,
        ghosts_found: ghosts.length,
        ghosts_deleted: deleted,
        ghost_emails: ghosts.map((g) => g.email),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
