import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Zap, Users, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const AdminPremiumUsers = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-premium-users"],
    queryFn: async () => {
      const [{ data: premiums }, { data: turbos }] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, name, avatar_url, user_type, premium_active, premium_end, total_likes")
          .eq("premium_active", true)
          .order("premium_end", { ascending: true }),
        supabase
          .from("profiles")
          .select("user_id, name, avatar_url, user_type, multiplicador_ativo, multiplicador_end, total_likes")
          .gt("multiplicador_ativo", 1)
          .not("multiplicador_end", "is", null),
      ]);
      return {
        premiums: (premiums || []).filter(p => !p.premium_end || new Date(p.premium_end) > new Date()),
        turbos: (turbos || []).filter(t => t.multiplicador_end && new Date(t.multiplicador_end) > new Date()),
      };
    },
    enabled: !!user && isAdmin,
  });

  useEffect(() => {
    const ch = supabase
      .channel("premium-rt")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-premium-users"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  if (adminLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const premiums = data?.premiums || [];
  const turbos = data?.turbos || [];

  const formatExpiry = (d: string | null) => {
    if (!d) return "—";
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    return diff > 0 ? `${diff}d restantes` : "expirado";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <h1 className="font-cinzel text-2xl text-primary text-center">🏆 Premium & Turbo</h1>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-card/80 border-border">
                <CardContent className="py-4 text-center space-y-1">
                  <Crown className="w-6 h-6 mx-auto text-primary" />
                  <p className="text-2xl font-bold text-foreground">{premiums.length}</p>
                  <p className="text-xs text-muted-foreground">Premium Ativos</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="py-4 text-center space-y-1">
                  <Zap className="w-6 h-6 mx-auto text-accent" />
                  <p className="text-2xl font-bold text-foreground">{turbos.length}</p>
                  <p className="text-xs text-muted-foreground">Turbo Ativos</p>
                </CardContent>
              </Card>
            </div>

            {premiums.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-cinzel text-lg text-primary flex items-center gap-2"><Crown className="w-4 h-4" /> Premium</h2>
                {premiums.map(p => (
                  <Card key={p.user_id} className="bg-card/60 border-primary/20">
                    <CardContent className="py-3 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.avatar_url || ""} />
                        <AvatarFallback className="bg-muted text-xs">{p.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.user_type} • {p.total_likes} likes</p>
                      </div>
                      <span className="text-xs text-primary font-medium">{formatExpiry(p.premium_end)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {turbos.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-cinzel text-lg text-accent flex items-center gap-2"><Zap className="w-4 h-4" /> Turbo x10</h2>
                {turbos.map(t => (
                  <Card key={t.user_id} className="bg-card/60 border-accent/20">
                    <CardContent className="py-3 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={t.avatar_url || ""} />
                        <AvatarFallback className="bg-muted text-xs">{t.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">x{t.multiplicador_ativo} • {t.total_likes} likes</p>
                      </div>
                      <span className="text-xs text-accent font-medium">{formatExpiry(t.multiplicador_end)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {premiums.length === 0 && turbos.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">Nenhum usuário premium ou turbo ativo</p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminPremiumUsers;
