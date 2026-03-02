import { useNavigate } from "react-router-dom";
import Logo from "@/components/home/Logo";
import PrizeBanner from "@/components/home/PrizeBanner";
import VideoPlaceholder from "@/components/home/VideoPlaceholder";
import LeaderHighlight from "@/components/home/LeaderHighlight";
import TopTenList from "@/components/home/TopTenList";
import SignupForm from "@/components/home/SignupForm";
import LoginButton from "@/components/home/LoginButton";
import SecondaryPrizes from "@/components/home/SecondaryPrizes";
import PromoText from "@/components/home/PromoText";
import AdminHomePanel from "@/components/admin/AdminHomePanel";
import AdminGamePanel from "@/components/admin/AdminGamePanel";
import AdminModerationPanel from "@/components/admin/AdminModerationPanel";
import AdminPixPanel from "@/components/admin/AdminPixPanel";
import AdminTemasPanel from "@/components/admin/AdminTemasPanel";
import AdminAssetsPanel from "@/components/admin/AdminAssetsPanel";
import AdminDesafiosPanel from "@/components/admin/AdminDesafiosPanel";
import { useTopRanking } from "@/hooks/useRanking";
import { useHomeConfig } from "@/hooks/useHomeConfig";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";
import GlobalNav from "@/components/GlobalNav";
import InviteButton from "@/components/InviteButton";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Volume2, VolumeX } from "lucide-react";
import HomeBanner from "@/components/retention/HomeBanner";

const AutoPlayVideo = ({ url }: { url: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <Card className="relative overflow-hidden bg-card/80 border border-border">
      <video
        ref={videoRef}
        src={url}
        autoPlay
        loop
        playsInline
        muted={false}
        className="w-full aspect-video object-cover"
      />
      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 bg-background/70 rounded-full p-2 hover:bg-background/90 transition-colors"
      >
        {muted ? <VolumeX className="w-5 h-5 text-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
      </button>
    </Card>
  );
};

const SponsorsShelf = ({ sponsors }: { sponsors: { id: string; url: string }[] }) => {
  if (sponsors.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className="font-cinzel text-sm md:text-base text-primary glow-gold-subtle text-center">
        🤝 Patrocinadores
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'thin' }}>
        {sponsors.map((s) => (
          <div key={s.id} className="flex-shrink-0 w-28 h-28 md:w-36 md:h-36 rounded-xl overflow-hidden border border-primary/30 shadow-gold snap-center bg-muted/30 flex items-center justify-center p-2">
            <img src={s.url} alt="Patrocinador" className="max-w-full max-h-full object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
};

const Index = () => {
  const { players, isLoading } = useTopRanking(10);
  const { config, isLoading: configLoading } = useHomeConfig();
  const { isAdmin } = useIsAdmin();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const topTenFormatted = players.map((p, i) => ({
    id: p.id,
    name: p.name,
    likes: p.total_likes,
    position: i + 1,
    avatarUrl: p.avatar_url || undefined,
  }));

  const leader = topTenFormatted[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {user ? (
        <AppHeader />
      ) : (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="font-cinzel text-xl md:text-2xl text-primary glow-gold-subtle">PLAYLIKE</h1>
            <LoginButton />
          </div>
          <div className="container mx-auto px-4 pb-1.5 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
            <GlobalNav />
          </div>
        </header>
      )}
      {user && <InviteButton />}

      {/* Retention Banner for logged-in users */}
      {user && (
        <div className="container mx-auto px-4 pt-4 max-w-2xl">
          <HomeBanner />
        </div>
      )}

      <main className="pb-12">
        <div className="container mx-auto px-4 space-y-8 md:space-y-12">
          {/* Admin Panels */}
          {isAdmin && (
            <section className="max-w-4xl mx-auto pt-4 space-y-4">
              <AdminHomePanel />
              <AdminGamePanel />
              <AdminModerationPanel />
              <AdminPixPanel />
              <AdminTemasPanel />
              <AdminAssetsPanel />
              <AdminDesafiosPanel />
            </section>
          )}

          {/* Hero Section */}
          <section className="text-center pt-8 md:pt-12">
            <Logo />
          </section>

          {/* Logout for logged-in users */}
          {user && (
            <section className="flex flex-col items-center gap-3">
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4 mr-1" /> Sair
              </Button>
            </section>
          )}

          {/* Prize Banner */}
          {(config?.prize_enabled ?? true) && (
            <section className="max-w-2xl mx-auto">
              <PrizeBanner displayValue={config?.prize_value} />
            </section>
          )}

          {/* Sponsors - below prize banner */}
          {config && Array.isArray(config.sponsors) && config.sponsors.length > 0 && (
            <section className="max-w-4xl mx-auto bg-card/40 rounded-3xl border border-border p-4 md:p-6 backdrop-blur-sm">
              <SponsorsShelf sponsors={config.sponsors} />
            </section>
          )}

          {/* Video 1 - Loop Autoplay with Sound */}
          {config?.video_loop_url && (
            <section className="max-w-4xl mx-auto">
              <AutoPlayVideo url={config.video_loop_url} />
            </section>
          )}

          {/* Video 2 & 3 - Rules and Prize */}
          <section className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {config?.video_rules_url && (
                <VideoPlaceholder type="rules" title="Entenda as Regras" videoUrl={config.video_rules_url} />
              )}
              {config?.video_prize_url && (
                <VideoPlaceholder type="prize" title="Conheça o Prêmio" videoUrl={config.video_prize_url} />
              )}
            </div>
          </section>

          {/* Leader Highlight */}
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : leader ? (
            <section className="max-w-md mx-auto bg-card/40 rounded-3xl border border-border backdrop-blur-sm">
              <LeaderHighlight name={leader.name} avatarUrl={leader.avatarUrl} likes={leader.likes} />
            </section>
          ) : null}

          {/* Top 10 */}
          {!isLoading && topTenFormatted.length > 0 && (
            <section className="max-w-4xl mx-auto bg-card/40 rounded-3xl border border-border p-4 md:p-6 backdrop-blur-sm">
              <TopTenList players={topTenFormatted} />
            </section>
          )}

          {/* Secondary Prizes */}
          {config && Array.isArray(config.secondary_prizes) && config.secondary_prizes.length > 0 && (
            <section className="max-w-4xl mx-auto bg-card/40 rounded-3xl border border-border p-4 md:p-6 backdrop-blur-sm">
              <SecondaryPrizes prizes={config.secondary_prizes} />
            </section>
          )}

          {/* Promo Text 1 - After Top 10 / prizes */}
          {config?.promo_text && (
            <section className="max-w-2xl mx-auto">
              <PromoText html={config.promo_text} />
            </section>
          )}

          {/* Signup Form - only for non-logged-in users */}
          {!user && (
            <section id="signup-section" className="max-w-md mx-auto">
              <SignupForm />
            </section>
          )}

          {/* Promo Text 2 - End of page (after signup) */}
          {config?.promo_text_2 && (
            <section className="max-w-2xl mx-auto">
              <PromoText html={config.promo_text_2} />
            </section>
          )}

          {/* Footer */}
          <footer className="text-center pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} PLAYLIKE - Todos os direitos reservados</p>
            <p className="text-xs text-muted-foreground mt-2">Onde a fama começa ✨</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Index;
