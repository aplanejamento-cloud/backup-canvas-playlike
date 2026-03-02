import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/hooks/usePosts";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useBlacklist } from "@/hooks/useBlacklist";
import { Send, Loader2, Image, Video, Music, X } from "lucide-react";
import { toast } from "sonner";

interface MediaPreview {
  file: File;
  url: string;
  type: "image" | "video" | "music";
}

const MAX_IMAGES = 10;

const CreatePostForm = () => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<MediaPreview[]>([]);
  const [media, setMedia] = useState<MediaPreview | null>(null); // video/music
  const { profile } = useAuth();
  const createPost = useCreatePost();
  const { upload, uploading, ACCEPT } = useMediaUpload();
  const { checkContent } = useBlacklist();
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [mediaTypeToSelect, setMediaTypeToSelect] = useState<"video" | "music">("video");

  if (profile?.user_type === "juiz") return null;

  const handleImageSelect = () => {
    if (imageRef.current) {
      imageRef.current.click();
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);

    const newPreviews = toAdd.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: "image" as const,
    }));

    setImages((prev) => [...prev, ...newPreviews]);
    if (toAdd.length < files.length) {
      toast.error(`Máximo ${MAX_IMAGES} fotos por post!`);
    }
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
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
    if (media) {
      URL.revokeObjectURL(media.url);
      setMedia(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0 && !media) {
      toast.error("Adicione texto ou mídia para publicar!");
      return;
    }
    if (content.length > 500) {
      toast.error("O post deve ter no máximo 500 caracteres!");
      return;
    }

    // Blacklist check
    const blocked = checkContent(content);
    if (blocked) {
      toast.error(`Conteúdo bloqueado: palavra "${blocked}" não é permitida.`);
      return;
    }

    try {
      let videoUrl: string | undefined;
      let musicUrl: string | undefined;
      let imageUrl: string | undefined;

      // Upload images
      const uploadedImageUrls: string[] = [];
      for (const img of images) {
        const url = await upload(img.file, "image");
        if (url) uploadedImageUrls.push(url);
      }

      // First image goes to image_url for backwards compat
      if (uploadedImageUrls.length > 0) {
        imageUrl = uploadedImageUrls[0];
      }

      if (media) {
        const uploadedUrl = await upload(media.file, media.type);
        if (!uploadedUrl) return;
        if (media.type === "video") videoUrl = uploadedUrl;
        if (media.type === "music") musicUrl = uploadedUrl;
      }

      await createPost.mutateAsync({
        content: content.trim(),
        imageUrl,
        videoUrl,
        musicUrl,
        additionalImages: uploadedImageUrls.slice(1),
      });

      setContent("");
      images.forEach((img) => URL.revokeObjectURL(img.url));
      setImages([]);
      removeMedia();
      toast.success("Post publicado com sucesso! ✨");
    } catch (error) {
      toast.error("Erro ao publicar post");
      console.error(error);
    }
  };

  const isSubmitting = createPost.isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4">
      <input ref={imageRef} type="file" accept={ACCEPT.image} multiple className="hidden" onChange={handleImagesChange} />
      <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />

      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary font-bold text-sm">{profile?.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="O que está acontecendo? ✨"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const target = e.target as HTMLTextAreaElement;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const val = content;
                const newVal = val.substring(0, start) + '\n' + val.substring(end);
                setContent(newVal);
                requestAnimationFrame(() => {
                  target.selectionStart = target.selectionEnd = start + 1;
                });
              }
            }}
            className="min-h-[80px] bg-background border-border resize-none focus:ring-primary"
            maxLength={500}
          />

          {/* Image Previews - Vertical Scroll */}
          {images.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {images.map((img, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg border border-border bg-muted/30">
                  <img src={img.url} alt="" className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
                  <span className="text-xs text-muted-foreground flex-1 truncate">Foto {i + 1}</span>
                  <button type="button" onClick={() => removeImage(i)} className="p-1 rounded-full bg-destructive/20 hover:bg-destructive/40 transition-colors flex-shrink-0">
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Video/Music Preview */}
          {media && (
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
              <button type="button" onClick={removeMedia} className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1 hover:bg-background transition-colors">
                <X className="w-4 h-4 text-foreground" />
              </button>
              {media.type === "video" && <video src={media.url} controls className="w-full max-h-64" />}
              {media.type === "music" && (
                <div className="p-4 flex items-center gap-3">
                  <Music className="w-8 h-8 text-primary flex-shrink-0" />
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
              <button type="button" onClick={handleImageSelect} disabled={isSubmitting || images.length >= MAX_IMAGES} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40" title={`Adicionar fotos (${images.length}/${MAX_IMAGES})`}>
                <Image className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => handleFileSelect("video")} disabled={isSubmitting || !!media} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40" title="Adicionar vídeo">
                <Video className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => handleFileSelect("music")} disabled={isSubmitting || !!media} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40" title="Adicionar música">
                <Music className="w-5 h-5" />
              </button>
              <span className="text-xs text-muted-foreground ml-2">{content.length}/500</span>
              {images.length > 0 && <span className="text-xs text-primary ml-2">📷{images.length}/{MAX_IMAGES}</span>}
            </div>

            <Button type="submit" size="sm" disabled={isSubmitting || (!content.trim() && images.length === 0 && !media)} className="bg-primary hover:bg-primary/90">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" />Publicar</>}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreatePostForm;
