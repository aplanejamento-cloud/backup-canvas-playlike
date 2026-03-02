import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDuels, Duel } from "@/hooks/useDuels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Swords, Heart, Gem, Clock,
  CheckCircle, XCircle, Crown, Skull,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";
import { toast } from "sonner";

const Duels = () => {
  const { user, profile } = useAuth();
  const { duels, pendingDuels, isLoading, challengeUser, acceptDuel, refuseDuel, voteDuel } = useDuels();
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (searchName.length < 2) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url, total_likes, user_type")
      .ilike("name", `%${searchName}%`)
      .neq("user_id", user?.id || "")
      .eq("user_type", "jogador")
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  };

  const getStatusBadge = (duel: Duel) => {
    if (duel.status === "refused") return (
      <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full flex items-center gap-1">
        <Skull className="w-3 h-3" /> ARREGOU
      </span>
    );
    if (duel.status === "completed") return (
      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
        <Crown className="w-3 h-3" /> FINALIZADO
      </span>
    );
    if (duel.status === "pending") {
      const waitingName = duel.challenged_profile?.name?.split(" ")[0] || "jogador";
      return (
        <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3 animate-pulse" /> Aguardando {waitingName}
        </span>
      );
    }
    return (
      <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
        <Swords className="w-3 h-3" /> AO VIVO
      </span>
    );
  };

  const hasVoted = (duelId: string) => false; // simplified, ideally check from server

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <InviteButton />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="font-cinzel text-2xl md:text-3xl text-primary glow-gold flex items-center justify-center gap-2">
            <Swords className="w-7 h-7" /> Duelos
          </h1>
          <p className="text-sm text-muted-foreground">Desafie jogadores! Primeiro a 1M likes vence tudo!</p>
        </div>

        {/* Search & Challenge */}
        <Card className="bg-card/80 border-border">
          <CardContent className="py-4 space-y-3">
            <h3 className="font-cinzel text-sm text-primary">⚔️ Desafiar Jogador</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Buscar jogador..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-input border-border"
              />
              <Button onClick={handleSearch} disabled={searching} className="bg-primary text-primary-foreground">
                Buscar
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((p) => (
                  <div key={p.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarImage src={p.avatar_url || ""} />
                        <AvatarFallback className="bg-secondary text-foreground">{p.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.total_likes?.toLocaleString("pt-BR")} likes</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => challengeUser(p.user_id)}
                      className="bg-accent text-accent-foreground"
                    >
                      <Swords className="w-4 h-4 mr-1" /> Desafiar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Duels */}
        {pendingDuels.length > 0 && (
          <Card className="bg-card/80 border-primary/50 border-2">
            <CardContent className="py-4 space-y-3">
              <h3 className="font-cinzel text-sm text-primary animate-pulse-gold">🔔 Desafios Pendentes</h3>
              {pendingDuels.map((duel) => (
                <div key={duel.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-10 h-10 border border-primary">
                      <AvatarImage src={duel.challenger_profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-secondary">{duel.challenger_profile?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{duel.challenger_profile?.name}</p>
                      <p className="text-xs text-muted-foreground">te desafiou!</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => acceptDuel(duel.id)} className="bg-success text-success-foreground">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => refuseDuel(duel)}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active Duels Feed */}
        <div className="space-y-4">
          <h3 className="font-cinzel text-sm text-primary">⚔️ Feed de Duelos</h3>

          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
          ) : duels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum duelo ainda. Seja o primeiro a desafiar! ⚔️
            </div>
          ) : (
            duels.map((duel) => (
              <Card key={duel.id} className="bg-card/80 border-border overflow-hidden">
                <CardContent className="py-4 space-y-3">
                  {/* Status badge */}
                  <div className="flex justify-between items-center">
                    {getStatusBadge(duel)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(duel.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  {/* VS Layout */}
                  <div className="flex items-center justify-around">
                    {/* Challenger */}
                    <div className="flex flex-col items-center gap-1.5">
                      <Avatar className={`w-16 h-16 border-2 ${duel.winner_id === duel.challenger_id ? "border-primary shadow-gold" : "border-border"}`}>
                        <AvatarImage src={duel.challenger_profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-secondary font-cinzel">{duel.challenger_profile?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium text-foreground text-center max-w-[80px] truncate">{duel.challenger_profile?.name}</p>
                      <p className="text-lg font-bold text-primary">{duel.challenger_votes.toLocaleString("pt-BR")}</p>
                      {duel.winner_id === duel.challenger_id && <Crown className="w-5 h-5 text-primary animate-float" />}
                    </div>

                    {/* VS */}
                    <div className="text-center">
                      <span className="font-cinzel text-2xl text-accent glow-purple">VS</span>
                      {duel.status === "refused" && (
                        <p className="text-xs text-destructive mt-1">ARREGOU!</p>
                      )}
                    </div>

                    {/* Challenged */}
                    <div className="flex flex-col items-center gap-1.5">
                      <Avatar className={`w-16 h-16 border-2 ${duel.winner_id === duel.challenged_id ? "border-primary shadow-gold" : "border-border"}`}>
                        <AvatarImage src={duel.challenged_profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-secondary font-cinzel">{duel.challenged_profile?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium text-foreground text-center max-w-[80px] truncate">{duel.challenged_profile?.name}</p>
                      <p className="text-lg font-bold text-primary">{duel.challenged_votes.toLocaleString("pt-BR")}</p>
                      {duel.winner_id === duel.challenged_id && <Crown className="w-5 h-5 text-primary animate-float" />}
                    </div>
                  </div>

                  {/* Vote Buttons (only for active duels) */}
                  {duel.status === "active" && user && duel.challenger_id !== user.id && duel.challenged_id !== user.id && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="space-y-1.5">
                        <p className="text-xs text-center text-muted-foreground">Votar em {duel.challenger_profile?.name?.split(" ")[0]}</p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => voteDuel(duel.id, duel.challenger_id, "play")}
                            className="flex-1 border-accent text-accent text-xs"
                          >
                            <Gem className="w-3 h-3 mr-1" /> 1 Play
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => voteDuel(duel.id, duel.challenger_id, "likes")}
                            className="flex-1 border-primary text-primary text-xs"
                          >
                            <Heart className="w-3 h-3 mr-1" /> 100
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs text-center text-muted-foreground">Votar em {duel.challenged_profile?.name?.split(" ")[0]}</p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => voteDuel(duel.id, duel.challenged_id, "play")}
                            className="flex-1 border-accent text-accent text-xs"
                          >
                            <Gem className="w-3 h-3 mr-1" /> 1 Play
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => voteDuel(duel.id, duel.challenged_id, "likes")}
                            className="flex-1 border-primary text-primary text-xs"
                          >
                            <Heart className="w-3 h-3 mr-1" /> 100
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Duels;
