import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChats, useChatMessages, useSendMessage } from "@/hooks/useChat";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ArrowLeft, MessageSquare, Clock, Paperclip } from "lucide-react";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chats, isLoading: chatsLoading } = useChats();
  const { messages, isLoading: messagesLoading } = useChatMessages(chatId || null);
  const sendMessage = useSendMessage();
  const [content, setContent] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const chat = chats.find(c => c.id === chatId);
  const isExpired = chat ? isPast(new Date(chat.data_fim)) : false;
  const isActive = chat?.ativa && !isExpired;

  const otherProfile = chat
    ? (user?.id === chat.juiz_id ? chat.jogador_profile : chat.juiz_profile)
    : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!chatId || !content.trim()) return;
    if (!isActive) {
      toast.error("Este chat expirou ou está inativo.");
      return;
    }
    try {
      await sendMessage.mutateAsync({ chatId, content: content.trim() });
      setContent("");
    } catch {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !user) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("Máximo 50MB!"); return; }
    setUploadingMedia(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${chatId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("post-media").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
      let mediaType = "file";
      if (file.type.startsWith("image/")) mediaType = "image";
      else if (file.type.startsWith("video/")) mediaType = "video";
      else if (file.type.startsWith("audio/")) mediaType = "audio";
      else if (file.type === "application/pdf") mediaType = "pdf";
      await sendMessage.mutateAsync({ chatId, mediaUrl: urlData.publicUrl, mediaType });
      toast.success("Mídia enviada!");
    } catch {
      toast.error("Erro ao enviar mídia");
    }
    setUploadingMedia(false);
    e.target.value = "";
  };

  if (chatsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-12 text-center max-w-lg">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="font-cinzel text-xl text-foreground mb-2">Chat não encontrado</h2>
          <p className="text-muted-foreground text-sm mb-6">Este chat não existe ou você não tem acesso.</p>
          <Button onClick={() => navigate("/chats")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar aos chats
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex flex-col flex-1 container mx-auto max-w-2xl px-4 py-4 gap-4">
        {/* Chat header */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/chats")} className="h-8 px-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
            {otherProfile?.avatar_url ? (
              <img src={otherProfile.avatar_url} className="w-full h-full object-cover" alt="" />
            ) : (
              <span className="text-primary font-bold">{otherProfile?.name?.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{otherProfile?.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {isExpired ? (
                <span className="text-destructive">Chat expirado</span>
              ) : (
                <span>
                  Chat ativo até{" "}
                  <span className="text-primary font-medium">
                    {format(new Date(chat.data_fim), "dd/MM", { locale: ptBR })}
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0">
            💛 {chat.likes_enviados.toLocaleString("pt-BR")} mimo
          </div>
        </div>

        {/* Expired banner */}
        {isExpired && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive text-center">
            Este chat expirou em {format(new Date(chat.data_fim), "dd/MM/yyyy", { locale: ptBR })}.
            Para reabrir, o juiz precisa enviar um novo mimo.
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto min-h-48">
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Nenhuma mensagem ainda. Diga olá! 👋</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn("flex gap-2", isMine ? "flex-row-reverse" : "flex-row")}>
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                    {msg.sender_profile?.avatar_url ? (
                      <img src={msg.sender_profile.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-[10px] text-primary font-bold">{msg.sender_profile?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className={cn("max-w-[75%] space-y-1", isMine ? "items-end" : "items-start")}>
                    {!isMine && msg.sender_profile?.name && (
                      <button
                        onClick={() => navigate(`/profile/${msg.sender_id}`)}
                        className="text-[10px] font-semibold text-primary hover:underline"
                      >
                        {msg.sender_profile.name}
                      </button>
                    )}
                    <div
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm break-words",
                        isMine
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card border border-border text-foreground rounded-tl-sm"
                      )}
                    >
                      {msg.content && <p>{msg.content}</p>}
                      {msg.media_url && msg.media_type === "image" && (
                        <img src={msg.media_url} className="rounded-lg max-w-full max-h-48 object-cover mt-1" alt="" />
                      )}
                      {msg.media_url && msg.media_type === "video" && (
                        <video src={msg.media_url} controls className="rounded-lg max-w-full max-h-48 mt-1" />
                      )}
                      {msg.media_url && msg.media_type === "audio" && (
                        <audio src={msg.media_url} controls className="mt-1 w-full" />
                      )}
                      {msg.media_url && msg.media_type === "pdf" && (
                        <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-primary underline mt-1 block">📄 Abrir PDF</a>
                      )}
                    </div>
                    <time className={cn("text-[10px] text-muted-foreground", isMine ? "text-right" : "text-left")}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                    </time>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        {isActive && (
          <div className="flex gap-2 items-end bg-card border border-border rounded-xl p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => mediaInputRef.current?.click()}
              disabled={uploadingMedia}
              className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-primary"
            >
              {uploadingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </Button>
            <input ref={mediaInputRef} type="file" accept="image/*,video/*,audio/*,.pdf" className="hidden" onChange={handleMediaUpload} />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva uma mensagem..."
              className="min-h-[40px] max-h-32 resize-none bg-transparent border-none p-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sendMessage.isPending || !content.trim()}
              className="h-8 w-8 p-0 bg-primary text-primary-foreground shrink-0"
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;
