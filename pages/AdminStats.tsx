import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import AdminDoacoesPanel from "@/components/admin/AdminDoacoesPanel";
import AdminPixPanel from "@/components/admin/AdminPixPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Heart, Swords, DollarSign, AlertTriangle, TrendingUp, Loader2, BarChart3, Crown, BookOpen } from "lucide-react";
import { useEffect } from "react";

const AdminStats = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { data: likesData },
        { count: activeDuels },
        { count: completedDuels },
        { data: pixData },
        { count: pendingDenuncias },
        { count: todayUsers },
        { count: todayPosts },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("total_likes").eq("user_type", "jogador"),
        supabase.from("duels").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("duels").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("compras_pix").select("valor, status"),
        supabase.from("posts").select("*", { count: "exact", head: true }).gt("denuncias_improprio", 0),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ]);

      const totalLikes = (likesData || []).reduce((sum, p) => sum + (p.total_likes || 0), 0);
      const pixConfirmado = (pixData || []).filter(p => p.status === "aprovado").reduce((sum, p) => sum + Number(p.valor), 0);
      const pixPendente = (pixData || []).filter(p => p.status === "pendente").length;

      return {
        totalUsers: totalUsers || 0,
        totalLikes,
        activeDuels: activeDuels || 0,
        completedDuels: completedDuels || 0,
        pixConfirmado,
        pixPendente,
        pendingDenuncias: pendingDenuncias || 0,
        todayUsers: todayUsers || 0,
        todayPosts: todayPosts || 0,
      };
    },
    enabled: !!user && isAdmin,
    refetchInterval: 30000,
  });

  // Realtime refresh
  useEffect(() => {
    const channel = supabase
      .channel("admin-stats-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "duels" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  if (adminLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const statCards = stats ? [
    { icon: Users, label: "Total Usuários", value: stats.totalUsers.toLocaleString("pt-BR"), color: "text-primary", sub: `+${stats.todayUsers} hoje` },
    { icon: Heart, label: "Likes Totais", value: `${(stats.totalLikes / 1000).toFixed(1)}k`, color: "text-primary", sub: "todos jogadores" },
    { icon: Swords, label: "Duelos Ativos", value: stats.activeDuels.toString(), color: "text-accent", sub: `${stats.completedDuels} finalizados` },
    { icon: DollarSign, label: "PIX Confirmado", value: `R$${stats.pixConfirmado.toFixed(2)}`, color: "text-green-500", sub: `${stats.pixPendente} pendentes` },
    { icon: AlertTriangle, label: "Denúncias", value: stats.pendingDenuncias.toString(), color: "text-destructive", sub: "posts denunciados" },
    { icon: TrendingUp, label: "Posts Hoje", value: stats.todayPosts.toString(), color: "text-accent", sub: "publicações" },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <h1 className="font-cinzel text-2xl text-primary text-center">📊 Dashboard Admin</h1>

        {/* Admin Badge Summary */}
        {stats && (
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">
              💰 R${stats.pixConfirmado.toFixed(2)} PIX
            </span>
            <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-full">
              ⏳ {stats.pixPendente} pendentes
            </span>
            <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
              📚 {stats.todayPosts} posts hoje
            </span>
            <span className="bg-destructive/20 text-destructive text-xs font-bold px-3 py-1.5 rounded-full">
              🚨 {stats.pendingDenuncias} denúncias
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statCards.map((s, i) => (
              <Card key={i} className="bg-card/80 border-border">
                <CardContent className="py-4 text-center space-y-1">
                  <s.icon className={`w-6 h-6 mx-auto ${s.color}`} />
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-2">
          <Link to="/admin/pix-logs" className="bg-card border border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
            <BarChart3 className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">PIX Logs</p>
          </Link>
          <Link to="/admin/premium-users" className="bg-card border border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
            <Crown className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Premium</p>
          </Link>
          <Link to="/admin/cultura-stats" className="bg-card border border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
            <BookOpen className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Cultura</p>
          </Link>
        </div>

        {/* Admin Panels */}
        <div className="space-y-4">
          <AdminPixPanel />
          <AdminDoacoesPanel />
        </div>
      </main>
    </div>
  );
};

export default AdminStats;
