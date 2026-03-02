import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHOTO_TOPICS: Record<string, string[]> = {
  marcos_futebol10: ["football stadium", "soccer ball beach", "barbecue party", "beach sports brazil"],
  virginia_style: ["fashion outfit flat lay", "coffee shop aesthetic", "makeup beauty products", "shopping bags"],
  meme_planktonBR: ["funny cat", "surprised pikachu meme", "lazy dog couch", "monday morning coffee"],
  lulu_petsp: ["cute puppy beach", "golden retriever", "cat sleeping sunlight", "dog park"],
  coach_fitguaruja: ["beach workout sunrise", "protein shake gym", "yoga beach", "healthy meal prep"],
  juiza_marta_oficial: ["judge gavel", "trophy award", "competition podium", "star rating"],
};

const BOT_CAPTIONS: Record<string, string[]> = {
  marcos_futebol10: ["Dia de treino na praia! ⚽🏖️", "Nada melhor que uma pelada no fim de tarde 🔥", "Aquele churrasco pós-jogo 🥩⚽"],
  virginia_style: ["Look aprovado pelo espelho ✨💕", "Momento café e autocuidado ☕", "Haul de compras gente! 📦✨"],
  meme_planktonBR: ["Eu na segunda-feira kkk 😂💀", "Quando o sono bate forte 😴", "Mood do dia 🤣"],
  lulu_petsp: ["Meu bebê na praia 🐕🏖️", "Olha essa carinha 🥺💕", "Passeio com a galera peluda 🐾"],
  coach_fitguaruja: ["Treino de hoje: check ✅💪", "Café da manhã fitness 🥗", "Yoga ao nascer do sol 🧘‍♂️🌅"],
  juiza_marta_oficial: ["Hoje o feed tá 🔥🔥🔥", "Analisando os melhores posts ⚖️", "Quem merece o troféu? 🏆"],
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
      const topics = PHOTO_TOPICS[bot.name];
      if (!topics) continue;

      const topic = topics[Math.floor(Math.random() * topics.length)];
      const captions = BOT_CAPTIONS[bot.name] || ["Bom dia PlayLike! ✨"];
      const caption = captions[Math.floor(Math.random() * captions.length)];

      // Use Unsplash for a real photo
      const photoUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(topic)}&sig=${Date.now()}`;

      let content = caption;

      // Try AI-generated caption
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
                  content: `Você é ${bot.name}, perfil brasileiro do app PlayLike. Escreva uma legenda curta (1-2 frases) para uma foto sobre "${topic}". Português BR, com gírias e 1-2 emojis. Sem aspas. Inclua #PlayLike.`,
                },
                { role: "user", content: `Legenda para foto de: ${topic}` },
              ],
            }),
          });
          if (aiRes.ok) {
            const d = await aiRes.json();
            const txt = d.choices?.[0]?.message?.content;
            if (txt) content = txt;
          }
        } catch { /* fallback */ }
      }

      const { error } = await supabase.from("posts").insert({
        user_id: bot.user_id,
        content,
        image_url: photoUrl,
        game_on: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      if (!error) results.push(bot.name);
    }

    return new Response(JSON.stringify({ posted: results, count: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bot-foto error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
