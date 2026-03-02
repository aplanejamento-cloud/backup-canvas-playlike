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

    const now = new Date().toISOString();

    // Find expired posts (expires_at <= now)
    const { data: expiredPosts, error: fetchError } = await adminClient
      .from("posts")
      .select("id, user_id")
      .lte("expires_at", now);

    if (fetchError) {
      console.error("Error fetching expired posts:", fetchError);
      return new Response(JSON.stringify({ error: "Erro ao buscar posts expirados" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!expiredPosts || expiredPosts.length === 0) {
      return new Response(JSON.stringify({ deleted: 0, message: "Nenhum post expirado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const postIds = expiredPosts.map((p) => p.id);

    // Delete post images
    await adminClient.from("post_images").delete().in("post_id", postIds);

    // Delete interactions on expired posts (but likes/bombas counts on profiles are kept)
    await adminClient.from("post_interactions").delete().in("post_id", postIds);

    // Delete the expired posts
    const { error: deleteError } = await adminClient.from("posts").delete().in("id", postIds);

    if (deleteError) {
      console.error("Error deleting expired posts:", deleteError);
      return new Response(JSON.stringify({ error: "Erro ao deletar posts" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Deleted ${postIds.length} expired posts`);

    return new Response(JSON.stringify({ deleted: postIds.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cleanup error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
