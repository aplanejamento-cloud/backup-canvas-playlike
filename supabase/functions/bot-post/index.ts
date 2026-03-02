import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOT_THEMES: Record<string, { topics: string[]; hashtags: string[] }> = {
  marcos_futebol10: {
    topics: ["Corinthians", "futebol brasileiro", "treino Guarujá", "churrasco praia", "pelada fim de semana", "gol bonito", "Brasileirão"],
    hashtags: ["#PlayLike", "#Futebol", "#Guarujá", "#Corinthians"],
  },
  virginia_style: {
    topics: ["look do dia Shein", "café SP", "makes stories", "dicas de moda", "skincare rotina", "unboxing", "tendências 2026"],
    hashtags: ["#PlayLike", "#Fashion", "#SP", "#Looks"],
  },
  meme_planktonBR: {
    topics: ["memes BR virais", "Plankton GuianaBR", "funk PR", "tralalero tralala", "zueira nunca acaba", "rotina de preguiçoso", "segunda-feira feelings"],
    hashtags: ["#PlayLike", "#MemesBR", "#GuianaBR", "#Humor"],
  },
  lulu_petsp: {
    topics: ["dog praia Guarujá", "banho pet", "coleira nova", "adoção animal", "gato dormindo", "passeio cachorro", "veterinário dicas"],
    hashtags: ["#PlayLike", "#PetLover", "#Guarujá", "#AdoteNaoCompre"],
  },
  coach_fitguaruja: {
    topics: ["treino praia manhã", "shake proteico", "receita 300cal", "cardio funcional", "yoga Guarujá", "dica nutri", "antes e depois"],
    hashtags: ["#PlayLike", "#Fitness", "#Guarujá", "#Saúde"],
  },
  juiza_marta_oficial: {
    topics: ["top 3 posts do dia", "análise crítica post", "duelo da semana", "quem lacrou mais", "dica pra subir ranking", "review feed"],
    hashtags: ["#PlayLike", "#Juíza", "#Review", "#Duelo"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all active bots
    const { data: bots } = await supabase
      .from("profiles")
      .select("user_id, name, user_type")
      .eq("is_bot", true);

    if (!bots || bots.length === 0) {
      return new Response(JSON.stringify({ message: "No bots found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: string[] = [];

    for (const bot of bots) {
      const theme = BOT_THEMES[bot.name];
      if (!theme) continue;

      const topic = theme.topics[Math.floor(Math.random() * theme.topics.length)];
      const tags = theme.hashtags.join(" ");

      let content = "";

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
                  content: `Você é ${bot.name}, um perfil brasileiro do app PlayLike. Escreva posts curtos (1-3 frases), naturais, em português BR com gírias. Tema: ${topic}. Inclua 1-2 emojis. NÃO use aspas. Seja autêntico e casual.`,
                },
                { role: "user", content: `Escreva um post sobre: ${topic}` },
              ],
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            content = aiData.choices?.[0]?.message?.content || "";
          }
        } catch {
          // fallback below
        }
      }

      // Fallback templates
      if (!content) {
        const templates: Record<string, string[]> = {
          marcos_futebol10: ["Bora Corinthians! Hoje é dia de jogo! ⚽🔥", "Pelada na praia de Guarujá, quem vem? 🏖️⚽", "Esse gol foi ABSURDO! 🤯 Fala sério"],
          virginia_style: ["Look do dia tá um arraso ✨ Quem curtiu? 💕", "Café da manhã em SP, rotina de quem ama se cuidar ☕", "Unboxing Shein chegou gente! 📦✨"],
          meme_planktonBR: ["Quando a segunda começa e o café acaba 😂💀", "Plankton BR dominou geral kkkk 🇧🇷", "Zueira mode ON, quem entendeu entendeu 😂"],
          lulu_petsp: ["Banho no dog, ficou um príncipe 🐕👑", "Passeio na praia com a Lulu, que felicidade 🏖️🐾", "Adote um pet, mude uma vida 💕🐶"],
          coach_fitguaruja: ["Treino na praia hoje cedo, bora! 💪🏖️", "Shake pós-treino: banana + whey + aveia = perfeito 🥤", "Yoga ao nascer do sol em Guarujá 🧘‍♂️🌅"],
          juiza_marta_oficial: ["Top 3 posts de hoje estão 🔥🔥🔥 Quem lacrou? 👑", "Análise do feed: muito post criativo hoje! ⚖️✨", "Duelo da semana tá PEGANDO FOGO ⚔️🔥"],
        };
        const options = templates[bot.name] || ["Bom dia PlayLike! ✨"];
        content = options[Math.floor(Math.random() * options.length)];
      }

      content = `${content}\n\n${tags}`;

      // Insert post
      const { error } = await supabase.from("posts").insert({
        user_id: bot.user_id,
        content,
        game_on: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      if (!error) results.push(bot.name);
    }

    return new Response(JSON.stringify({ posted: results, count: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bot-post error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
