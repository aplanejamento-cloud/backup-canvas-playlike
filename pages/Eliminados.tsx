import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Skull, Search } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";

const Eliminados = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: eliminados = [], isLoading } = useQuery({
    queryKey: ["eliminados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url, total_likes, user_type")
        .eq("total_likes", 0)
        .eq("is_bot", false)
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const filtered = search.trim()
    ? eliminados.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : eliminados;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <InviteButton />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-cinzel text-2xl text-destructive flex items-center justify-center gap-2">
            <Skull className="w-7 h-7" /> Eliminados
          </h1>
          <p className="text-sm text-muted-foreground">
            Jogadores com 0 likes. Aguardam 3 dias para retornar ao jogo.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-input border-border"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Skull className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhum jogador eliminado no momento.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <button
                key={p.user_id}
                onClick={() => navigate(`/profile/${p.user_id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-destructive/50 transition-colors text-left"
              >
                <Avatar className="w-12 h-12 border-2 border-destructive/30">
                  <AvatarImage src={p.avatar_url || ""} />
                  <AvatarFallback className="bg-secondary text-foreground font-cinzel">
                    {p.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-destructive font-medium">💀 Eliminado · 0 likes</p>
                </div>
                <span className="text-xs text-muted-foreground capitalize">{p.user_type}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Eliminados;
