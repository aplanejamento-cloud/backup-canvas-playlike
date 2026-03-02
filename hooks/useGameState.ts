import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GameState {
  id: number;
  game_on: boolean;
  start_date: string | null;
  updated_at: string;
}

export function useGameState() {
  const qc = useQueryClient();

  const { data: gameState, isLoading } = useQuery({
    queryKey: ["game_state"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_state")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data as GameState;
    },
    refetchInterval: 30_000,
  });

  const toggleGame = useMutation({
    mutationFn: async (newState: boolean) => {
      const { error } = await supabase
        .from("game_state")
        .update({
          game_on: newState,
          start_date: newState ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: async (_, newState) => {
      qc.invalidateQueries({ queryKey: ["game_state"] });
      toast.success(newState ? "🎮 Jogo LIGADO!" : "🔒 Jogo DESLIGADO!");
      // Notify all users
      await supabase.rpc("notify_all_game_state", { p_game_on: newState });
    },
    onError: () => toast.error("Erro ao alterar estado do jogo"),
  });

  return { gameState, isLoading, toggleGame };
}
