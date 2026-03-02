import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChats } from "@/hooks/useChat";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Clock, Heart } from "lucide-react";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ChatsPage = () => {
  const { user } = useAuth();
  const { chats, isLoading } = useChats();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        <h1 className="font-cinzel text-2xl text-primary">Meus Chats 💬</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <h3 className="font-cinzel text-lg text-foreground">Nenhum chat ainda</h3>
            <p className="text-muted-foreground text-sm">
              Chats são abertos quando um juiz envia um mimo para um jogador.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => {
              const isExpired = isPast(new Date(chat.data_fim));
              const isActive = chat.ativa && !isExpired;
              const otherProfile = user?.id === chat.juiz_id ? chat.jogador_profile : chat.juiz_profile;
              const role = user?.id === chat.juiz_id ? "Jogador" : "Juiz";

              return (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                    {otherProfile?.avatar_url ? (
                      <img src={otherProfile.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-primary font-bold">{otherProfile?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-foreground truncate">{otherProfile?.name}</span>
                      <span className="text-[10px] text-muted-foreground border border-border rounded px-1">
                        {role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-primary fill-primary" />
                        {chat.likes_enviados.toLocaleString("pt-BR")} mimo
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {isExpired ? (
                          <span className="text-destructive">Expirado</span>
                        ) : (
                          <span>
                            Até {format(new Date(chat.data_fim), "dd/MM", { locale: ptBR })}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    isActive ? "bg-success" : "bg-muted"
                  )} />
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatsPage;
