import { useGameState } from "@/hooks/useGameState";
import { usePremios, useResgatarPremio, Premio } from "@/hooks/usePremios";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Gift, MapPin, Loader2, Lock, AlertTriangle, Ticket, Copy, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRATELEIRA_INFO = {
  1: { label: "🏆 Prêmios Maiores", icon: Gift, desc: "Exclusivo para jogadores" },
  2: { label: "📍 Retirada Doador", icon: MapPin, desc: "Retire pessoalmente no endereço do doador" },
} as const;

const generateTicketCode = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const PrizeCard = ({
  premio,
  userLikes,
  onResgatar,
  isRescuing,
}: {
  premio: Premio;
  userLikes: number;
  onResgatar: (p: Premio) => void;
  isRescuing: boolean;
}) => {
  const canAfford = userLikes >= premio.likes_custo;
  const lowStock = premio.estoque < 5;
  const enderecoCompleto = [premio.endereco, premio.numero, premio.bairro, premio.cidade, premio.estado].filter(Boolean).join(", ");

  return (
    <div className="flex-shrink-0 w-[300px] rounded-2xl overflow-hidden border border-border bg-card shadow-lg flex flex-col">
      <div className="h-[200px] relative overflow-hidden bg-muted">
        {premio.midia_url ? (
          premio.midia_url.match(/\.(mp4|webm|mov)$/i) ? (
            <video src={premio.midia_url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
          ) : (
            <img src={premio.midia_url} alt={premio.titulo || "Prêmio"} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gift className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {lowStock && premio.estoque > 0 && (
          <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs">
            ⚠️ Últimas {premio.estoque} un.
          </Badge>
        )}
        {premio.estoque === 0 && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm px-4 py-2">ESGOTADO</Badge>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col gap-2">
        {premio.titulo && <h3 className="font-montserrat font-bold text-foreground text-sm line-clamp-2">{premio.titulo}</h3>}
        {premio.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{premio.descricao}</p>}
        {premio.quantidade > 1 && (
          <p className="text-xs text-muted-foreground">Qtd: {premio.quantidade} unidades</p>
        )}
        {enderecoCompleto && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {enderecoCompleto}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <div>
            <p className={cn("font-cinzel font-bold text-base", canAfford ? "text-primary" : "text-destructive")}>
              {premio.likes_custo.toLocaleString()} likes
            </p>
            <p className={cn("text-xs", lowStock && premio.estoque > 0 ? "text-accent-foreground" : "text-muted-foreground")}>
              Estoque: {premio.estoque}
            </p>
          </div>
          {premio.estoque > 0 && (
            <Button
              size="sm"
              onClick={() => onResgatar(premio)}
              disabled={isRescuing || !canAfford}
              className="font-cinzel font-bold"
              variant={canAfford ? "default" : "outline"}
            >
              {isRescuing ? <Loader2 className="w-4 h-4 animate-spin" /> : canAfford ? "TROCAR" : "SEM SALDO"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const PrateleiraSection = ({
  prateleira,
  userLikes,
  onResgatar,
  rescuingId,
}: {
  prateleira: 1 | 2;
  userLikes: number;
  onResgatar: (p: Premio) => void;
  rescuingId: string | null;
}) => {
  const { data: premios = [], isLoading } = usePremios(prateleira);
  const info = PRATELEIRA_INFO[prateleira];

  return (
    <section className="space-y-3">
      <div className="px-4">
        <h2 className="font-cinzel font-bold text-foreground text-lg flex items-center gap-2">{info.label}</h2>
        <p className="text-xs text-muted-foreground">{info.desc}</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : premios.length === 0 ? (
        <div className="px-4 py-6 text-center text-muted-foreground text-sm">Nenhum prêmio disponível nesta prateleira</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-thin">
          {premios.map((p) => (
            <PrizeCard key={p.id} premio={p} userLikes={userLikes} onResgatar={onResgatar} isRescuing={rescuingId === p.id} />
          ))}
        </div>
      )}
    </section>
  );
};

const TicketCard = ({ resgate }: { resgate: any }) => {
  const copyCode = () => {
    navigator.clipboard.writeText(resgate.codigo_ticket || "");
    toast.success("Código copiado!");
  };

  return (
    <Card className="p-3 flex items-center gap-3 border-primary/20">
      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Ticket className="w-7 h-7 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-lg text-primary">{resgate.codigo_ticket}</span>
          <button onClick={copyCode} className="text-muted-foreground hover:text-primary"><Copy className="w-4 h-4" /></button>
        </div>
        {resgate.endereco_completo && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {resgate.endereco_completo}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{resgate.likes_gastos} likes gastos</p>
      </div>
      <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
        {resgate.status === "pendente" ? <Clock className="w-3 h-3 animate-pulse" /> : <CheckCircle2 className="w-3 h-3 text-primary" />}
        {resgate.status === "pendente" ? "Aguardando" : resgate.status}
      </Badge>
    </Card>
  );
};

const Premios = () => {
  const { user } = useAuth();
  const { gameState } = useGameState();
  const resgatar = useResgatarPremio();
  const [rescuingId, setRescuingId] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile_likes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("total_likes").eq("user_id", user!.id).single();
      return data;
    },
  });

  const { data: meusResgates = [] } = useQuery({
    queryKey: ["meus_resgates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resgates")
        .select("*")
        .eq("usuario_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const userLikes = profile?.total_likes ?? 0;

  const handleResgatar = async (premio: Premio) => {
    if (!user) return;
    if (userLikes < premio.likes_custo) {
      toast.error("Não tem likes suficientes!");
      return;
    }
    if (userLikes - premio.likes_custo === 0) {
      toast.error("⚠️ Ganhe mais likes antes! Ficar com 0 likes te elimina do jogo por 3 dias.");
      return;
    }
    const ticketCode = generateTicketCode();
    const enderecoCompleto = [premio.endereco, premio.numero, premio.bairro, premio.cidade, premio.estado].filter(Boolean).join(", ");

    setRescuingId(premio.id);
    try {
      await resgatar.mutateAsync({
        premioId: premio.id,
        userId: user.id,
        likesCusto: premio.likes_custo,
        codigoTicket: ticketCode,
        enderecoCompleto: enderecoCompleto || null,
      });
      toast.success(`🎫 Seu Ticket Retirada: ${ticketCode}`, { duration: 10000 });
    } catch {
      // error handled in hook
    }
    setRescuingId(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Lock className="w-12 h-12 text-muted-foreground" />
        <p className="text-foreground font-cinzel font-bold text-xl">Faça login para ver os prêmios</p>
      </div>
    );
  }

  if (gameState && !gameState.game_on) {
    return (
      <>
        <AppHeader />
        <InviteButton />
        <div className="container mx-auto max-w-2xl px-4 py-12 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-primary mx-auto" />
          <h1 className="font-cinzel font-bold text-2xl text-foreground">Jogo ainda não iniciado</h1>
          <p className="text-muted-foreground">Os prêmios estarão disponíveis quando o jogo começar.</p>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <AppHeader />
      <InviteButton />

      <div className="container mx-auto max-w-2xl pt-4 space-y-8">
        {/* Instructions */}
        <div className="mx-4 space-y-2">
          <p className="text-sm text-foreground font-medium">
            🎁 Você pode trocar likes por Prêmios abaixo
          </p>
          <p className="text-xs text-muted-foreground">
            📍 Retirada no local do doador. Retire onde o doador anunciou.
          </p>
        </div>

        <Card className="mx-4 p-4 flex items-center justify-between border-primary/30 bg-card/80">
          <div>
            <p className="text-xs text-muted-foreground">Seu saldo</p>
            <p className="font-cinzel font-bold text-2xl text-primary">{userLikes.toLocaleString()} likes</p>
          </div>
          <Gift className="w-8 h-8 text-primary/60" />
        </Card>

        {([1, 2] as const).map((p) => (
          <PrateleiraSection key={p} prateleira={p} userLikes={userLikes} onResgatar={handleResgatar} rescuingId={rescuingId} />
        ))}

        {/* Meus resgates / tickets */}
        {meusResgates.length > 0 && (
          <section className="space-y-3 px-4">
            <h2 className="font-cinzel font-bold text-foreground text-lg flex items-center gap-2">
              <Ticket className="w-5 h-5" /> Prêmios Escolhidos
            </h2>
            {meusResgates.map((r: any) => (
              <TicketCard key={r.id} resgate={r} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default Premios;
