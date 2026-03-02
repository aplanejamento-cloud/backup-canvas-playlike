import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    const todayDate = today.toISOString().slice(0, 10);

    // Get all jogadores
    const { data: jogadores } = await supabase
      .from("profiles")
      .select("user_id, name, total_likes")
      .eq("user_type", "jogador")
      .order("total_likes", { ascending: false });

    if (!jogadores?.length) {
      return new Response(JSON.stringify({ message: "No jogadores found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reports = [];

    for (let i = 0; i < jogadores.length; i++) {
      const jogador = jogadores[i];
      const rank = i + 1;

      // Likes received today
      const { data: userPosts } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", jogador.user_id);

      const postIds = userPosts?.map(p => p.id) || [];
      
      let likesToday = 0;
      if (postIds.length > 0) {
        const { count } = await supabase
          .from("post_interactions")
          .select("*", { count: "exact", head: true })
          .in("interaction_type", ["like", "love"])
          .in("post_id", postIds)
          .gte("created_at", todayISO);
        likesToday = count || 0;
      }

      // Duels won
      const { count: duelsWon } = await supabase
        .from("duels")
        .select("*", { count: "exact", head: true })
        .eq("winner_id", jogador.user_id)
        .eq("status", "completed");

      // Calculate streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().slice(0, 10);

      const { data: yesterdayStats } = await supabase
        .from("daily_stats")
        .select("streak_dias")
        .eq("user_id", jogador.user_id)
        .eq("data", yesterdayDate)
        .limit(1);

      const prevStreak = yesterdayStats?.[0]?.streak_dias || 0;
      const newStreak = likesToday > 0 ? prevStreak + 1 : 0;

      // Upsert daily_stats
      await supabase
        .from("daily_stats")
        .upsert({
          user_id: jogador.user_id,
          data: todayDate,
          likes_dia: likesToday,
          ranking_dia: rank,
          streak_dias: newStreak,
        }, { onConflict: "user_id,data" });

      reports.push({
        user_id: jogador.user_id,
        name: jogador.name,
        rank,
        total: jogadores.length,
        likesToday,
        duelsWon: duelsWon || 0,
        totalLikes: jogador.total_likes,
        streak: newStreak,
      });

      // Create notification with report
      const streakText = newStreak >= 2 ? ` | 🔥 STREAK ${newStreak}d` : "";
      await supabase.from("notifications").insert({
        user_id: jogador.user_id,
        tipo: "relatorio",
        mensagem: `🏆 RELATÓRIO @${jogador.name} #${rank}/${jogadores.length}\n+${likesToday} likes hoje | ${duelsWon || 0} duelos ganhos | Total: ${jogador.total_likes} likes${streakText}`,
      });
    }

    return new Response(JSON.stringify({ reports, count: reports.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Daily report error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
