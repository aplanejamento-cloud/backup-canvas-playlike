import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useCreatePost } from "@/hooks/usePosts";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload, Download, Send, X, Type, Smile, Sparkles, RotateCcw,
  SunMedium, Contrast, Droplets, Palette, Zap, Moon, Eye, Layers,
  Image as ImageIcon, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  "🍀", "🌸", "🌻", "🎭", "🃏", "♠️", "♥️", "♦️", "♣️", "🎲",
  "⚡", "💰", "🎁", "🏅", "🥇", "🥈", "🥉", "👸", "🤴", "🦁",
];

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

interface EmojiOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

const Editor = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const remixPostId = searchParams.get("remix");
  const remixImageUrl = searchParams.get("image");

  const [image, setImage] = useState<string | null>(remixImageUrl || null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setImage(url);
    setActiveFilter(0);
    setTextOverlays([]);
    setEmojiOverlays([]);
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    setTextOverlays(prev => [...prev, {
      id: Date.now().toString(),
      text: newText,
      x: 50, y: 50,
      color: textColor,
      fontSize: 24,
    }]);
    setNewText("");
    setShowTextInput(false);
  };

  const addEmoji = (emoji: string) => {
    setEmojiOverlays(prev => [...prev, {
      id: Date.now().toString(),
      emoji,
      x: 50, y: 50,
      size: 40,
    }]);
  };

  const handlePointerDown = (type: "text" | "emoji", id: string) => {
    setDragging({ type, id });
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    if (dragging.type === "text") {
      setTextOverlays(prev => prev.map(t => t.id === dragging.id ? { ...t, x: clampedX, y: clampedY } : t));
    } else {
      setEmojiOverlays(prev => prev.map(e => e.id === dragging.id ? { ...e, x: clampedX, y: clampedY } : e));
    }
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

        // Apply filter
        ctx.filter = FILTERS[activeFilter].css;
        ctx.drawImage(img, 0, 0);
        ctx.filter = "none";

        // Text overlays
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

        // Emoji overlays
        emojiOverlays.forEach(e => {
          const px = (e.x / 100) * canvas.width;
          const py = (e.y / 100) * canvas.height;
          const size = (e.size / 400) * canvas.width;
          ctx.font = `${size}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(e.emoji, px, py);
        });

        // Watermark
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
      const blob = await renderToCanvas();
      const file = new File([blob], `editor-${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = await upload(file, "image");
      if (!url) return;

      await createPost.mutateAsync({
        content: postCaption || "Criado no Editor PlayLike ✨",
        imageUrl: url,
      });

      toast.success("Post publicado! 🎉");
      navigate("/feed");
    } catch { toast.error("Erro ao publicar"); }
  };

  const isProcessing = uploading || createPost.isPending;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        <h1 className="font-cinzel text-2xl text-center text-foreground">
          Editor <span className="text-primary">PlayLike</span> ✨
        </h1>

        {!image ? (
          <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-card">
            <Upload className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Toque para selecionar uma foto</p>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        ) : (
          <>
            {/* Canvas area */}
            <div
              ref={containerRef}
              className="relative rounded-xl overflow-hidden border border-border bg-black touch-none select-none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <img
                src={image}
                alt="Editor"
                className="w-full block"
                style={{ filter: FILTERS[activeFilter].css }}
                draggable={false}
              />

              {/* Text overlays */}
              {textOverlays.map(t => (
                <div
                  key={t.id}
                  className="absolute cursor-move"
                  style={{
                    left: `${t.x}%`, top: `${t.y}%`,
                    transform: "translate(-50%, -50%)",
                    color: t.color,
                    fontSize: t.fontSize,
                    fontWeight: "bold",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                    userSelect: "none",
                  }}
                  onPointerDown={() => handlePointerDown("text", t.id)}
                >
                  {t.text}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeOverlay("text", t.id); }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}

              {/* Emoji overlays */}
              {emojiOverlays.map(e => (
                <div
                  key={e.id}
                  className="absolute cursor-move"
                  style={{
                    left: `${e.x}%`, top: `${e.y}%`,
                    transform: "translate(-50%, -50%)",
                    fontSize: e.size,
                    userSelect: "none",
                  }}
                  onPointerDown={() => handlePointerDown("emoji", e.id)}
                >
                  {e.emoji}
                  <button
                    onClick={(ev) => { ev.stopPropagation(); removeOverlay("emoji", e.id); }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-2">
                {FILTERS.map((f, i) => (
                  <button
                    key={f.name}
                    onClick={() => setActiveFilter(i)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all min-w-[60px]",
                      i === activeFilter ? "bg-primary/20 text-primary border border-primary/30" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <f.icon className="w-4 h-4" />
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowTextInput(!showTextInput)}>
                <Type className="w-4 h-4 mr-1" /> Texto
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowEmojis(!showEmojis)}>
                <Smile className="w-4 h-4 mr-1" /> Emojis
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setImage(null); setTextOverlays([]); setEmojiOverlays([]); setActiveFilter(0); }}>
                <RotateCcw className="w-4 h-4 mr-1" /> Resetar
              </Button>
            </div>

            {/* Text input */}
            {showTextInput && (
              <div className="flex gap-2 items-end bg-card p-3 rounded-lg border border-border">
                <Input value={newText} onChange={e => setNewText(e.target.value)} placeholder="Digite o texto..." className="flex-1" maxLength={50} />
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                <Button size="sm" onClick={addTextOverlay} disabled={!newText.trim()}>Adicionar</Button>
              </div>
            )}

            {/* Emoji picker */}
            {showEmojis && (
              <div className="grid grid-cols-10 gap-1 bg-card p-3 rounded-lg border border-border max-h-40 overflow-y-auto">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => addEmoji(e)} className="text-2xl hover:scale-125 transition-transform p-1">
                    {e}
                  </button>
                ))}
              </div>
            )}

            {/* Caption */}
            <Textarea
              placeholder="Legenda do post (opcional)..."
              value={postCaption}
              onChange={e => setPostCaption(e.target.value)}
              className="min-h-[60px] bg-card border-border"
              maxLength={500}
            />

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleDownload} disabled={isProcessing}>
                <Download className="w-4 h-4 mr-1" /> Baixar
              </Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handlePost} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                Postar
              </Button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {remixPostId && (
          <p className="text-xs text-center text-muted-foreground">
            🔄 Remixando post original — o autor receberá +10 likes!
          </p>
        )}
      </main>
    </div>
  );
};

export default Editor;
