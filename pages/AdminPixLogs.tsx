import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, CheckCircle, XCircle, Clock, Loader2, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const AdminPixLogs = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  const { data: compras = [], isLoading } = useQuery({
    queryKey: ["admin-pix-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("compras_pix")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!user && isAdmin,
  });

  useEffect(() => {
    const ch = supabase
      .channel("pix-logs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "compras_pix" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-pix-logs"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  if (adminLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const aprovados = compras.filter(c => c.status === "aprovado");
  const pendentes = compras.filter(c => c.status === "pendente");
  const rejeitados = compras.filter(c => c.status === "rejeitado");
  const totalAprovado = aprovados.reduce((s, c) => s + Number(c.valor), 0);
  const totalHoje = compras
    .filter(c => c.status === "aprovado" && new Date(c.created_at).toDateString() === new Date().toDateString())
    .reduce((s, c) => s + Number(c.valor), 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <h1 className="font-cinzel text-2xl text-primary text-center">💰 PIX Logs</h1>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-card/80 border-border">
                <CardContent className="py-4 text-center space-y-1">
                  <DollarSign className="w-5 h-5 mx-auto text-green-500" />
                  <p className="text-xl font-bold text-foreground">R${totalAprovado.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Total Aprovado</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="py-4 text-center space-y-1">
                  <TrendingUp className="w-5 h-5 mx-auto text-primary" />
                  <p className="text-xl font-bold text-foreground">R${totalHoje.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Hoje</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="py-4 text-center space-y-1">
                  <Clock className="w-5 h-5 mx-auto text-yellow-500" />
                  <p className="text-xl font-bold text-foreground">{pendentes.length}</p>
                  <p className="text-[10px] text-muted-foreground">Pendentes</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="py-4 text-center space-y-1">
                  <CheckCircle className="w-5 h-5 mx-auto text-green-500" />
                  <p className="text-xl font-bold text-foreground">{aprovados.length}</p>
                  <p className="text-[10px] text-muted-foreground">Aprovados</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              {compras.map(c => (
                <Card key={c.id} className={cn(
                  "bg-card/60 border",
                  c.status === "pendente" ? "border-yellow-500/30" : c.status === "aprovado" ? "border-green-500/20" : "border-destructive/20"
                )}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {c.tipo === "turbo" ? "🔥 Turbo" : c.tipo === "premium" ? "🏆 Premium" : `${c.likes_adquiridos} likes`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R${Number(c.valor).toFixed(2)} • {new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
                      c.status === "aprovado" && "bg-green-500/20 text-green-500",
                      c.status === "rejeitado" && "bg-destructive/20 text-destructive",
                      c.status === "pendente" && "bg-yellow-500/20 text-yellow-500"
                    )}>
                      {c.status === "aprovado" && <CheckCircle className="w-3 h-3" />}
                      {c.status === "rejeitado" && <XCircle className="w-3 h-3" />}
                      {c.status === "pendente" && <Clock className="w-3 h-3" />}
                      {c.status}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminPixLogs;
