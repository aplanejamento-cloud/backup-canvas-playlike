import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCreateCulturaPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ content, categoria, boost }: { content: string; categoria: string; boost: number }) => {
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content,
          tipo: "cultural",
          categoria,
          boost_likes: boost,
          likes_count: boost,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Add boost to user's total_likes
      if (boost > 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_likes")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          await supabase
            .from("profiles")
            .update({ total_likes: (profile.total_likes || 0) + boost } as any)
            .eq("user_id", user.id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["cultura-trending"] });
    },
  });
}

export function useTrendingCultura() {
  return useQuery({
    queryKey: ["cultura-trending"],
    queryFn: async () => {
      const { data } = await (supabase
        .from("posts")
        .select(`
          *,
          author:profiles!posts_user_id_fkey(id, name, avatar_url, user_type, is_bot)
        `) as any)
        .eq("tipo", "cultural")
        .eq("deletado", false)
        .gt("expires_at", new Date().toISOString())
        .order("likes_count", { ascending: false })
        .limit(10);

      return (data || []).map((post: any) => ({
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
      }));
    },
  });
}
