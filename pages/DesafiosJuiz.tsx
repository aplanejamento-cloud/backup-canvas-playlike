import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDesafios, Desafio } from "@/hooks/useDesafios";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, Video, Send, Clock, CheckCircle, XCircle, Heart } from "lucide-react";
import { toast } from "sonner";

const DesafiosJuiz = () => {
  const { user, profile } = useAuth();
  const { desafiosAprovados, meusDesafios, isLoading, criarDesafio } = useDesafios();
  const { uploading, upload } = useMediaUpload();
  const [texto, setTexto] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isJuiz = profile?.user_type === "juiz";

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file, "video");
    if (url) setVideoUrl(url);
  };

  const handleSubmit = async () => {
    if (!texto.trim()) {
      toast.error("Escreva o texto do desafio!");
      return;
    }
    setSubmitting(true);
    await criarDesafio(texto.trim(), videoUrl || undefined);
    setTexto("");
    setVideoUrl("");
    setSubmitting(false);
  };

  const getStatusIcon = (d: any) => {
    if (d.aprovado) return <CheckCircle className="w-4 h-4 text-primary" />;
    if (d.rejeitado) return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-accent animate-pulse" />;
  };

  const getStatusText = (d: any) => {
    if (d.aprovado) return "Aprovado ✅";
    if (d.rejeitado) return "Rejeitado (likes devolvidos)";
    return "⏳ Pendente";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <InviteButton />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-cinzel text-2xl md:text-3xl text-primary glow-gold flex items-center justify-center gap-2">
            <Gavel className="w-7 h-7" /> Desafios de Juízes
          </h1>
          <p className="text-sm text-muted-foreground">
            Juízes pagam 100 likes para publicar desafios no feed!
          </p>
        </div>

        {/* Create form - only for juizes */}
        {isJuiz && (
          <Card className="bg-card/80 border-primary/50 border-2">
            <CardContent className="py-4 space-y-3">
              <h3 className="font-cinzel text-sm text-primary">🎬 Criar Desafio (-100 likes)</h3>
              <p className="text-xs text-muted-foreground">
                Seus likes: <span className="text-primary font-bold">{profile?.total_likes?.toLocaleString("pt-BR")}</span>
              </p>
              <Textarea
                placeholder="Descreva seu desafio..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="bg-input border-border min-h-[80px]"
                maxLength={500}
              />
              {videoUrl && (
                <video src={videoUrl} controls className="w-full rounded-lg max-h-48 object-cover" />
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-accent text-accent"
                  disabled={uploading}
                  onClick={() => document.getElementById("desafio-video-input")?.click()}
                >
                  <Video className="w-4 h-4 mr-1" /> {uploading ? "Enviando..." : "Vídeo"}
                </Button>
                <input
                  id="desafio-video-input"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !texto.trim() || (profile?.total_likes || 0) < 100}
                  className="bg-primary text-primary-foreground ml-auto"
                >
                  <Send className="w-4 h-4 mr-1" /> Enviar Desafio
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My challenges status */}
        {isJuiz && meusDesafios.length > 0 && (
          <Card className="bg-card/80 border-border">
            <CardContent className="py-4 space-y-3">
              <h3 className="font-cinzel text-sm text-primary">📋 Meus Desafios</h3>
              {meusDesafios.map((d: any) => (
                <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  {getStatusIcon(d)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{d.texto}</p>
                    <p className="text-xs text-muted-foreground">{getStatusText(d)}</p>
                  </div>
                  <span className="text-xs text-primary flex items-center gap-1">
                    <Heart className="w-3 h-3" /> -{d.likes_pago}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Approved challenges feed */}
        <div className="space-y-4">
          <h3 className="font-cinzel text-sm text-primary">🔥 Desafios Aprovados</h3>
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : desafiosAprovados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum desafio aprovado ainda. 🎬
            </div>
          ) : (
            desafiosAprovados.map((d: Desafio) => (
              <Card key={d.id} className="bg-card/80 border-border overflow-hidden">
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-accent">
                      <AvatarImage src={d.juiz_profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-secondary">{d.juiz_profile?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.juiz_profile?.name}</p>
                      <p className="text-xs text-accent">⚖️ Juiz • Desafio</p>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{d.texto}</p>
                  {d.video_url && (
                    <video src={d.video_url} controls className="w-full rounded-lg max-h-64 object-cover" />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default DesafiosJuiz;
