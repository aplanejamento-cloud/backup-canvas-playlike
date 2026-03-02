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

    const { codigo_ticket, doador_id } = await req.json();

    if (!codigo_ticket || !doador_id) {
      return new Response(JSON.stringify({ error: "Código e doador obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the resgate by ticket code
    const { data: resgate, error: rErr } = await supabase
      .from("resgates")
      .select("*, premios(*)")
      .eq("codigo_ticket", codigo_ticket)
      .eq("status", "pendente")
      .single();

    if (rErr || !resgate) {
      return new Response(JSON.stringify({ error: "Ticket não encontrado ou já utilizado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user has enough likes (already deducted at resgate time, so just verify resgate is valid)
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("total_likes, name")
      .eq("user_id", resgate.usuario_id)
      .single();

    if (!userProfile) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark resgate as completed
    await supabase
      .from("resgates")
      .update({ status: "retirado" })
      .eq("id", resgate.id);

    // Notify user
    await supabase.from("notifications").insert({
      user_id: resgate.usuario_id,
      tipo: "premio",
      from_user_id: doador_id,
      mensagem: `🎁 Seu prêmio foi entregue! Ticket: ${codigo_ticket}`,
    });

    return new Response(JSON.stringify({
      success: true,
      usuario_nome: userProfile.name,
      premio_titulo: resgate.premios?.titulo || "Prêmio",
      message: "✅ Produto entregue com sucesso!",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-ticket error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
