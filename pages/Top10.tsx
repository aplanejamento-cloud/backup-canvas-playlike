import { useState } from "react";
import { useTopRanking } from "@/hooks/useRanking";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Heart, Medal, Search, Loader2, Crown, User, Swords } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

type LeaderboardTab = "jogadores" | "juizes" | "duelos";

const useTopJuizes = (limit = 10) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ranking-juizes", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, total_likes, user_id")
        .eq("user_type", "juiz")
        .eq("is_bot", false)
        .order("total_likes", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("ranking-juizes-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["ranking-juizes"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return { juizes: data || [], isLoading };
};

const useTopDuelistas = (limit = 10) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ranking-duelos", limit],
    queryFn: async () => {
      // Get all completed duels and aggregate votes by winner
      const { data: votes, error } = await supabase
        .from("duel_votes")
        .select("voted_for, vote_value");
      if (error) throw error;

      // Aggregate votes per user
      const votesMap = new Map<string, number>();
      (votes || []).forEach((v: any) => {
        votesMap.set(v.voted_for, (votesMap.get(v.voted_for) || 0) + (v.vote_value || 1));
      });

      // Get top user_ids
      const sorted = [...votesMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      if (sorted.length === 0) return [];

      const userIds = sorted.map(([id]) => id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, name, avatar_url, total_likes")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      return sorted.map(([userId, totalVotes]) => {
        const p = profileMap.get(userId);
        return {
          id: p?.id || userId,
          user_id: userId,
          name: p?.name || "?",
          avatar_url: p?.avatar_url || null,
          total_likes: p?.total_likes || 0,
          total_votes: totalVotes,
        };
      });
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("ranking-duelos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "duel_votes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["ranking-duelos"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return { duelistas: data || [], isLoading };
};

const Top10 = () => {
  const [tab, setTab] = useState<LeaderboardTab>("jogadores");
  const { players, isLoading: loadingJogadores } = useTopRanking(10);
  const { juizes, isLoading: loadingJuizes } = useTopJuizes(10);
  const { duelistas, isLoading: loadingDuelos } = useTopDuelistas(10);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const isLoading = tab === "jogadores" ? loadingJogadores : tab === "juizes" ? loadingJuizes : loadingDuelos;
  const list = tab === "jogadores" ? players : tab === "juizes" ? juizes : duelistas;

  const { data: searchResults } = useQuery({
    queryKey: ["search-players", search, tab],
    queryFn: async () => {
      if (search.length < 2 || tab === "duelos") return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, name, avatar_url, total_likes")
        .eq("user_type", tab === "jogadores" ? "jogador" : "juiz")
        .eq("is_bot", false)
        .ilike("name", `%${search}%`)
        .order("total_likes", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: search.length >= 2 && tab !== "duelos",
  });

  const getMedalColor = (pos: number) => {
    if (pos === 1) return "text-primary";
    if (pos === 2) return "text-gray-300";
    if (pos === 3) return "text-orange-400";
    return "text-muted-foreground";
  };

  const displayList = search.length >= 2 ? searchResults || [] : [];

  const RankItem = ({ item, index }: { item: any; index: number }) => (
    <button
      key={item.id}
      onClick={() => navigate(`/profile/${item.user_id}`)}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
    >
      <div className={`w-8 text-center font-cinzel font-bold ${getMedalColor(index + 1)}`}>
        {index + 1 <= 3 ? <Medal className="w-5 h-5 mx-auto" fill="currentColor" /> : `#${index + 1}`}
      </div>
      <Avatar className="w-12 h-12 border-2 border-border">
        <AvatarImage src={item.avatar_url || ""} />
        <AvatarFallback className="bg-secondary text-foreground font-cinzel">
          {item.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-medium text-foreground truncate">{item.name}</p>
          {tab === "jogadores" && <Crown className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
          {tab === "juizes" && <User className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
          {tab === "duelos" && <Swords className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
        </div>
      </div>
      <div className="flex items-center gap-1 text-primary">
        {tab === "duelos" ? (
          <>
            <Swords className="w-4 h-4" />
            <span className="font-bold">{(item.total_votes || 0).toLocaleString("pt-BR")}</span>
          </>
        ) : (
          <>
            <Heart className="w-4 h-4 fill-primary" />
            <span className="font-bold">{item.total_likes.toLocaleString("pt-BR")}</span>
          </>
        )}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <InviteButton />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <h1 className="font-cinzel text-2xl text-center text-foreground">
          🏆 <span className="text-primary">Top 10</span>
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => { setTab("jogadores"); setSearch(""); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === "jogadores" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Crown className="w-4 h-4" /> Jogadores
          </button>
          <button
            onClick={() => { setTab("juizes"); setSearch(""); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === "juizes" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <User className="w-4 h-4" /> Juízes
          </button>
          <button
            onClick={() => { setTab("duelos"); setSearch(""); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === "duelos" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Swords className="w-4 h-4" /> Duelos
          </button>
        </div>

        {/* Search (not for duelos) */}
        {tab !== "duelos" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${tab === "jogadores" ? "jogador" : "juiz"}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
        )}

        {/* Search Results */}
        {search.length >= 2 && tab !== "duelos" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{displayList.length} resultado(s)</p>
            {displayList.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/profile/${p.user_id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
              >
                <Avatar className="w-10 h-10 border-2 border-border">
                  <AvatarImage src={p.avatar_url || ""} />
                  <AvatarFallback className="bg-secondary text-foreground font-cinzel text-sm">
                    {p.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{p.name}</p>
                </div>
                <div className="flex items-center gap-1 text-primary text-sm">
                  <Heart className="w-3.5 h-3.5 fill-primary" />
                  <span className="font-bold">{p.total_likes.toLocaleString("pt-BR")}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {(search.length < 2 || tab === "duelos") && (
          isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((item, i) => (
                <RankItem key={item.id} item={item} index={i} />
              ))}
              {list.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {tab === "duelos" ? "Nenhum voto em duelos ainda. ⚔️" : `Nenhum ${tab === "jogadores" ? "jogador" : "juiz"} encontrado.`}
                </p>
              )}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Top10;
