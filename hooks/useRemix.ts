import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useRemixCount(postId: string) {
  return useQuery({
    queryKey: ["remix-count", postId],
    queryFn: async () => {
      const { count } = await supabase
        .from("remixes")
        .select("*", { count: "exact", head: true })
        .eq("post_original_id", postId);
      return count || 0;
    },
  });
}

export function useCreateRemix() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      originalPostId,
      remixPostId,
    }: {
      originalPostId: string;
      remixPostId: string;
    }) => {
      if (!user) throw new Error("Login necessário");

      // Insert remix record
      const { error } = await supabase.from("remixes").insert({
        post_original_id: originalPostId,
        remixador_id: user.id,
        remix_post_id: remixPostId,
      } as any);
      if (error) throw error;

      // +10 likes to original post author
      const { data: originalPost } = await supabase
        .from("posts")
        .select("user_id, remix_count")
        .eq("id", originalPostId)
        .single();

      if (originalPost) {
        // Update remix_count on original post
        await supabase
          .from("posts")
          .update({ remix_count: (originalPost.remix_count || 0) + 1 } as any)
          .eq("id", originalPostId);

        // +10 likes to original author
        await supabase
          .from("profiles")
          .update({
            total_likes: (await supabase
              .from("profiles")
              .select("total_likes")
              .eq("user_id", originalPost.user_id)
              .single()
              .then(r => r.data?.total_likes || 0)) + 10,
          } as any)
          .eq("user_id", originalPost.user_id);

        // Notification
        await supabase.from("notifications").insert({
          user_id: originalPost.user_id,
          tipo: "remix",
          post_id: originalPostId,
          from_user_id: user.id,
          mensagem: "Seu post foi remixado! +10 likes 🔄✨",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remix-count"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Remix publicado! O autor original ganhou +10 likes 🔄✨");
    },
  });
}
