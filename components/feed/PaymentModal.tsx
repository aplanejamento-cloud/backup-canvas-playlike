import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown, Share2, QrCode, Star } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PaymentModal = ({ open, onOpenChange }: PaymentModalProps) => {
  const { profile } = useAuth();
  const [step, setStep] = useState<"info" | "payment">("info");
  const [formData, setFormData] = useState({
    rg: "",
    cpf: "",
    cep: "",
    endereco: "",
    cidade: "",
    estado: "",
  });

  // Mock: check if user invited 10+ friends (always false for now)
  const invitedEnough = false;
  const paymentValue = invitedEnough ? 10 : 100;

  const handleShare = (platform: "whatsapp" | "instagram" | "facebook") => {
    const shareText = encodeURIComponent(
      `🌟 Entre no PLAYLIKE e ganhe 1.000 likes! Concorra a prêmios! ${window.location.origin}`
    );
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${shareText}`,
      instagram: `https://www.instagram.com/`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${shareText}`,
    };
    window.open(urls[platform], "_blank");
    toast.success(`Convite enviado via ${platform}!`);
  };

  const handleSkip = () => {
    onOpenChange(false);
    toast.info("Você continua jogando pela fama! 🌟");
  };

  const handleSubmitInfo = () => {
    if (!formData.rg || !formData.cpf || !formData.endereco || !formData.cidade || !formData.estado) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }
    if (!/^\d{11}$/.test(formData.cpf.replace(/\D/g, ""))) {
      toast.error("CPF inválido!");
      return;
    }
    setStep("payment");
  };

  const handlePayment = () => {
    toast.success("Pagamento registrado! Você está concorrendo ao prêmio! 🏆");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-xl text-center text-foreground flex items-center justify-center gap-2">
            <Crown className="w-6 h-6 text-primary animate-float" />
            ATUALIZE CADASTRO PRA PRÊMIO!
          </DialogTitle>
        </DialogHeader>

        {step === "info" ? (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground text-center">
              Complete seus dados para concorrer ao prêmio de <span className="text-primary font-bold">R$ 50.000</span>!
            </p>

            {/* RG */}
            <div className="space-y-1.5">
              <Label className="text-foreground">RG *</Label>
              <Input
                placeholder="00.000.000-0"
                className="bg-input border-border"
                value={formData.rg}
                onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
              />
            </div>

            {/* CPF */}
            <div className="space-y-1.5">
              <Label className="text-foreground">CPF *</Label>
              <Input
                placeholder="000.000.000-00"
                className="bg-input border-border"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label className="text-foreground">CEP</Label>
              <Input
                placeholder="00000-000"
                className="bg-input border-border"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Endereço completo *</Label>
              <Input
                placeholder="Rua, número, complemento"
                className="bg-input border-border"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground">Cidade *</Label>
                <Input
                  placeholder="São Paulo"
                  className="bg-input border-border"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground">Estado *</Label>
                <Input
                  placeholder="SP"
                  maxLength={2}
                  className="bg-input border-border"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmitInfo}
              className="w-full bg-primary text-primary-foreground font-cinzel text-lg shadow-gold"
            >
              CONTINUAR PARA PAGAMENTO
            </Button>

            {/* Invite section */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs text-center text-muted-foreground">
                💡 Convide 10 amigos e pague apenas <span className="text-primary font-bold">R$ 10</span> em vez de R$ 100!
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("whatsapp")}
                  className="border-green-500/50 text-green-400 hover:bg-green-500/20 text-xs"
                >
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("instagram")}
                  className="border-pink-500/50 text-pink-400 hover:bg-pink-500/20 text-xs"
                >
                  Instagram
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("facebook")}
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20 text-xs"
                >
                  Facebook
                </Button>
              </div>
            </div>

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              SEM PAGAR: joga só pela fama ✨
            </button>
          </div>
        ) : (
          <div className="space-y-6 mt-2">
            <p className="text-sm text-muted-foreground text-center">
              Efetue o pagamento via PIX para concorrer ao prêmio
            </p>

            {/* PIX QR Mockup */}
            <div className="flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-xl border border-border">
              <div className="w-48 h-48 bg-foreground/10 rounded-xl flex items-center justify-center border-2 border-dashed border-primary/50">
                <QrCode className="w-32 h-32 text-primary/60" />
              </div>
              <div className="text-center">
                <p className="font-cinzel text-3xl font-bold text-primary glow-gold">
                  R$ {paymentValue}
                </p>
                {invitedEnough && (
                  <p className="text-xs text-green-400 mt-1">
                    🎉 Desconto por convidar 10+ amigos!
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Escaneie o QR Code com seu app de banco ou copie a chave PIX
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText("playlike@pix.com");
                  toast.success("Chave PIX copiada!");
                }}
                className="border-primary/50 text-primary"
              >
                Copiar chave PIX
              </Button>
            </div>

            <Button
              onClick={handlePayment}
              className="w-full bg-primary text-primary-foreground font-cinzel text-lg shadow-gold"
            >
              <Star className="w-5 h-5 mr-2" />
              JÁ PAGUEI!
            </Button>

            <button
              onClick={() => setStep("info")}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
