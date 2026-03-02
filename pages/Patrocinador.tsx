import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, MessageCircle, TrendingUp, Users, Heart } from "lucide-react";

const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_MSG = encodeURIComponent("Olá! Tenho interesse em ser patrocinador do PlayLike! 👑");

const Patrocinador = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary rounded-full px-4 py-2 text-sm font-bold">
            <Crown className="w-5 h-5" />
            SEJA PATROCINADOR
          </div>
          <h1 className="font-cinzel text-3xl md:text-4xl text-foreground">
            Sua marca no <span className="text-primary">PlayLike</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Alcance milhares de jovens engajados na rede social que está revolucionando a gamificação.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          <Card className="bg-card/80 border-primary/20">
            <CardContent className="py-4 text-center">
              <Users className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">1000+</p>
              <p className="text-xs text-muted-foreground">Usuários ativos</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-primary/20">
            <CardContent className="py-4 text-center">
              <Heart className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">50k+</p>
              <p className="text-xs text-muted-foreground">Interações/dia</p>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-primary/20">
            <CardContent className="py-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold text-foreground">95%</p>
              <p className="text-xs text-muted-foreground">Engajamento</p>
            </CardContent>
          </Card>
        </section>

        {/* Benefits */}
        <section className="space-y-3">
          <h2 className="font-cinzel text-lg text-primary text-center">O que você ganha</h2>
          {[
            { icon: "🎯", text: "Logo fixo no topo do feed principal" },
            { icon: "📹", text: "Vídeo promocional autoplay na home" },
            { icon: "🏆", text: "Menção nos prêmios e desafios" },
            { icon: "📊", text: "Relatório de alcance e engajamento" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3 bg-card/60 border border-border rounded-lg p-3">
              <span className="text-2xl">{b.icon}</span>
              <span className="text-sm text-foreground">{b.text}</span>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="text-center space-y-4">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-6 rounded-full animate-pulse shadow-lg">
              <MessageCircle className="w-6 h-6 mr-2" />
              QUERO SER PATROCINADOR
            </Button>
          </a>
          <p className="text-xs text-muted-foreground">WhatsApp: (11) 99999-9999</p>
        </section>

        <footer className="text-center pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} PLAYLIKE</p>
        </footer>
      </main>
    </div>
  );
};

export default Patrocinador;
