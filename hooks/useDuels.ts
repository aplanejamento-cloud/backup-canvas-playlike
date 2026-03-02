import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Duel {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: "pending" | "active" | "completed" | "refused";
  winner_id: string | null;
  challenger_votes: number;
  challenged_votes: number;
  created_at: string;
  resolved_at: string | null;
  challenger_profile?: { name: string; avatar_url: string | null; total_likes: number };
  challenged_profile?: { name: string; avatar_url: string | null; total_likes: number };
}

export function useDuels() {
  const { user } = useAuth();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [pendingDuels, setPendingDuels] = useState<Duel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDuels = async () => {
    const { data, error } = await supabase
      .from("duels")
      .select(`
        *,
        challenger_profile:profiles!duels_challenger_id_fkey(name, avatar_url, total_likes),
        challenged_profile:profiles!duels_challenged_id_fkey(name, avatar_url, total_likes)
      `)
      .in("status", ["pending", "active", "completed", "refused"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setDuels(data.map((d: any) => ({
        ...d,
        challenger_profile: d.challenger_profile,
        challenged_profile: d.challenged_profile,
      })));
    }
    setIsLoading(false);
  };

  const fetchPending = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("duels")
      .select(`
        *,
        challenger_profile:profiles!duels_challenger_id_fkey(name, avatar_url, total_likes),
        challenged_profile:profiles!duels_challenged_id_fkey(name, avatar_url, total_likes)
      `)
      .eq("status", "pending")
      .eq("challenged_id", user.id);

    if (data) setPendingDuels(data as any);
  };

  useEffect(() => {
    fetchDuels();
    fetchPending();

    // Realtime subscription
    const channel = supabase
      .channel("duels-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "duels" }, () => {
        fetchDuels();
        fetchPending();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "duel_votes" }, () => {
        fetchDuels();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const challengeUser = async (challengedId: string) => {
    if (!user) return;
    if (challengedId === user.id) {
      toast.error("Você não pode desafiar a si mesmo!");
      return;
    }

    const { error } = await supabase.from("duels").insert({
      challenger_id: user.id,
      challenged_id: challengedId,
    });

    if (error) {
      toast.error("Erro ao criar desafio");
      return;
    }

    // Notify challenged user
    await supabase.from("notifications").insert({
      user_id: challengedId,
      tipo: "duelo",
      from_user_id: user.id,
      mensagem: "⚔️ Você foi desafiado para um duelo! Aceite ou recuse.",
    });

    toast.success("Desafio enviado! ⚔️");
    fetchDuels();
  };

  const acceptDuel = async (duelId: string) => {
    const { error } = await supabase
      .from("duels")
      .update({ status: "active" })
      .eq("id", duelId);

    if (!error) {
      toast.success("Duelo aceito! Que comecem os votos! ⚔️");
      fetchDuels();
      fetchPending();
    }
  };

  const refuseDuel = async (duel: Duel) => {
    // Refuse: challenged loses 100, challenger gains 100
    await supabase
      .from("duels")
      .update({ status: "refused", resolved_at: new Date().toISOString() })
      .eq("id", duel.id);

    // Transfer 100 likes
    await supabase.rpc("has_role", { _user_id: duel.challenged_id, _role: "user" }); // dummy to ensure auth
    
    // Update profiles
    const { data: challengedProfile } = await supabase
      .from("profiles")
      .select("total_likes")
      .eq("user_id", duel.challenged_id)
      .single();

    const { data: challengerProfile } = await supabase
      .from("profiles")
      .select("total_likes")
      .eq("user_id", duel.challenger_id)
      .single();

    if (challengedProfile && challengerProfile) {
      await supabase
        .from("profiles")
        .update({ total_likes: Math.max(0, challengedProfile.total_likes - 100) })
        .eq("user_id", duel.challenged_id);

      await supabase
        .from("profiles")
        .update({ total_likes: challengerProfile.total_likes + 100 })
        .eq("user_id", duel.challenger_id);
    }

    toast.info("Desafio recusado! -100 likes 😔");
    fetchDuels();
    fetchPending();
  };

  const voteDuel = async (duelId: string, votedFor: string, voteType: "play" | "likes") => {
    if (!user) return;

    const voteValue = voteType === "play" ? 1 : 100;

    const { error } = await supabase.from("duel_votes").insert({
      duel_id: duelId,
      voter_id: user.id,
      voted_for: votedFor,
      vote_type: voteType,
      vote_value: voteValue,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Você já votou neste duelo!");
      } else {
        toast.error("Erro ao votar");
      }
      return;
    }

    // Update duel vote counts
    const duel = duels.find((d) => d.id === duelId);
    if (duel) {
      const field = votedFor === duel.challenger_id ? "challenger_votes" : "challenged_votes";
      await supabase
        .from("duels")
        .update({ [field]: (votedFor === duel.challenger_id ? duel.challenger_votes : duel.challenged_votes) + voteValue })
        .eq("id", duelId);
    }

    toast.success(`Voto registrado! ${voteType === "play" ? "💎 1 Play" : "❤️ 100 Likes"}`);
    fetchDuels();
  };

  return {
    duels,
    pendingDuels,
    isLoading,
    challengeUser,
    acceptDuel,
    refuseDuel,
    voteDuel,
    refresh: fetchDuels,
  };
}
