import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Gift, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const JuizDoacaoPopup = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only check for juiz users
  const isJuiz = profile?.user_type === "juiz";

  const { data: juizProfile } = useQuery({
    queryKey: ["juiz-doacao-check", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("created_at, ultima_doacao")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user && isJuiz,
  });

  useEffect(() => {
    if (!juizProfile || !isJuiz || dismissed) return;

    // Check session dismiss
    const sessionKey = `juiz_doacao_dismissed_${user?.id}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const now = new Date();
    const referenceDate = juizProfile.ultima_doacao
      ? new Date(juizProfile.ultima_doacao)
      : new Date(juizProfile.created_at);

    const daysSince = Math.floor(
      (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince >= 30) {
      setOpen(true);
    }
  }, [juizProfile, isJuiz, dismissed, user?.id]);

  const handleDismiss = () => {
    setOpen(false);
    setDismissed(true);
    sessionStorage.setItem(`juiz_doacao_dismissed_${user?.id}`, "true");
  };

  const handleDoar = () => {
    setOpen(false);
    navigate("/doacoes");
  };

  if (!isJuiz) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); setOpen(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-primary flex items-center gap-2 text-xl">
            <Crown className="w-6 h-6" /> Juiz Completo!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Seus 30 dias como Juiz estão completos! 🎉
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="bg-primary/10 rounded-xl p-4 text-center space-y-2">
            <Gift className="w-10 h-10 mx-auto text-primary" />
            <p className="text-sm text-foreground font-medium">
              Para manter seu status de <strong className="text-primary">Juiz Completo</strong>, doe 1 brinde para o catálogo de prêmios!
            </p>
            <p className="text-xs text-muted-foreground">
              Você receberá likes como recompensa pela doação.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleDoar} className="w-full gap-2">
              <Gift className="w-4 h-4" /> Doar Agora
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={handleDismiss} className="w-full text-muted-foreground">
              Continuar como Juiz Básico
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Juiz Básico: pode continuar jogando normalmente, mas sem o badge exclusivo ✨
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JuizDoacaoPopup;
