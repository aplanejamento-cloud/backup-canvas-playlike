import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InteractionType, PostInteraction } from "@/types/feed";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export function usePostInteractions(postId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: interactions, isLoading } = useQuery({
    queryKey: ["interactions", postId],
    queryFn: async (): Promise<PostInteraction[]> => {
      const { data, error } = await supabase
        .from("post_interactions")
        .select("*")
        .eq("post_id", postId);

      if (error) throw error;
      return data || [];
    },
  });

  const userInteraction = interactions?.find(i => i.user_id === user?.id);

  // Realtime subscription for interactions
  useEffect(() => {
    const channel = supabase
      .channel(`interactions-${postId}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "post_interactions",
          filter: `post_id=eq.${postId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["interactions", postId] });
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  return { 
    interactions: interactions || [], 
    userInteraction,
    isLoading 
  };
}

export function useInteract() {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      postId, 
      interactionType 
    }: { 
      postId: string; 
      interactionType: InteractionType;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Check if user already has an interaction on this post
      const { data: existing } = await supabase
        .from("post_interactions")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        // Remove existing interaction first
        await supabase
          .from("post_interactions")
          .delete()
          .eq("id", existing.id);
      }

      // Create new interaction
      const { data, error } = await supabase
        .from("post_interactions")
        .insert({
          post_id: postId,
          user_id: user.id,
          interaction_type: interactionType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      refreshProfile();
    },
  });
}

export function useRemoveInteraction() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (interactionId: string) => {
      const { error } = await supabase
        .from("post_interactions")
        .delete()
        .eq("id", interactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      refreshProfile();
    },
  });
}
