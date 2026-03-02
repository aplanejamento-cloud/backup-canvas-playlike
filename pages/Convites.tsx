import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useReferrals } from "@/hooks/useReferrals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Star, Copy, QrCode, Mail, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";

const NETWORKS = [
  { id: "whatsapp", name: "WhatsApp", icon: "💬", color: "bg-green-600" },
  { id: "telegram", name: "Telegram", icon: "✈️", color: "bg-blue-500" },
  { id: "instagram", name: "Instagram", icon: "📸", color: "bg-pink-500" },
  { id: "facebook", name: "Facebook", icon: "📘", color: "bg-blue-600" },
  { id: "tiktok", name: "TikTok", icon: "🎵", color: "bg-slate-800" },
  { id: "kwai", name: "Kwai", icon: "🎬", color: "bg-orange-500" },
  { id: "twitter", name: "Twitter/X", icon: "🐦", color: "bg-sky-500" },
  { id: "youtube", name: "YouTube", icon: "▶️", color: "bg-red-600" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "bg-blue-700" },
  { id: "discord", name: "Discord", icon: "🎮", color: "bg-indigo-600" },
  { id: "snapchat", name: "Snapchat", icon: "👻", color: "bg-yellow-400" },
  { id: "pinterest", name: "Pinterest", icon: "📌", color: "bg-red-500" },
  { id: "reddit", name: "Reddit", icon: "🤖", color: "bg-orange-600" },
  { id: "signal", name: "Signal", icon: "🔒", color: "bg-blue-400" },
  { id: "threads", name: "Threads", icon: "🧵", color: "bg-slate-700" },
  { id: "bluesky", name: "Bluesky", icon: "🦋", color: "bg-sky-400" },
  { id: "messenger", name: "Messenger", icon: "💭", color: "bg-purple-500" },
  { id: "email", name: "Email", icon: "📧", color: "bg-gray-600" },
  { id: "sms", name: "SMS", icon: "📱", color: "bg-green-500" },
  { id: "copiar-link", name: "Copiar Link", icon: "🔗", color: "bg-gray-500" },
  { id: "twitch", name: "Twitch", icon: "🟣", color: "bg-purple-600" },
  { id: "github", name: "GitHub", icon: "🐙", color: "bg-gray-700" },
  { id: "qrcode", name: "QR Code", icon: "📲", color: "bg-slate-600" },
  { id: "whatsapp-status", name: "WA Status", icon: "⭕", color: "bg-green-700" },
];

