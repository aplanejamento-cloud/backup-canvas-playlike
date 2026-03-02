import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useJuizPostLimit } from "@/hooks/useJuizPostLimit";
import { useCreatePost } from "@/hooks/usePosts";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { Send, Loader2, Image, Video, Music, X, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MediaPreview {
  file: File;
  url: string;
  type: "image" | "video" | "music";
}

const JuizPostForm = () => {
  const { profile } = useAuth();
  const { canPost, remaining, isLoading, invalidate } = useJuizPostLimit();
  const createPost = useCreatePost();
  const { upload, uploading, ACCEPT } = useMediaUpload();

  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaPreview | null>(null);
  const [image, setImage] = useState<MediaPreview | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [mediaTypeToSelect, setMediaTypeToSelect] = useState<"video" | "music">("video");

  if (profile?.user_type !== "juiz") return null;

  // Colors for remaining counter
  const counterColor =
    remaining === 3 ? "text-success" :
    remaining === 2 ? "text-success" :
    remaining === 1 ? "text-primary" :
    "text-destructive";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage({ file, url, type: "image" });
    e.target.value = "";
  };

  const handleFileSelect = (type: "video" | "music") => {
    setMediaTypeToSelect(type);
    if (fileRef.current) {
      fileRef.current.accept = ACCEPT[type];
      fileRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMedia({ file, url, type: mediaTypeToSelect });
    e.target.value = "";
  };

  const removeMedia = () => {
    if (media) { URL.revokeObjectURL(media.url); setMedia(null); }
  };
  const removeImage = () => {
    if (image) { URL.revokeObjectURL(image.url); setImage(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) {
      toast.error("Limite de 3 posts/dia atingido!");
      return;
    }
    if (!content.trim() && !image && !media) {
      toast.error("Adicione texto ou mídia para publicar!");
      return;
    }

    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      let musicUrl: string | undefined;

      if (image) {
        const url = await upload(image.file, "image");
        if (url) imageUrl = url;
      }
      if (media) {
        const url = await upload(media.file, media.type);
        if (!url) return;
        if (media.type === "video") videoUrl = url;
        if (media.type === "music") musicUrl = url;
      }

      await createPost.mutateAsync({
        content: content.trim(),
        imageUrl,
        videoUrl,
        musicUrl,
      });

      setContent("");
      removeImage();
      removeMedia();
      invalidate();
      toast.success("Post publicado com sucesso! ✨");
    } catch {
      toast.error("Erro ao publicar post");
    }
  };

  const isSubmitting = createPost.isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input ref={imageRef} type="file" accept={ACCEPT.image} className="hidden" onChange={handleImageChange} />
      <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />

      {/* Header com limite diário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gavel className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-accent">Post de Juiz</span>
        </div>
        {!isLoading && (
          <div className={cn("text-xs font-bold flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50", counterColor)}>
            <span className="text-base font-cinzel">{remaining}</span>
            <span className="text-muted-foreground font-normal">
              {remaining === 1 ? "post restante hoje" : "posts restantes hoje"}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-accent/40">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-accent font-bold text-sm">{profile?.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <Textarea
            placeholder={canPost ? "Escreva seu veredito... ⚖️" : "Você atingiu o limite de 3 posts por hoje!"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] bg-background border-border resize-none"
            maxLength={500}
            disabled={!canPost || isSubmitting}
          />

          {/* Image preview */}
          {image && (
            <div className="flex items-center gap-2 p-1.5 rounded-lg border border-border bg-muted/30">
              <img src={image.url} alt="" className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
              <span className="text-xs text-muted-foreground flex-1 truncate">Imagem</span>
              <button type="button" onClick={removeImage} className="p-1 rounded-full bg-destructive/20 hover:bg-destructive/40 transition-colors">
                <X className="w-4 h-4 text-destructive" />
              </button>
            </div>
          )}

          {/* Video/Music preview */}
          {media && (
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
              <button type="button" onClick={removeMedia} className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1 hover:bg-background transition-colors">
                <X className="w-4 h-4 text-foreground" />
              </button>
              {media.type === "video" && <video src={media.url} controls className="w-full max-h-64" />}
              {media.type === "music" && (
                <div className="p-4 flex items-center gap-3">
                  <Music className="w-8 h-8 text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{media.file.name}</p>
                    <audio src={media.url} controls className="w-full mt-2" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => imageRef.current?.click()} disabled={isSubmitting || !canPost || !!image}
                className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40" title="Adicionar foto">
                <Image className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => handleFileSelect("video")} disabled={isSubmitting || !canPost || !!media}
                className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40" title="Adicionar vídeo">
                <Video className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => handleFileSelect("music")} disabled={isSubmitting || !canPost || !!media}
                className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40" title="Adicionar música">
                <Music className="w-5 h-5" />
              </button>
              <span className="text-xs text-muted-foreground ml-2">{content.length}/500</span>
            </div>

            <Button type="submit" size="sm" disabled={isSubmitting || !canPost || (!content.trim() && !image && !media)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" />Publicar</>}
            </Button>
          </div>
        </div>
      </div>

      {!canPost && (
        <div className="text-center text-xs text-destructive bg-destructive/10 rounded-lg py-2 font-medium">
          🚫 Limite de 3 posts/dia atingido! Volte amanhã.
        </div>
      )}
    </form>
  );
};

export default JuizPostForm;
