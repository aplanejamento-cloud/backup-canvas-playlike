import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface Comment {
  id: string;
  post_id: string;
  juiz_id: string;
  texto: string | null;
  midia_url: string | null;
  midia_type: string | null;
  likes: number;
  bombas: number;
  created_at: string;
  juiz?: {
    name: string;
    avatar_url: string | null;
  };
  myReaction?: string | null;
}

export function useComments(postId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("comments" as any)
        .select(`
          *,
          juiz:profiles!comments_juiz_id_fkey(name, avatar_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows = (data || []) as any[];

      // Fetch my reactions if logged in
      let myReactionsMap: Record<string, string> = {};
      if (user && rows.length > 0) {
        const commentIds = rows.map((c: any) => c.id);
        const { data: reactions } = await supabase
          .from("comment_reactions" as any)
          .select("comment_id, reaction_type")
          .eq("user_id", user.id)
          .in("comment_id", commentIds);
        (reactions || []).forEach((r: any) => {
          myReactionsMap[r.comment_id] = r.reaction_type;
        });
      }

      return rows.map((c: any) => ({
        ...c,
        juiz: Array.isArray(c.juiz) ? c.juiz[0] : c.juiz,
        myReaction: myReactionsMap[c.id] || null,
      }));
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "comments",
        filter: `post_id=eq.${postId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "comment_reactions",
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId, queryClient]);

  return { comments, isLoading };
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      postId,
      texto,
      midiaUrl,
      midiaType,
    }: {
      postId: string;
      texto: string;
      midiaUrl?: string;
      midiaType?: string;
    }) => {
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("comments" as any)
        .insert({
          post_id: postId,
          juiz_id: user.id,
          texto: texto || null,
          midia_url: midiaUrl || null,
          midia_type: midiaType || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["comments", vars.postId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase
        .from("comments" as any)
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["comments", vars.postId] });
    },
  });
}

export function useReactToComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      commentId,
      reactionType,
      postId,
      currentReaction,
    }: {
      commentId: string;
      reactionType: "like" | "bomba";
      postId: string;
      currentReaction: string | null;
    }) => {
      if (!user) throw new Error("Não autenticado");

      // Remove existing reaction first (if any)
      if (currentReaction) {
        await supabase
          .from("comment_reactions" as any)
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
      }

      // If toggling off, don't add a new one
      if (currentReaction === reactionType) return;

      // Add new reaction
      const { error } = await supabase
        .from("comment_reactions" as any)
        .insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType,
        });

      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["comments", vars.postId] });
    },
  });
}
