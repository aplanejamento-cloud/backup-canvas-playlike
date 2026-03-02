import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Bot, Power, Heart, Users, FileText, Zap, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const BotsControl = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  const { data: bots, isLoading } = useQuery({
    queryKey: ["admin-bots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_bot", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isAdmin,
  });

  const { data: botPostsCount } = useQuery({
    queryKey: ["admin-bot-posts-count"],
    queryFn: async () => {
      const botIds = bots?.map(b => b.user_id) || [];
      if (botIds.length === 0) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .in("user_id", botIds)
        .gte("created_at", today.toISOString());
      return count || 0;
    },
    enabled: !!bots && bots.length > 0,
  });

  const { data: top10Real } = useQuery({
    queryKey: ["admin-top10-real"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, total_likes")
        .eq("user_type", "jogador")
        .eq("is_bot", false)
        .order("total_likes", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user && isAdmin,
  });

  const triggerPost = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("bot-post");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data?.count || 0} posts criados! 🤖`);
      queryClient.invalidateQueries({ queryKey: ["admin-bot-posts-count"] });
    },
    onError: () => toast.error("Erro ao gerar posts"),
  });

  const triggerVisualLikes = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("bot-visual-likes");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Visual likes atualizados! Top10 mín: ${data?.top10Lowest}`);
      queryClient.invalidateQueries({ queryKey: ["admin-bots"] });
    },
    onError: () => toast.error("Erro ao atualizar visual likes"),
  });

  const triggerInteract = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("bot-interact");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data?.interactions || 0} interações entre bots! 🤝`);
    },
    onError: () => toast.error("Erro nas interações"),
  });

  const updateVisualLikes = useMutation({
    mutationFn: async ({ userId, value }: { userId: string; value: number }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ visual_likes: value } as any)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bots"] });
      toast.success("Visual likes atualizado!");
    },
  });

  if (adminLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const totalBotPosts = botPostsCount || 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <h1 className="font-cinzel text-2xl text-primary text-center">🤖 Controle de Bots</h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={() => triggerPost.mutate()}
            disabled={triggerPost.isPending}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            {triggerPost.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            <span className="text-xs">Postar Agora</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => triggerVisualLikes.mutate()}
            disabled={triggerVisualLikes.isPending}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            {triggerVisualLikes.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5" />}
            <span className="text-xs">Sync Likes</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => triggerInteract.mutate()}
            disabled={triggerInteract.isPending}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            {triggerInteract.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            <span className="text-xs">Interagir</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card/80">
            <CardContent className="py-3 text-center">
              <Bot className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{bots?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Bots Ativos</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80">
            <CardContent className="py-3 text-center">
              <FileText className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">{totalBotPosts}</p>
              <p className="text-xs text-muted-foreground">Posts Hoje</p>
            </CardContent>
          </Card>
        </div>

        {/* TOP10 Real vs Bots */}
        <Card className="bg-card/80">
          <CardContent className="py-3">
            <h3 className="text-sm font-semibold text-primary mb-2">📊 TOP10 Real vs Bot Visual</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Top 10 Real</p>
                {top10Real?.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex justify-between text-xs py-0.5">
                    <span className="truncate text-foreground">#{i + 1} {p.name}</span>
                    <span className="text-primary font-bold">{p.total_likes}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bots Visual</p>
                {bots?.map((b, i) => (
                  <div key={i} className="flex justify-between text-xs py-0.5">
                    <span className="truncate text-foreground">{b.name}</span>
                    <span className="text-accent font-bold">{(b as any).visual_likes}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bot Profiles */}
        <h2 className="font-cinzel text-lg text-foreground">Perfis dos Bots</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {bots?.map((bot) => (
              <Card key={bot.id} className="bg-card/80 border-border">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
                      {bot.avatar_url ? (
                        <img src={bot.avatar_url} alt={bot.name} className="w-full h-full object-cover" />
                      ) : (
                        <Bot className="w-5 h-5 m-2.5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm truncate">{bot.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">🤖 BOT</span>
                        <span className="text-[10px] text-muted-foreground">{bot.user_type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{bot.bio}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">Visual</p>
                      <Input
                        type="number"
                        className="w-20 h-7 text-xs text-center"
                        defaultValue={(bot as any).visual_likes || 0}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) updateVisualLikes.mutate({ userId: bot.user_id, value: val });
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BotsControl;
