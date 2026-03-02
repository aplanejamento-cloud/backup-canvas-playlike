import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Gift, Loader2 } from "lucide-react";
import { useSendMimo } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface MimoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetName: string;
}

const MimoModal = ({ open, onOpenChange, targetUserId, targetName }: MimoModalProps) => {
  const { profile } = useAuth();
  const [likes, setLikes] = useState(100);
  const sendMimo = useSendMimo();
  const navigate = useNavigate();

  const canSend = (profile?.total_likes ?? 0) >= 100;
  const maxLikes = profile?.total_likes ?? 0;

  const handleSend = async () => {
    if (likes < 100) {
      toast.error("Mimo mínimo é 100 likes!");
      return;
    }
    if (likes > maxLikes) {
      toast.error("Likes insuficientes!");
      return;
    }

    try {
      const chatId = await sendMimo.mutateAsync({ jogadorId: targetUserId, likes });
      toast.success(`Mimo de ${likes} likes enviado para ${targetName}! 🎁`);
      onOpenChange(false);
      navigate(`/chat/${chatId}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar mimo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-primary flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Enviar Mimo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="text-center space-y-1">
            <p className="text-foreground text-sm">Enviar mimo para</p>
            <p className="font-semibold text-primary text-lg">@{targetName}</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm text-muted-foreground">Seus likes:</span>
            <span className="font-bold text-primary">{maxLikes.toLocaleString("pt-BR")}</span>
          </div>

          {!canSend ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-destructive text-sm font-medium">
                ⚠️ Você precisa de pelo menos 100 likes para enviar um mimo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm text-muted-foreground block">
                Quantidade de likes (100 – {maxLikes.toLocaleString("pt-BR")})
              </label>
              <Input
                type="number"
                min={100}
                max={maxLikes}
                value={likes}
                onChange={(e) => setLikes(Number(e.target.value))}
                className="bg-input border-border text-foreground"
              />
              <div className="flex gap-2">
                {[100, 200, 500, 1000].filter(v => v <= maxLikes).map(v => (
                  <button
                    key={v}
                    onClick={() => setLikes(v)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      likes === v
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="pt-2 space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Isso abrirá um <strong className="text-foreground">chat por 30 dias</strong> entre vocês.
                </p>
                <Button
                  onClick={handleSend}
                  disabled={sendMimo.isPending || likes < 100 || likes > maxLikes}
                  className="w-full bg-primary text-primary-foreground font-semibold"
                >
                  {sendMimo.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                  ) : (
                    <><Gift className="w-4 h-4 mr-2" /> Enviar {likes} likes</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MimoModal;
