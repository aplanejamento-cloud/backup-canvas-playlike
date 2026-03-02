import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MAX_POSTS_PER_DAY = 3;

export function useJuizPostLimit() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const isJuiz = profile?.user_type === "juiz";

  const { data: postsHoje = 0, isLoading } = useQuery({
    queryKey: ["juiz-posts-hoje", user?.id],
    queryFn: async (): Promise<number> => {
      if (!user || !isJuiz) return 0;

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("juiz_posts_diarios" as any)
        .select("post_count")
        .eq("juiz_id", user.id)
        .eq("data", today)
        .maybeSingle();

      return (data as any)?.post_count ?? 0;
    },
    enabled: isJuiz && !!user,
    refetchInterval: 30_000,
  });

  const canPost = isJuiz && postsHoje < MAX_POSTS_PER_DAY;
  const remaining = Math.max(0, MAX_POSTS_PER_DAY - postsHoje);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["juiz-posts-hoje", user?.id] });
  };

  return { postsHoje, canPost, remaining, isLoading, isJuiz, invalidate };
}
