import { useState, useRef, useCallback } from "react";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useCreatePost } from "@/hooks/usePosts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Upload, Download, Send, X, Type, Smile, Sparkles, RotateCcw,
  SunMedium, Contrast, Droplets, Palette, Zap, Moon, Eye, Layers,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FILTERS = [
  { name: "Normal", css: "none", icon: Eye },
  { name: "Brilho", css: "brightness(1.3)", icon: SunMedium },
  { name: "Contraste", css: "contrast(1.4)", icon: Contrast },
  { name: "Saturar", css: "saturate(1.8)", icon: Droplets },
  { name: "Sépia", css: "sepia(0.8)", icon: Palette },
  { name: "P&B", css: "grayscale(1)", icon: Moon },
  { name: "Inverter", css: "invert(1)", icon: Zap },
  { name: "Blur", css: "blur(2px)", icon: Layers },
  { name: "Vintage", css: "sepia(0.4) contrast(1.2) brightness(0.9)", icon: Sparkles },
  { name: "Frio", css: "saturate(0.8) brightness(1.1) hue-rotate(20deg)", icon: Droplets },
  { name: "Quente", css: "saturate(1.3) brightness(1.05) hue-rotate(-10deg)", icon: SunMedium },
  { name: "Drama", css: "contrast(1.6) saturate(0.6) brightness(0.9)", icon: Contrast },
];

const EMOJIS = [
  "😂", "🔥", "❤️", "🎉", "👑", "💎", "⭐", "🏆", "🎶", "💪",
  "😎", "🤩", "💖", "🌟", "✨", "🎯", "💥", "🚀", "🦋", "🌈",
  "👏", "🙌", "💯", "🎵", "🎸", "🎤", "🎬", "📸", "💫", "🔮",
];

interface TextOverlay { id: string; text: string; x: number; y: number; color: string; fontSize: number; }
interface EmojiOverlay { id: string; emoji: string; x: number; y: number; size: number; }

