import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all bots
    const { data: bots } = await supabase
      .from("profiles")
      .select("user_id, name, user_type")
      .eq("is_bot", true);

    if (!bots || bots.length < 2) {
      return new Response(JSON.stringify({ message: "Not enough bots" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botIds = bots.map(b => b.user_id);

    // Get recent bot posts (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: botPosts } = await supabase
      .from("posts")
      .select("id, user_id")
      .in("user_id", botIds)
      .gte("created_at", yesterday)
      .eq("deletado", false);

    if (!botPosts || botPosts.length === 0) {
      return new Response(JSON.stringify({ message: "No bot posts to interact with" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let interactions = 0;
    const types = ["like", "love"] as const;

    // Each bot interacts with 2-4 random OTHER bot posts
    for (const bot of bots) {
      const otherPosts = botPosts.filter(p => p.user_id !== bot.user_id);
      const count = Math.min(otherPosts.length, 2 + Math.floor(Math.random() * 3));
      const shuffled = otherPosts.sort(() => Math.random() - 0.5).slice(0, count);

      for (const post of shuffled) {
        // Check if already interacted
        const { data: existing } = await supabase
          .from("post_interactions")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", bot.user_id)
          .maybeSingle();

        if (existing) continue;

        const type = types[Math.floor(Math.random() * types.length)];
        const { error } = await supabase.from("post_interactions").insert({
          post_id: post.id,
          user_id: bot.user_id,
          interaction_type: type,
        });

        if (!error) interactions++;
      }
    }

    // Juiza comments on random bot posts
    const juiza = bots.find(b => b.name === "juiza_marta_oficial");
    if (juiza) {
      const comments = ["Top! 🔥", "Lacrou demais! 👑", "Conteúdo de qualidade! ✨", "⚔️ Bora duelar?", "💪 Arrasou!"];
      const randomPosts = botPosts
        .filter(p => p.user_id !== juiza.user_id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      for (const post of randomPosts) {
        const comment = comments[Math.floor(Math.random() * comments.length)];
        await supabase.from("comments").insert({
          post_id: post.id,
          juiz_id: juiza.user_id,
          texto: comment,
        });
      }
    }

    return new Response(
      JSON.stringify({ interactions, message: "Bot interactions completed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("bot-interact error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