const Convites = () => {
  const { user, profile } = useAuth();
  const { referrals, claimNetwork, totalLikesEarned, networksUsed } = useReferrals();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingNetwork, setLoadingNetwork] = useState<string | null>(null);

  const referralLink = `${window.location.origin}/?ref=${user?.id?.slice(0, 8)}`;

  const getShareText = () =>
    `Você não vai acreditar, lançaram uma Rede Social dos Famosos chamada Playlike, onde as pessoas publicam fotos e vídeos em troca de likes e estes likes podem ser trocados por prêmios cadastrados na página.\n\nE ainda vão eleger o melhor influenciador do Brasil.\n\nEu já me cadastrei e estou esperando a Rede Iniciar.\n\nSó pode se cadastrar agora quem recebe convite, porque o jogo ainda não iniciou e a rede está fechada para convidados.\n\nTe mandei o link abaixo para você conseguir se cadastrar também e aguardar o jogo começar\n\n🔥 Jogue PLAYLIKE e ganhe likes! Cadastre-se grátis: ${referralLink}`;

  const openShareUrl = (network: string) => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(referralLink);
    const shortText = encodeURIComponent(`🔥 Jogue PLAYLIKE e ganhe likes! Cadastre-se grátis: ${referralLink}`);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}`,
      "whatsapp-status": `https://wa.me/?text=${text}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      instagram: `https://www.instagram.com/`,
      twitter: `https://twitter.com/intent/tweet?text=${shortText}`,
      threads: `https://www.threads.net/intent/post?text=${shortText}`,
      bluesky: `https://bsky.app/intent/compose?text=${shortText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      reddit: `https://reddit.com/submit?url=${url}&title=${encodeURIComponent("Jogue PLAYLIKE!")}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${shortText}`,
      discord: `https://discord.com/`,
      messenger: `https://www.facebook.com/dialog/send?link=${url}&app_id=&redirect_uri=${url}`,
      email: `mailto:?subject=${encodeURIComponent("Convite PlayLike Hollywood Br!")}&body=${text}`,
      sms: `sms:?body=${text}`,
      tiktok: `https://www.tiktok.com/`,
      kwai: `https://www.kwai.com/`,
      youtube: `https://www.youtube.com/`,
      snapchat: `https://www.snapchat.com/`,
      twitch: `https://www.twitch.tv/`,
      github: `https://github.com/`,
      signal: `https://signal.me/`,
    };
    if (urls[network]) {
      window.open(urls[network], "_blank");
    }
  };

  const handleNetworkClick = async (networkId: string) => {
    setLoadingNetwork(networkId);

    // For copy link
    if (networkId === "copiar-link" || networkId === "qrcode") {
      await navigator.clipboard.writeText(referralLink);
      toast({ title: "Link copiado!", description: referralLink });
    }

    // Open share URL for supported networks
    openShareUrl(networkId);

    // Claim likes
    const { success, likes } = await claimNetwork(networkId);
    if (success) {
      toast({
        title: `+${likes.toLocaleString("pt-BR")} likes! 🎉`,
        description:
          likes === 1000
            ? `Primeira vez via ${NETWORKS.find((n) => n.id === networkId)?.name}! Parabéns!`
            : `+10 likes por compartilhar via ${NETWORKS.find((n) => n.id === networkId)?.name}`,
      });
    }

    setLoadingNetwork(null);
  };

  const isUsed = (networkId: string) => referrals.some((r) => r.network === networkId);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="font-cinzel text-2xl md:text-3xl text-primary glow-gold flex items-center justify-center gap-2">
            <Star className="w-7 h-7" />
            Ganhe até 31.000 Likes GRÁTIS!
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Convide amigos de cada rede → <span className="text-primary font-bold">1.000 likes/rede</span> (1ª vez)
          </p>
        </div>

        {/* Stats */}
        <Card className="bg-card/80 border-border">
          <CardContent className="py-4 flex items-center justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{networksUsed}</p>
              <p className="text-xs text-muted-foreground">Redes usadas</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-2xl font-bold text-primary">
                {totalLikesEarned.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">Likes ganhos</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {(31000 - totalLikesEarned).toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">Likes restantes</p>
            </div>
          </CardContent>
        </Card>

        {/* Networks Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {NETWORKS.map((network) => {
            const used = isUsed(network.id);
            return (
              <button
                key={network.id}
                onClick={() => handleNetworkClick(network.id)}
                disabled={loadingNetwork === network.id}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 ${
                  used
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-card hover:border-primary/30 hover:bg-card/80"
                }`}
              >
                <span className="text-2xl md:text-3xl">{network.icon}</span>
                <span className="text-[10px] md:text-xs text-foreground leading-tight text-center">
                  {network.name}
                </span>
                {used && (
                  <span className="text-[9px] text-primary font-bold">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Badge */}
        {networksUsed >= 10 && (
          <div className="text-center py-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40 text-primary font-cinzel text-sm shadow-gold">
              🏆 Top Convidador — {networksUsed} redes!
            </span>
          </div>
        )}

        {/* Go to Playlike */}
        <div className="text-center pt-4">
          <Button
            onClick={() => navigate("/feed")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-cinzel text-lg px-8 shadow-gold"
          >
            <Home className="w-5 h-5 mr-2" />
            Ir para Playlike
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Convites;
