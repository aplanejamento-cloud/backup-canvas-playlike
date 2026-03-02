import { useState, useEffect } from "react";
import { useAllCompras, useApproveCompra, useRejectCompra } from "@/hooks/useComprasPix";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const AdminPixPanel = () => {
  const [expanded, setExpanded] = useState(false);
  const { data: compras = [] } = useAllCompras();
  const approve = useApproveCompra();
  const reject = useRejectCompra();
  const queryClient = useQueryClient();

  const pendentes = compras.filter((c) => c.status === "pendente");

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("compras-pix-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "compras_pix" }, () => {
        queryClient.invalidateQueries({ queryKey: ["compras-pix-all"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  return (
    <Card className="border-primary/50 bg-card/80">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          <span className="font-cinzel text-primary font-bold">PIX Pendentes</span>
          {pendentes.length > 0 && (
            <span className="bg-yellow-500 text-yellow-950 text-xs px-2 py-0.5 rounded-full font-bold">
              {pendentes.length}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {compras.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma compra registrada</p>
          ) : (
            compras.map((c) => (
              <div key={c.id} className={cn(
                "p-3 rounded-lg border",
                c.status === "pendente" ? "border-yellow-500/30 bg-yellow-500/5" : "border-border bg-muted/20"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {(c as any).tipo === "turbo" ? "🔥 Turbo x10" : (c as any).tipo === "turbo_bomba" ? "💣 Turbo Bomba" : (c as any).tipo === "premium" ? "🏆 Premium" : `${c.likes_adquiridos} likes`}
                    </p>
                    <p className="text-xs text-muted-foreground">R${Number(c.valor).toFixed(2)} • {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
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
                </div>
                {c.status === "pendente" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                      await approve.mutateAsync({ compraId: c.id, usuarioId: c.usuario_id, likes: c.likes_adquiridos, tipo: (c as any).tipo || "likes" });
                        toast.success(`✅ Aprovado! ${(c as any).tipo === "turbo" ? "Turbo ativado!" : (c as any).tipo === "premium" ? "Premium ativado!" : `+${c.likes_adquiridos} likes`}`);
                      }}
                      disabled={approve.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={async () => {
                        await reject.mutateAsync(c.id);
                        toast.success("Compra rejeitada");
                      }}
                      disabled={reject.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
};

export default AdminPixPanel;
