import { useState, useEffect } from "react";
import { useDoacoesPendentes, useAprovarDoacao, useRecusarDoacao, DoacaoPremioPendente } from "@/hooks/usePremios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminDoacoesPanel = () => {
  const [expanded, setExpanded] = useState(false);
  const { data: pendentes = [] } = useDoacoesPendentes();
  const aprovar = useAprovarDoacao();
  const recusar = useRecusarDoacao();
  const queryClient = useQueryClient();

  // Fetch all doacoes (not just pending)
  const { data: todasDoacoes = [] } = useQuery({
    queryKey: ["doacoes-todas-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("doacoes_premios")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []) as DoacaoPremioPendente[];
    },
  });

  // Fetch donor profiles
  const donorIds = [...new Set(todasDoacoes.map((d) => d.usuario_id))];
  const { data: donors = [] } = useQuery({
    queryKey: ["donors-profiles", donorIds.join(",")],
    queryFn: async () => {
      if (!donorIds.length) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url, user_type")
        .in("user_id", donorIds);
      return data || [];
    },
    enabled: donorIds.length > 0,
  });

  const donorMap = new Map(donors.map((d: any) => [d.user_id, d]));

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("doacoes-admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "doacoes_premios" }, () => {
        queryClient.invalidateQueries({ queryKey: ["doacoes_pendentes"] });
        queryClient.invalidateQueries({ queryKey: ["doacoes-todas-admin"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  const handleAprovar = async (doacao: DoacaoPremioPendente) => {
    try {
      await aprovar.mutateAsync(doacao);
      // Update ultima_doacao on the donor's profile
      await supabase
        .from("profiles")
        .update({ ultima_doacao: new Date().toISOString() } as any)
        .eq("user_id", doacao.usuario_id);
      toast.success(`✅ Doação aprovada! Likes creditados ao doador.`);
    } catch {
      toast.error("Erro ao aprovar");
    }
  };

  const handleRecusar = async (doacaoId: string) => {
    try {
      await recusar.mutateAsync(doacaoId);
    } catch {
      toast.error("Erro ao recusar");
    }
  };

  const prateleiraLabel = (t: number) => {
    if (t === 1) return "🏆 Top";
    if (t === 2) return "📦 Correio";
    return "📍 Local";
  };

  return (
    <Card className="border-primary/50 bg-card/80">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <span className="font-cinzel text-primary font-bold">Doações Pendentes</span>
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
          {todasDoacoes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma doação registrada</p>
          ) : (
            todasDoacoes.map((d) => {
              const donor = donorMap.get(d.usuario_id) as any;
              return (
                <div key={d.id} className={cn(
                  "p-3 rounded-lg border",
                  !d.aprovado ? "border-yellow-500/30 bg-yellow-500/5" : "border-border bg-muted/20"
                )}>
                  {/* Donor info */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden flex-shrink-0">
                      {donor?.avatar_url ? (
                        <img src={donor.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <User className="w-4 h-4 m-2 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{donor?.name || "Usuário"}</p>
                      <p className="text-xs text-muted-foreground">
                        {donor?.user_type === "juiz" ? "👑 Juiz" : "🎮 Jogador"} • {prateleiraLabel(d.tipo_prateleira)}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
                      d.aprovado ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                    )}>
                      {d.aprovado ? <><CheckCircle className="w-3 h-3" /> Aprovado</> : <><Clock className="w-3 h-3" /> Pendente</>}
                    </span>
                  </div>

                  {/* Donation content */}
                  <div className="flex gap-3 mb-2">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {d.midia_url?.match(/\.(mp4|webm|mov)$/i) ? (
                        <video src={d.midia_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={d.midia_url} alt="doação" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{d.titulo || "Sem título"}</p>
                      {d.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{d.descricao}</p>}
                      <p className="text-xs text-primary font-bold mt-1">{d.likes_recebidos} likes solicitados</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!d.aprovado && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleAprovar(d)}
                        disabled={aprovar.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleRecusar(d.id)}
                        disabled={recusar.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Recusar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
};

export default AdminDoacoesPanel;
