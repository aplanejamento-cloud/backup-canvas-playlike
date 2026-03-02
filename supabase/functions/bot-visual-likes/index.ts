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

    // Get top 10 real players (non-bot)
    const { data: top10 } = await supabase
      .from("profiles")
      .select("total_likes")
      .eq("user_type", "jogador")
      .eq("is_bot", false)
      .order("total_likes", { ascending: false })
      .limit(10);

    const top10Lowest = top10?.[top10.length - 1]?.total_likes || 500;
    const botMax = Math.floor(top10Lowest * 0.75);

    // Get all bots
    const { data: bots } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("is_bot", true);

    if (!bots || bots.length === 0) {
      return new Response(JSON.stringify({ message: "No bots" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update each bot with random visual_likes between 60-85% of botMax
    for (const bot of bots) {
      const minLikes = Math.floor(botMax * 0.6);
      const maxLikes = Math.floor(botMax * 0.85);
      const newVisual = Math.floor(Math.random() * (maxLikes - minLikes + 1)) + minLikes;

      await supabase
        .from("profiles")
        .update({ visual_likes: Math.max(50, newVisual) })
        .eq("user_id", bot.user_id);
    }

    return new Response(
      JSON.stringify({ updated: bots.length, top10Lowest, botMax }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("bot-visual-likes error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
