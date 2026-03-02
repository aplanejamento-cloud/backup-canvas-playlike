import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface RankedPlayer {
  id: string;
  name: string;
  avatar_url: string | null;
  total_likes: number;
  user_id: string;
}

export function useTopRanking(limit = 10) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ranking", limit],
    queryFn: async (): Promise<RankedPlayer[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, total_likes, user_id")
        .eq("user_type", "jogador")
        .eq("is_bot", false)
        .order("total_likes", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });

  // Realtime subscription for profile changes
  useEffect(() => {
    const channel = supabase
      .channel("ranking-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ranking"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { players: data || [], isLoading };
}
