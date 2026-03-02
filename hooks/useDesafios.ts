import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";

export interface Desafio {
  id: string;
  juiz_id: string;
  video_url: string | null;
  texto: string | null;
  aprovado: boolean;
  rejeitado: boolean;
  likes_pago: number;
  created_at: string;
  juiz_profile?: { name: string; avatar_url: string | null; total_likes: number };
}

export function useDesafios() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: desafiosAprovados = [], isLoading } = useQuery({
    queryKey: ["desafios-aprovados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("desafios")
        .select("*")
        .eq("aprovado", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      // Fetch juiz profiles
      const juizIds = [...new Set((data || []).map((d: any) => d.juiz_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url, total_likes")
        .in("user_id", juizIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      return (data || []).map((d: any) => ({
        ...d,
        juiz_profile: profileMap.get(d.juiz_id) || null,
      }));
    },
  });

  const { data: meusDesafios = [] } = useQuery({
    queryKey: ["meus-desafios", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("desafios")
        .select("*")
        .eq("juiz_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: pendentes = [], isLoading: loadingPendentes } = useQuery({
    queryKey: ["desafios-pendentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("desafios")
        .select("*")
        .eq("aprovado", false)
        .eq("rejeitado", false)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const juizIds = [...new Set((data || []).map((d: any) => d.juiz_id))];
      if (juizIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url, total_likes")
        .in("user_id", juizIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      return (data || []).map((d: any) => ({
        ...d,
        juiz_profile: profileMap.get(d.juiz_id) || null,
      }));
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("desafios-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "desafios" }, () => {
        queryClient.invalidateQueries({ queryKey: ["desafios-aprovados"] });
        queryClient.invalidateQueries({ queryKey: ["meus-desafios"] });
        queryClient.invalidateQueries({ queryKey: ["desafios-pendentes"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const criarDesafio = async (texto: string, videoUrl?: string) => {
    if (!user || !profile) return;

    if (profile.total_likes < 100) {
      toast.error("Você precisa de pelo menos 100 likes para criar um desafio!");
      return;
    }

    // Deduct 100 likes
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ total_likes: profile.total_likes - 100 })
      .eq("user_id", user.id);

    if (updateErr) {
      toast.error("Erro ao debitar likes");
      return;
    }

    const { error } = await supabase.from("desafios").insert({
      juiz_id: user.id,
      texto,
      video_url: videoUrl || null,
      likes_pago: 100,
    });

    if (error) {
      // Refund
      await supabase
        .from("profiles")
        .update({ total_likes: profile.total_likes })
        .eq("user_id", user.id);
      toast.error("Erro ao criar desafio");
      return;
    }

    toast.success("Desafio enviado! ⏳ Aguardando aprovação do admin");
    queryClient.invalidateQueries({ queryKey: ["meus-desafios"] });
  };

  const aprovarDesafio = async (desafioId: string) => {
    const { error } = await supabase
      .from("desafios")
      .update({ aprovado: true })
      .eq("id", desafioId);

    if (!error) {
      toast.success("Desafio aprovado e publicado! ✅");
      queryClient.invalidateQueries({ queryKey: ["desafios-pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["desafios-aprovados"] });
    }
  };

  const rejeitarDesafio = async (desafio: Desafio) => {
    // Refund likes
    const { data: juizProfile } = await supabase
      .from("profiles")
      .select("total_likes")
      .eq("user_id", desafio.juiz_id)
      .single();

    if (juizProfile) {
      await supabase
        .from("profiles")
        .update({ total_likes: juizProfile.total_likes + desafio.likes_pago })
        .eq("user_id", desafio.juiz_id);
    }

    const { error } = await supabase
      .from("desafios")
      .update({ rejeitado: true })
      .eq("id", desafio.id);

    if (!error) {
      toast.success("Desafio rejeitado. Likes devolvidos ao juiz.");
      queryClient.invalidateQueries({ queryKey: ["desafios-pendentes"] });
    }
  };

  return {
    desafiosAprovados,
    meusDesafios,
    pendentes,
    isLoading,
    loadingPendentes,
    criarDesafio,
    aprovarDesafio,
    rejeitarDesafio,
  };
}
