import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DailyReport {
  totalLikesToday: number;
  rankPosition: number;
  totalPlayers: number;
  duelsWon: number;
  postsToday: number;
  remixesToday: number;
}

export function useDailyReport() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["daily-report", user?.id],
    queryFn: async (): Promise<DailyReport> => {
      if (!user) throw new Error("Not authenticated");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Likes received today via interactions
      const { count: likesToday } = await supabase
        .from("post_interactions")
        .select("*", { count: "exact", head: true })
        .in("interaction_type", ["like", "love"])
        .gte("created_at", todayISO)
        .in("post_id", (
          await supabase.from("posts").select("id").eq("user_id", user.id)
        ).data?.map(p => p.id) || []);

      // Rank position
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("user_id, total_likes")
        .eq("user_type", "jogador")
        .order("total_likes", { ascending: false });

      const rank = (allProfiles || []).findIndex(p => p.user_id === user.id) + 1;

      // Duels won
      const { count: duelsWon } = await supabase
        .from("duels")
        .select("*", { count: "exact", head: true })
        .eq("winner_id", user.id)
        .eq("status", "completed");

      // Posts today
      const { count: postsToday } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayISO);

      // Remixes today
      const { count: remixesToday } = await supabase
        .from("remixes")
        .select("*", { count: "exact", head: true })
        .eq("remixador_id", user.id)
        .gte("created_at", todayISO);

      return {
        totalLikesToday: likesToday || 0,
        rankPosition: rank || 0,
        totalPlayers: allProfiles?.length || 0,
        duelsWon: duelsWon || 0,
        postsToday: postsToday || 0,
        remixesToday: remixesToday || 0,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
