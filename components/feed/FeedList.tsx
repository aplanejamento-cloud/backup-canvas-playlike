import { useState, useCallback, useEffect } from "react";
import { FeedTab } from "@/types/feed";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "./PostCard";
import { Loader2, Inbox, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FeedListProps {
  tab: FeedTab;
}

const emptyMessages: Record<FeedTab, { title: string; description: string }> = {
  "na-tela": { title: "Nenhum post ainda", description: "Seja o primeiro a publicar e apareça no Top 100!" },
  "acontecendo": { title: "Nada acontecendo", description: "Não há posts nas últimas 24 horas. Que tal criar um?" },
  "fan-club": { title: "Seu Fan Club está vazio", description: "Siga outros jogadores para ver os posts deles aqui!" },
  "lacrou": { title: "Nenhum post lacrou ainda", description: "Posts com +1.000 likes aparecem aqui. Continue interagindo!" },
  "bomba": { title: "Nenhuma bomba", description: "Posts com -1.000 likes ou menos aparecem aqui. Cuidado!" },
  "duelos": { title: "Nenhum duelo ativo", description: "Desafie alguém na página de Duelos!" },
  "cultura": { title: "Nenhum post cultural", description: "Use os templates para postar conteúdo cultural com boost!" },
};

// Duelos feed component
const DuelosFeed = () => {
  const { data: duels = [], isLoading } = useQuery({
    queryKey: ["duels-feed"],
    queryFn: async () => {
      const { data } = await supabase
        .from("duels")
        .select("*")
        .in("status", ["active", "completed", "refused"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (!data?.length) return [];

      const userIds = [...new Set(data.flatMap((d) => [d.challenger_id, d.challenged_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      return data.map((d) => ({
        ...d,
        challenger: profileMap.get(d.challenger_id),
        challenged: profileMap.get(d.challenged_id),
      }));
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!duels.length) return <div className="text-center py-12 space-y-3"><Inbox className="w-12 h-12 mx-auto text-muted-foreground/50" /><h3 className="font-cinzel text-lg text-foreground">Nenhum duelo ativo</h3></div>;

  return (
    <div className="space-y-3">
      {duels.map((duel: any) => (
        <div key={duel.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-center flex-1">
              <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto mb-1 overflow-hidden">
                {duel.challenger?.avatar_url ? <img src={duel.challenger.avatar_url} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-primary font-bold">{duel.challenger?.name?.charAt(0)}</span>}
              </div>
              <p className="text-xs font-medium text-foreground truncate">{duel.challenger?.name}</p>
              <p className="text-xs text-primary font-bold">{duel.challenger_votes} votos</p>
            </div>
            <div className="text-center px-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${duel.status === "active" ? "bg-green-500/20 text-green-500" : duel.status === "refused" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
                {duel.status === "active" ? "AO VIVO" : duel.status === "refused" ? "ARREGOU" : "FINALIZADO"}
              </span>
              <p className="text-lg font-bold text-muted-foreground mt-1">VS</p>
            </div>
            <div className="text-center flex-1">
              <div className="w-12 h-12 rounded-full bg-accent/20 mx-auto mb-1 overflow-hidden">
                {duel.challenged?.avatar_url ? <img src={duel.challenged.avatar_url} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-accent font-bold">{duel.challenged?.name?.charAt(0)}</span>}
              </div>
              <p className="text-xs font-medium text-foreground truncate">{duel.challenged?.name}</p>
              <p className="text-xs text-accent font-bold">{duel.challenged_votes} votos</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FeedList = ({ tab }: FeedListProps) => {
  const { posts, isLoading, error, refetch } = usePosts(tab === "duelos" ? "na-tela" : tab === "cultura" ? "cultura" : tab);
  const [shuffledPosts, setShuffledPosts] = useState<typeof posts | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const { data } = await refetch();
    setShuffledPosts(shuffle(data || posts));
    setTimeout(() => setRefreshing(false), 400);
  }, [refetch, posts]);

  // Reset shuffled posts when tab changes
  useEffect(() => {
    setShuffledPosts(null);
  }, [tab]);

  if (tab === "duelos") return <DuelosFeed />;

  const displayPosts = shuffledPosts || posts;

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-center py-12 text-destructive"><p>Erro ao carregar posts</p></div>;

  if (displayPosts.length === 0) {
    const message = emptyMessages[tab];
    return (
      <div className="text-center py-12 space-y-3">
        <Inbox className="w-12 h-12 mx-auto text-muted-foreground/50" />
        <h3 className="font-cinzel text-lg text-foreground">{message.title}</h3>
        <p className="text-sm text-muted-foreground">{message.description}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
        {refreshing ? "Atualizando..." : "Puxe para misturar o feed 🔀"}
      </button>
      {displayPosts.map((post, idx) => <PostCard key={`${post.id}-${idx}`} post={post} />)}
    </div>
  );
};

export default FeedList;
