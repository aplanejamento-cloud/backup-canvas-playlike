import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VIDEO_QUERIES: Record<string, string[]> = {
  marcos_futebol10: ["football", "soccer", "beach sports", "barbecue"],
  virginia_style: ["fashion", "makeup tutorial", "coffee shop", "shopping"],
  meme_planktonBR: ["funny animals", "cats", "comedy", "dance"],
  lulu_petsp: ["puppies", "dogs playing", "cats", "pets"],
  coach_fitguaruja: ["workout", "yoga", "fitness", "running beach"],
  juiza_marta_oficial: ["competition", "awards", "stage", "celebration"],
};

const VIDEO_CAPTIONS: Record<string, string[]> = {
  marcos_futebol10: ["Olha esse lance! ⚽🔥", "Treino do dia na área 💪", "Bola rolando! 🏖️⚽"],
  virginia_style: ["Tutorial rapidão ✨", "Rotina express 💕", "Dica do dia! 💄"],
  meme_planktonBR: ["Eu tentando kkk 😂", "Quando a vibe bate 🤣", "Zoeira pura 💀"],
  lulu_petsp: ["Olha o fofo! 🐕💕", "Momentos pet 🐾", "Diversão animal! 🎉🐶"],
  coach_fitguaruja: ["Série especial! 💪🔥", "15s de intensidade! ⚡", "Bora treinar! 🏃‍♂️"],
  juiza_marta_oficial: ["Review em vídeo! 🎬⚖️", "Os melhores de hoje 🏆", "Análise express! 🔥"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: bots } = await supabase
      .from("profiles")
      .select("user_id, name")
      .eq("is_bot", true);

    if (!bots?.length) {
      return new Response(JSON.stringify({ message: "No bots" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: string[] = [];

    for (const bot of bots) {
      const queries = VIDEO_QUERIES[bot.name];
      if (!queries) continue;

      const query = queries[Math.floor(Math.random() * queries.length)];
      const captions = VIDEO_CAPTIONS[bot.name] || ["Confira! 🎬"];
      let caption = captions[Math.floor(Math.random() * captions.length)];

      // Try to get a Pexels video
      let videoUrl: string | null = null;
      try {
        const pexelsRes = await fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&size=small`,
          { headers: { Authorization: "Pexels API" } }
        );
        // Pexels needs an API key - fallback to a placeholder approach
        // We'll use a static video approach since we can't guarantee Pexels key
      } catch { /* expected without key */ }

      // AI caption
      if (lovableKey) {
        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: `Você é ${bot.name}, perfil brasileiro do app PlayLike. Escreva uma legenda curta para um vídeo sobre "${query}". Português BR, gírias, 1-2 emojis. Sem aspas. Inclua #PlayLike.`,
                },
                { role: "user", content: `Legenda para vídeo de: ${query}` },
              ],
            }),
          });
          if (aiRes.ok) {
            const d = await aiRes.json();
            const txt = d.choices?.[0]?.message?.content;
            if (txt) caption = txt;
          }
        } catch { /* fallback */ }
      }

      // Post with video URL or just text+image fallback
      const postData: any = {
        user_id: bot.user_id,
        content: caption,
        game_on: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      if (videoUrl) {
        postData.video_url = videoUrl;
      } else {
        // Fallback: use Unsplash image with video-themed search
        postData.image_url = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=${Date.now() + Math.random()}`;
      }

      const { error } = await supabase.from("posts").insert(postData);
      if (!error) results.push(bot.name);
    }

    return new Response(JSON.stringify({ posted: results, count: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bot-video error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
