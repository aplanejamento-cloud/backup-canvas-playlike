import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post, FeedTab } from "@/types/feed";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export function usePosts(tab: FeedTab) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchPosts = async (): Promise<Post[]> => {
    let query = supabase
      .from("posts")
      .select(`
        *,
        author:profiles!posts_user_id_fkey(id, name, avatar_url, user_type, is_bot)
      `)
      .gt("expires_at", new Date().toISOString())
      .eq("deletado", false);

    switch (tab) {
      case "na-tela":
        query = query.order("likes_count", { ascending: false }).limit(100);
        break;
      case "acontecendo":
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        query = query
          .gte("created_at", yesterday.toISOString())
          .order("created_at", { ascending: false });
        break;
      case "fan-club":
        if (!user) return [];
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);
        const followingIds = follows?.map(f => f.following_id) || [];
        if (followingIds.length === 0) return [];
        query = query
          .in("user_id", followingIds)
          .order("created_at", { ascending: false });
        break;
      case "lacrou":
        query = query
          .gte("likes_count", 1000)
          .order("likes_count", { ascending: false });
        break;
      case "bomba":
        query = query
          .lte("likes_count", -1000)
          .order("likes_count", { ascending: true });
        break;
      case "cultura":
        query = (query as any)
          .eq("tipo", "cultural")
          .order("likes_count", { ascending: false });
        break;
    }

    const { data, error } = await query;
    if (error) throw error;

    const posts = (data || []).map(post => ({
      ...post,
      author: Array.isArray(post.author) ? post.author[0] : post.author
    })) as Post[];

    // Fetch additional images for posts
    if (posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const { data: postImages } = await supabase
        .from("post_images")
        .select("post_id, image_url, position")
        .in("post_id", postIds)
        .order("position");
      
      const imageMap = new Map<string, string[]>();
      (postImages || []).forEach((img: any) => {
        const existing = imageMap.get(img.post_id) || [];
        existing.push(img.image_url);
        imageMap.set(img.post_id, existing);
      });

      return posts.map(p => ({
        ...p,
        additional_images: imageMap.get(p.id) || [],
      }));
    }

    return posts;
  };

  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ["posts", tab, user?.id],
    queryFn: fetchPosts,
    enabled: tab !== "fan-club" || !!user,
  });

  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return { posts: posts || [], isLoading, error, refetch };
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ content, imageUrl, videoUrl, musicUrl, additionalImages }: {
      content: string; imageUrl?: string; videoUrl?: string; musicUrl?: string; additionalImages?: string[];
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Se for juiz, valida limite de 3 posts/dia ANTES de inserir
      if (profile?.user_type === "juiz") {
        const today = new Date().toISOString().split("T")[0];
        const { data: daily } = await supabase
          .from("juiz_posts_diarios" as any)
          .select("post_count")
          .eq("juiz_id", user.id)
          .eq("data", today)
          .maybeSingle();
        const count = (daily as any)?.post_count ?? 0;
        if (count >= 3) throw new Error("Limite de 3 posts/dia atingido!");
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content,
          image_url: imageUrl || null,
          video_url: videoUrl || null,
          music_url: musicUrl || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Se for juiz, incrementa contador diário via RPC
      if (profile?.user_type === "juiz") {
        await supabase.rpc("increment_juiz_post_count" as any, { p_juiz_id: user.id });
      }

      // Insert additional images
      if (additionalImages && additionalImages.length > 0) {
        const rows = additionalImages.map((url, i) => ({
          post_id: data.id,
          image_url: url,
          position: i + 1,
        }));
        await supabase.from("post_images").insert(rows as any);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["juiz-posts-hoje"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      // Soft delete: mark as deletado, preserving likes
      const { error } = await supabase
        .from("posts")
        .update({ deletado: true } as any)
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
