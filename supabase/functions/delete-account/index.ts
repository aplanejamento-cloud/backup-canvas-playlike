import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify password
    const { password } = await req.json();
    if (!password) {
      return new Response(JSON.stringify({ error: "Senha é obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: signInError } = await userClient.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (signInError) {
      return new Response(JSON.stringify({ error: "Senha incorreta" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client to delete everything
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const userId = user.id;

    // SMART DELETE: Keep interactions the user GAVE to others (their likes stay)
    // 1. Get all post IDs owned by this user
    const { data: userPosts } = await adminClient
      .from("posts")
      .select("id")
      .eq("user_id", userId);
    const postIds = (userPosts || []).map((p: any) => p.id);

    // 2. Delete post_images first (FK constraint), then interactions on user's posts
    if (postIds.length > 0) {
      await adminClient.from("post_images").delete().in("post_id", postIds);
      await adminClient.from("post_interactions").delete().in("post_id", postIds);
    }

    // 3. Delete user's posts
    await adminClient.from("posts").delete().eq("user_id", userId);

    // 4. Delete duels, votes, follows, media, referrals, roles
    await adminClient.from("duel_votes").delete().eq("voter_id", userId);
    await adminClient.from("duels").delete().or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`);
    await adminClient.from("follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
    await adminClient.from("user_media").delete().eq("user_id", userId);
    await adminClient.from("user_referrals").delete().eq("user_id", userId);
    await adminClient.from("user_roles").delete().eq("user_id", userId);
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // Delete storage files
    const buckets = ["user-media", "post-media"];
    for (const bucket of buckets) {
      const { data: files } = await adminClient.storage.from(bucket).list(userId);
      if (files && files.length > 0) {
        await adminClient.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
      }
    }

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      return new Response(JSON.stringify({ error: "Erro ao deletar conta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
