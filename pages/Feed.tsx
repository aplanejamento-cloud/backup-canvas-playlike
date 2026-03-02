import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGameState } from "@/hooks/useGameState";
import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";
import CreatePostForm from "@/components/feed/CreatePostForm";
import JuizPostForm from "@/components/feed/JuizPostForm";
import CulturaPostForm from "@/components/feed/CulturaPostForm";
import CulturaCarousel from "@/components/feed/CulturaCarousel";
import FeedTabs from "@/components/feed/FeedTabs";
import FeedList from "@/components/feed/FeedList";
import PaymentModal from "@/components/feed/PaymentModal";
import EditorModal from "@/components/feed/EditorModal";
import FeedHighlight from "@/components/retention/FeedHighlight";
import { FeedTab } from "@/types/feed";
import { useDailyReport } from "@/hooks/useDailyReport";
import { Trophy, Heart, Swords, FileText, Paintbrush, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Feed = () => {
  const { user, profile } = useAuth();
  const { gameState } = useGameState();
  const gameOn = gameState?.game_on ?? true;
  const [activeTab, setActiveTab] = useState<FeedTab>("na-tela");
  const [showPayment, setShowPayment] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const { data: report } = useDailyReport();

  // Likes recebidos HOJE
  const { data: likesHoje = 0 } = useQuery({
    queryKey: ["likes-hoje", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: myPosts } = await supabase.from("posts").select("id").eq("user_id", user.id);
      if (!myPosts?.length) return 0;
      const { count } = await supabase
        .from("post_interactions")
        .select("*", { count: "exact", head: true })
        .in("interaction_type", ["like", "love"])
        .gte("created_at", today.toISOString())
        .in("post_id", myPosts.map(p => p.id));
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (profile?.created_at) {
      const createdAt = new Date(profile.created_at);
      const now = new Date();
      const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 15) {
        const dismissed = sessionStorage.getItem("payment_dismissed");
        if (!dismissed) setShowPayment(true);
      }
    }
  }, [profile]);

  const handlePaymentClose = (open: boolean) => {
    setShowPayment(open);
    if (!open) sessionStorage.setItem("payment_dismissed", "true");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <InviteButton />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="font-cinzel text-2xl md:text-3xl text-foreground">
            Olá, <span className="text-primary">{profile?.name}</span>! ✨
          </h1>
        </div>

        {/* Likes Hoje Badge */}
        <div className="flex items-center justify-center gap-3">
          <div className="bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-bold text-primary">+{likesHoje} likes hoje</span>
          </div>
          <div className="bg-card border border-border rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Reset 00h</span>
          </div>
        </div>

        {/* Mini Daily Report */}
        {report && report.rankPosition > 0 && (
          <div className="bg-card border border-primary/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Seu Relatório</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-primary/10 rounded-lg p-2">
                <Trophy className="w-4 h-4 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Ranking</p>
                <p className="text-sm font-bold text-foreground">#{report.rankPosition}/{report.totalPlayers}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-2">
                <Heart className="w-4 h-4 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Hoje</p>
                <p className="text-sm font-bold text-foreground">+{report.totalLikesToday}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-2">
                <Swords className="w-4 h-4 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Duelos</p>
                <p className="text-sm font-bold text-foreground">{report.duelsWon} W</p>
              </div>
            </div>
          </div>
        )}

        <FeedHighlight />
        <CulturaCarousel />

        {/* Game ON: show post forms + editor */}
        {gameOn && (
          <>
            <Button
              onClick={() => setShowEditor(true)}
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10 min-h-[48px] text-sm font-semibold"
            >
              <Paintbrush className="w-4 h-4 mr-2" />
              Abrir Editor de Fotos ✨
            </Button>
            <CreatePostForm />
            <CulturaPostForm />
            <JuizPostForm />
          </>
        )}

        {/* Game OFF: banner */}
        {!gameOn && (
          <div className="bg-accent/20 border border-accent/40 rounded-xl p-4 text-center space-y-2">
            <p className="text-accent-foreground font-bold text-sm">⏸️ Jogo pausado</p>
            <p className="text-xs text-muted-foreground">Aguarde o início do jogo para publicar. Convide amigos enquanto espera!</p>
          </div>
        )}
        <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <FeedList tab={activeTab} />
      </main>
      <PaymentModal open={showPayment} onOpenChange={handlePaymentClose} />
      <EditorModal open={showEditor} onOpenChange={setShowEditor} />
    </div>
  );
};

export default Feed;
