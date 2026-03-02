import { useState, useRef } from "react";
import { useHomeConfig, SecondaryPrize, Sponsor } from "@/hooks/useHomeConfig";
import RichTextEditor from "./RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Upload, Trash2, Save, Loader2, LogOut, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const AdminHomePanel = () => {
  const { config, updateConfig, uploadHomeMedia } = useHomeConfig();
  const { signOut } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [prizeValue, setPrizeValue] = useState(config?.prize_value || "R$50.000");
  const [prizeEnabled, setPrizeEnabled] = useState(config?.prize_enabled ?? true);
  const [promoText, setPromoText] = useState(config?.promo_text || "");
  const [promoText2, setPromoText2] = useState(config?.promo_text_2 || "");
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);
  const [uploadingPrize, setUploadingPrize] = useState(false);
  const [uploadingSponsor, setUploadingSponsor] = useState(false);
  const rulesRef = useRef<HTMLInputElement>(null);
  const prizeVideoRef = useRef<HTMLInputElement>(null);
  const secondaryRef = useRef<HTMLInputElement>(null);
  const sponsorRef = useRef<HTMLInputElement>(null);

  useState(() => {
    if (config) {
      setPrizeValue(config.prize_value);
      setPrizeEnabled(config.prize_enabled);
      setPromoText(config.promo_text);
      setPromoText2(config.promo_text_2);
    }
  });

  const handleVideoUpload = async (file: File, type: "loop" | "rules" | "prize") => {
    if (file.size > 100 * 1024 * 1024) { toast.error("Vídeo muito grande! Máximo: 100MB"); return; }
    setUploadingVideo(type);
    const url = await uploadHomeMedia(file, `videos`);
    if (url) {
      const key = type === "loop" ? "video_loop_url" : type === "rules" ? "video_rules_url" : "video_prize_url";
      await updateConfig.mutateAsync({ [key]: url });
    }
    setUploadingVideo(null);
  };

  const handleSecondaryPrizeUpload = async (files: FileList) => {
    setUploadingPrize(true);
    const currentPrizes: SecondaryPrize[] = config?.secondary_prizes || [];
    const newPrizes = [...currentPrizes];
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) continue;
      const url = await uploadHomeMedia(file, "prizes");
      if (url) newPrizes.push({ id: crypto.randomUUID(), url, type: isVideo ? "video" : "image" });
    }
    await updateConfig.mutateAsync({ secondary_prizes: newPrizes as unknown as SecondaryPrize[] });
    setUploadingPrize(false);
  };

  const handleSponsorUpload = async (files: FileList) => {
    setUploadingSponsor(true);
    const currentSponsors: Sponsor[] = config?.sponsors || [];
    const newSponsors = [...currentSponsors];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const url = await uploadHomeMedia(file, "sponsors");
      if (url) newSponsors.push({ id: crypto.randomUUID(), url });
    }
    await updateConfig.mutateAsync({ sponsors: newSponsors as unknown as Sponsor[] });
    setUploadingSponsor(false);
  };

  const removePrize = async (id: string) => {
    const updated = (config?.secondary_prizes || []).filter((p) => p.id !== id);
    await updateConfig.mutateAsync({ secondary_prizes: updated as unknown as SecondaryPrize[] });
  };

  const removeSponsor = async (id: string) => {
    const updated = (config?.sponsors || []).filter((s) => s.id !== id);
    await updateConfig.mutateAsync({ sponsors: updated as unknown as Sponsor[] });
  };

  const savePrizeAndPromo = async () => {
    await updateConfig.mutateAsync({ prize_value: prizeValue, prize_enabled: prizeEnabled, promo_text: promoText, promo_text_2: promoText2 });
  };

  const handleExitAdmin = async () => {
    await signOut();
  };

  if (!config) return null;

  return (
    <Card className="border-primary/50 bg-card/80 backdrop-blur-sm">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <span className="font-cinzel text-primary font-bold">Painel Admin</span>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-6">
          {/* Exit Admin Button */}
          <Button variant="destructive" onClick={handleExitAdmin} className="w-full">
            <LogOut className="h-4 w-4 mr-2" /> Sair do Admin
          </Button>

          {/* Videos - 3 distinct */}
          <section className="space-y-3">
            <h3 className="font-montserrat text-sm font-semibold text-foreground">📹 Vídeos da Home</h3>
            <div className="grid grid-cols-1 gap-3">
              {(["loop", "rules", "prize"] as const).map((type) => {
                const url = type === "loop" ? config.video_loop_url : type === "rules" ? config.video_rules_url : config.video_prize_url;
                const label = type === "loop" ? "🔄 Loop Auto (Topo)" : type === "rules" ? "📜 Regras" : "🏆 Prêmio";
                return (
                  <div key={type} className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    {url && <video src={url} controls className="w-full rounded-lg aspect-video object-cover" />}
                    <input ref={type === "rules" ? rulesRef : prizeVideoRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f, type); }} />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" disabled={uploadingVideo === type} onClick={() => {
                        if (type === "loop") {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "video/*";
                          input.onchange = (ev) => { const f = (ev.target as HTMLInputElement).files?.[0]; if (f) handleVideoUpload(f, type); };
                          input.click();
                        } else if (type === "rules") rulesRef.current?.click();
                        else prizeVideoRef.current?.click();
                      }}>
                        {uploadingVideo === type ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        {url ? "Substituir" : "Enviar"}
                      </Button>
                      {url && (
                        <Button variant="destructive" size="sm" onClick={async () => {
                          const key = type === "loop" ? "video_loop_url" : type === "rules" ? "video_rules_url" : "video_prize_url";
                          await updateConfig.mutateAsync({ [key]: null });
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Prize */}
          <section className="space-y-3">
            <h3 className="font-montserrat text-sm font-semibold text-foreground">🏆 Prêmio Principal</h3>
            <div className="flex items-center gap-3">
              <Input value={prizeValue} onChange={(e) => setPrizeValue(e.target.value)} className="flex-1" placeholder="R$50.000" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ativo</span>
                <Switch checked={prizeEnabled} onCheckedChange={setPrizeEnabled} />
              </div>
            </div>
          </section>

          {/* Sponsors */}
          <section className="space-y-3">
            <h3 className="font-montserrat text-sm font-semibold text-foreground">🤝 Patrocinadores</h3>
            {config.sponsors.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {config.sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-border group">
                    <img src={sponsor.url} alt="Patrocinador" className="w-full h-full object-contain bg-muted" />
                    <button onClick={() => removeSponsor(sponsor.id)} className="absolute top-1 right-1 bg-destructive/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3 text-destructive-foreground" /></button>
                  </div>
                ))}
              </div>
            )}
            <input ref={sponsorRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) handleSponsorUpload(e.target.files); }} />
            <Button variant="outline" size="sm" disabled={uploadingSponsor} onClick={() => sponsorRef.current?.click()}>
              {uploadingSponsor ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Adicionar Patrocinadores
            </Button>
          </section>

          {/* Secondary Prizes */}
          <section className="space-y-3">
            <h3 className="font-montserrat text-sm font-semibold text-foreground">🎁 Prêmios Secundários</h3>
            {config.secondary_prizes.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {config.secondary_prizes.map((prize) => (
                  <div key={prize.id} className="relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden border border-border group">
                    {prize.type === "video" ? <video src={prize.url} className="w-full h-full object-cover" muted /> : <img src={prize.url} alt="Prêmio" className="w-full h-full object-cover" />}
                    <button onClick={() => removePrize(prize.id)} className="absolute top-1 right-1 bg-destructive/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3 text-destructive-foreground" /></button>
                  </div>
                ))}
              </div>
            )}
            <input ref={secondaryRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) handleSecondaryPrizeUpload(e.target.files); }} />
            <Button variant="outline" size="sm" disabled={uploadingPrize} onClick={() => secondaryRef.current?.click()}>
              {uploadingPrize ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Adicionar Fotos/Vídeos
            </Button>
          </section>

          {/* Promo Text 1 - After Top 10 */}
          <section className="space-y-3">
            <h3 className="font-montserrat text-sm font-semibold text-foreground">✏️ Texto 1 (após Top 10 / prêmios)</h3>
            <RichTextEditor content={promoText} onChange={setPromoText} />
          </section>

          {/* Promo Text 2 - End of page */}
          <section className="space-y-3">
            <h3 className="font-montserrat text-sm font-semibold text-foreground">✏️ Texto 2 (final da página)</h3>
            <RichTextEditor content={promoText2} onChange={setPromoText2} />
          </section>

          {/* Save */}
          <Button onClick={savePrizeAndPromo} disabled={updateConfig.isPending} className="w-full">
            {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      )}
    </Card>
  );
};

export default AdminHomePanel;
