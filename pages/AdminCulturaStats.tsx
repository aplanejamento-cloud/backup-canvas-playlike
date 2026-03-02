import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, Heart, Users, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const AdminCulturaStats = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-cultura-stats"],
    queryFn: async () => {
      const { data: posts } = await (supabase
        .from("posts")
        .select("id, categoria, likes_count, boost_likes, created_at, user_id")
        .eq("tipo", "cultural")
        .eq("deletado", false) as any);

      const allPosts = posts || [];
      const today = new Date().toDateString();
      const todayPosts = allPosts.filter((p: any) => new Date(p.created_at).toDateString() === today);

      // Category breakdown
      const catMap: Record<string, { count: number; likes: number }> = {};
      allPosts.forEach((p: any) => {
        const cat = p.categoria || "sem-categoria";
        if (!catMap[cat]) catMap[cat] = { count: 0, likes: 0 };
        catMap[cat].count++;
        catMap[cat].likes += p.likes_count || 0;
      });

      const categories = Object.entries(catMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.likes - a.likes);

      const uniqueAuthors = new Set(allPosts.map((p: any) => p.user_id)).size;
      const totalLikes = allPosts.reduce((s: number, p: any) => s + (p.likes_count || 0), 0);
      const totalBoost = allPosts.reduce((s: number, p: any) => s + (p.boost_likes || 0), 0);

      return {
        total: allPosts.length,
        today: todayPosts.length,
        totalLikes,
        totalBoost,
        uniqueAuthors,
        categories,
      };
    },
    enabled: !!user && isAdmin,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const ch = supabase
      .channel("cultura-stats-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-cultura-stats"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  if (adminLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const catEmojis: Record<string, string> = {
    jogos: "⚽", esportes: "🏀", ebooks: "📚", fitness: "💪", memes: "😂", musica: "🎵", filmes: "🎬", receitas: "🍕",
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <h1 className="font-cinzel text-2xl text-primary text-center">🎭 Cultura Stats</h1>

        {isLoading || !stats ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-card/80 border-border">
                <CardContent className="py-4 text-center space-y-1">
                  <Sparkles className="w-5 h-5 mx-auto text-primary" />
                  <p className="text-xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-[10px] text-muted-foreground">Posts Cultura</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="py-4 text-center space-y-1">
                  <TrendingUp className="w-5 h-5 mx-auto text-accent" />
                  <p className="text-xl font-bold text-foreground">{stats.today}</p>
                  <p className="text-[10px] text-muted-foreground">Hoje</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="py-4 text-center space-y-1">
                  <Heart className="w-5 h-5 mx-auto text-destructive" />
                  <p className="text-xl font-bold text-foreground">{(stats.totalLikes / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-muted-foreground">Likes Total</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="py-4 text-center space-y-1">
                  <Users className="w-5 h-5 mx-auto text-primary" />
                  <p className="text-xl font-bold text-foreground">{stats.uniqueAuthors}</p>
                  <p className="text-[10px] text-muted-foreground">Autores</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h2 className="font-cinzel text-lg text-primary">📊 Por Categoria</h2>
              {stats.categories.map(cat => (
                <Card key={cat.name} className="bg-card/60 border-border">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{catEmojis[cat.name] || "🎭"}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground capitalize">{cat.name}</p>
                        <p className="text-[10px] text-muted-foreground">{cat.count} posts</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{cat.likes}</p>
                      <p className="text-[10px] text-muted-foreground">likes</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {stats.categories.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">Nenhum post cultural ainda</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminCulturaStats;
