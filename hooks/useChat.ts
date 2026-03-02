import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Chat {
  id: string;
  juiz_id: string;
  jogador_id: string;
  likes_enviados: number;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
  created_at: string;
  juiz_profile?: { name: string; avatar_url: string | null };
  jogador_profile?: { name: string; avatar_url: string | null };
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  sender_profile?: { name: string; avatar_url: string | null };
}

export function useChats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["chats", user?.id],
    queryFn: async (): Promise<Chat[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("chats" as any)
        .select("*")
        .or(`juiz_id.eq.${user.id},jogador_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const items = (data || []) as any[];

      // Fetch profiles
      const userIds = [...new Set(items.flatMap((c: any) => [c.juiz_id, c.jogador_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      return items.map((c: any) => ({
        ...c,
        juiz_profile: profileMap.get(c.juiz_id),
        jogador_profile: profileMap.get(c.jogador_id),
      }));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, () => {
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return { chats, isLoading };
}

export function useChatMessages(chatId: string | null) {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!chatId) return [];

      const { data, error } = await supabase
        .from("chat_messages" as any)
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      const items = (data || []) as any[];

      const senderIds = [...new Set(items.map((m: any) => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", senderIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      return items.map((m: any) => ({
        ...m,
        sender_profile: profileMap.get(m.sender_id),
      }));
    },
    enabled: !!chatId,
  });

  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`chat-messages-${chatId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `chat_id=eq.${chatId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", chatId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId, queryClient]);

  return { messages, isLoading };
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      chatId,
      content,
      mediaUrl,
      mediaType,
    }: {
      chatId: string;
      content?: string;
      mediaUrl?: string;
      mediaType?: string;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("chat_messages" as any)
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: content || null,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", vars.chatId] });
    },
  });
}

export function useSendMimo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jogadorId,
      likes,
    }: {
      jogadorId: string;
      likes: number;
    }): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase.rpc("send_mimo" as any, {
        p_juiz_id: user.id,
        p_jogador_id: jogadorId,
        p_likes: likes,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
