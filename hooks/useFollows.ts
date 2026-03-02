import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFollows() {
  const { user } = useAuth();

  const { data: following, isLoading } = useQuery({
    queryKey: ["following", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (error) throw error;
      return data?.map(f => f.following_id) || [];
    },
    enabled: !!user,
  });

  return { following: following || [], isLoading };
}

export function useIsFollowing(userId: string) {
  const { following } = useFollows();
  return following.includes(userId);
}

export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      targetUserId, 
      isFollowing 
    }: { 
      targetUserId: string; 
      isFollowing: boolean;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;

        // Notify the followed user
        await supabase
          .from("notifications" as any)
          .insert({
            user_id: targetUserId,
            tipo: "follow",
            from_user_id: user.id,
            mensagem: "começou a seguir você! 👥",
          } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["posts", "fan-club"] });
    },
  });
}