interface EditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditorModal = ({ open, onOpenChange }: EditorModalProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [activeFilter, setActiveFilter] = useState(0);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [emojiOverlays, setEmojiOverlays] = useState<EmojiOverlay[]>([]);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [postCaption, setPostCaption] = useState("");
  const [dragging, setDragging] = useState<{ type: "text" | "emoji"; id: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { upload, uploading } = useMediaUpload();
  const createPost = useCreatePost();

  const resetAll = () => {
    setImage(null);
    setActiveFilter(0);
    setTextOverlays([]);
    setEmojiOverlays([]);
    setShowEmojis(false);
    setShowTextInput(false);
    setNewText("");
    setPostCaption("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "image");
    setImage(URL.createObjectURL(file));
    setActiveFilter(0);
    setTextOverlays([]);
    setEmojiOverlays([]);
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    setTextOverlays(prev => [...prev, { id: Date.now().toString(), text: newText, x: 50, y: 50, color: textColor, fontSize: 24 }]);
    setNewText("");
    setShowTextInput(false);
  };

  const addEmoji = (emoji: string) => {
    setEmojiOverlays(prev => [...prev, { id: Date.now().toString(), emoji, x: 50, y: 50, size: 40 }]);
  };

  const handlePointerDown = (type: "text" | "emoji", id: string) => setDragging({ type, id });

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    if (dragging.type === "text") setTextOverlays(prev => prev.map(t => t.id === dragging.id ? { ...t, x, y } : t));
    else setEmojiOverlays(prev => prev.map(em => em.id === dragging.id ? { ...em, x, y } : em));
  }, [dragging]);

  const handlePointerUp = () => setDragging(null);

  const removeOverlay = (type: "text" | "emoji", id: string) => {
    if (type === "text") setTextOverlays(prev => prev.filter(t => t.id !== id));
    else setEmojiOverlays(prev => prev.filter(e => e.id !== id));
  };

  const renderToCanvas = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return reject("No canvas/image");
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.filter = FILTERS[activeFilter].css;
        ctx.drawImage(img, 0, 0);
        ctx.filter = "none";
        textOverlays.forEach(t => {
          const px = (t.x / 100) * canvas.width;
          const py = (t.y / 100) * canvas.height;
          const fontSize = (t.fontSize / 400) * canvas.width;
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = t.color;
          ctx.strokeStyle = "rgba(0,0,0,0.7)";
          ctx.lineWidth = fontSize / 10;
          ctx.textAlign = "center";
          ctx.strokeText(t.text, px, py);
          ctx.fillText(t.text, px, py);
        });
        emojiOverlays.forEach(e => {
          const px = (e.x / 100) * canvas.width;
          const py = (e.y / 100) * canvas.height;
          ctx.font = `${(e.size / 400) * canvas.width}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(e.emoji, px, py);
        });
        const wmSize = canvas.width * 0.03;
        ctx.font = `bold ${wmSize}px sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.textAlign = "right";
        ctx.fillText("PlayLike ✨", canvas.width - 10, canvas.height - 10);
        canvas.toBlob(blob => blob ? resolve(blob) : reject("toBlob failed"), "image/jpeg", 0.92);
      };
      img.onerror = reject;
      img.src = image;
    });
  };

  const handleDownload = async () => {
    try {
      const blob = await renderToCanvas();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `playlike-editor-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Imagem baixada! 📥");
    } catch { toast.error("Erro ao baixar imagem"); }
  };

  const handlePost = async () => {
    if (!image) return;
    try {
      if (mediaType === "video") {
        // For video, upload the original file with filter applied via CSS only
        const response = await fetch(image);
        const blob = await response.blob();
        const file = new File([blob], `editor-video-${Date.now()}.mp4`, { type: "video/mp4" });
        const url = await upload(file, "video");
        if (!url) return;
        await createPost.mutateAsync({ content: postCaption || "Criado no Editor PlayLike ✨", videoUrl: url });
      } else {
        const blob = await renderToCanvas();
        const file = new File([blob], `editor-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = await upload(file, "image");
        if (!url) return;
        await createPost.mutateAsync({ content: postCaption || "Criado no Editor PlayLike ✨", imageUrl: url });
      }
      toast.success("Post publicado! 🎉");
      resetAll();
      onOpenChange(false);
    } catch { toast.error("Erro ao publicar"); }
  };

  const isProcessing = uploading || createPost.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAll(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl p-4 gap-3">
        <DialogTitle className="font-cinzel text-lg text-center">
          Editor <span className="text-primary">PlayLike</span> ✨
        </DialogTitle>

        {!image ? (
          <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-card">
            <Upload className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">Toque para selecionar uma foto ou vídeo</p>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />
          </label>
        ) : (
          <>
            {/* Tools ABOVE preview */}
            <div className="flex gap-1.5 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowTextInput(!showTextInput)} className="text-xs h-9"><Type className="w-3.5 h-3.5 mr-1" />Texto</Button>
              <Button variant="outline" size="sm" onClick={() => setShowEmojis(!showEmojis)} className="text-xs h-9"><Smile className="w-3.5 h-3.5 mr-1" />Emojis</Button>
              <Button variant="outline" size="sm" onClick={resetAll} className="text-xs h-9"><RotateCcw className="w-3.5 h-3.5 mr-1" />Resetar</Button>
            </div>

            {showTextInput && (
              <div className="flex gap-2 items-end bg-card p-2 rounded-lg border border-border">
                <Input value={newText} onChange={e => setNewText(e.target.value)} placeholder="Texto..." className="flex-1 h-9" maxLength={50} />
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer" />
                <Button size="sm" onClick={addTextOverlay} disabled={!newText.trim()} className="h-9">OK</Button>
              </div>
            )}

            {showEmojis && (
              <div className="grid grid-cols-10 gap-0.5 bg-card p-2 rounded-lg border border-border max-h-28 overflow-y-auto">
                {EMOJIS.map(e => (<button key={e} onClick={() => addEmoji(e)} className="text-xl hover:scale-125 transition-transform p-0.5">{e}</button>))}
              </div>
            )}

            {/* Filters */}
            <div className="overflow-x-auto">
              <div className="flex gap-1.5 pb-1">
                {FILTERS.map((f, i) => (
                  <button key={f.name} onClick={() => setActiveFilter(i)} className={cn("flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all min-w-[50px]", i === activeFilter ? "bg-primary/20 text-primary border border-primary/30" : "bg-card border border-border text-muted-foreground")}>
                    <f.icon className="w-3.5 h-3.5" />
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview BELOW buttons */}
            <div
              ref={containerRef}
              className="relative rounded-xl overflow-hidden border border-border bg-black touch-none select-none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {mediaType === "video" ? (
                <video src={image} className="w-full block" controls style={{ filter: FILTERS[activeFilter].css }} />
              ) : (
                <img src={image} alt="Editor" className="w-full block" style={{ filter: FILTERS[activeFilter].css }} draggable={false} />
              )}
              {textOverlays.map(t => (
                <div key={t.id} className="absolute cursor-move" style={{ left: `${t.x}%`, top: `${t.y}%`, transform: "translate(-50%,-50%)", color: t.color, fontSize: t.fontSize, fontWeight: "bold", textShadow: "2px 2px 4px rgba(0,0,0,0.8)", userSelect: "none" }} onPointerDown={() => handlePointerDown("text", t.id)}>
                  {t.text}
                  <button onClick={(e) => { e.stopPropagation(); removeOverlay("text", t.id); }} className="absolute -top-2 -right-2 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
                </div>
              ))}
              {emojiOverlays.map(e => (
                <div key={e.id} className="absolute cursor-move" style={{ left: `${e.x}%`, top: `${e.y}%`, transform: "translate(-50%,-50%)", fontSize: e.size, userSelect: "none" }} onPointerDown={() => handlePointerDown("emoji", e.id)}>
                  {e.emoji}
                  <button onClick={(ev) => { ev.stopPropagation(); removeOverlay("emoji", e.id); }} className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"><X className="w-2.5 h-2.5 text-white" /></button>
                </div>
              ))}
            </div>

            <Textarea
              placeholder="Legenda (opcional)..."
              value={postCaption}
              onChange={e => setPostCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const target = e.target as HTMLTextAreaElement;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const newVal = postCaption.substring(0, start) + '\n' + postCaption.substring(end);
                  setPostCaption(newVal);
                  requestAnimationFrame(() => { target.selectionStart = target.selectionEnd = start + 1; });
                }
              }}
              className="min-h-[50px] bg-card border-border text-sm"
              maxLength={500}
            />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleDownload} disabled={isProcessing}><Download className="w-4 h-4 mr-1" />Baixar</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handlePost} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                Postar
              </Button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditorModal;