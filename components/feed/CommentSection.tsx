import { useState, useRef } from "react";
import { useComments, useCreateComment, useDeleteComment, useReactToComment, Comment } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Heart, Bomb, Trash2, Image, Video, Music, X, Gavel, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface MediaPreview { file: File; url: string; type: "image" | "video" | "music"; }

// ─── Single Comment Card ───────────────────────────────────────────────────
const CommentCard = ({ comment, postId }: { comment: Comment; postId: string }) => {
  const { user, profile } = useAuth();
  const { isAdmin } = useIsAdmin();
  const deleteComment = useDeleteComment();
  const reactToComment = useReactToComment();

  const isOwn = user?.id === comment.juiz_id;
  const canDelete = isOwn || isAdmin;

  const handleReact = async (type: "like" | "bomba") => {
    if (!user) { toast.error("Faça login para reagir!"); return; }
    // All authenticated users can react to comments
    try {
      await reactToComment.mutateAsync({
        commentId: comment.id,
        reactionType: type,
        postId,
        currentReaction: comment.myReaction ?? null,
      });
    } catch { toast.error("Erro ao reagir"); }
  };

  const handleDelete = async () => {
    if (!confirm("Excluir este comentário?")) return;
    try {
      await deleteComment.mutateAsync({ commentId: comment.id, postId });
      toast.success("Comentário excluído");
    } catch { toast.error("Erro ao excluir"); }
  };

  return (
    <div className="flex gap-2.5 group">
      {/* Avatar juiz */}
      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-accent/30 mt-0.5">
        {comment.juiz?.avatar_url ? (
          <img src={comment.juiz.avatar_url} alt={comment.juiz.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-accent font-bold text-xs">{comment.juiz?.name?.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-muted/30 rounded-xl px-3 py-2.5 border border-accent/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-1 gap-2">
            <div className="flex items-center gap-1.5">
              <Gavel className="w-3 h-3 text-accent flex-shrink-0" />
              <span className="text-xs font-semibold text-accent truncate">{comment.juiz?.name || "Juiz"}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <time className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
              </time>
              {canDelete && (
                <button onClick={handleDelete} disabled={deleteComment.isPending}
                  className="p-0.5 rounded text-destructive/60 hover:text-destructive transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Texto */}
          {comment.texto && (
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">{comment.texto}</p>
          )}

          {/* Mídia */}
          {comment.midia_url && (
            <div className="mt-2 rounded-lg overflow-hidden border border-border">
              {comment.midia_type === "image" && (
                <img src={comment.midia_url} alt="Mídia do comentário" className="w-full max-h-64 object-cover" />
              )}
              {comment.midia_type === "video" && (
                <video src={comment.midia_url} controls className="w-full max-h-64" preload="metadata" />
              )}
              {comment.midia_type === "music" && (
                <div className="p-3 flex items-center gap-3 bg-muted/30">
                  <Music className="w-5 h-5 text-accent flex-shrink-0" />
                  <audio src={comment.midia_url} controls className="w-full" preload="metadata" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-3 mt-1 px-1">
          <button
            onClick={() => handleReact("like")}
            disabled={reactToComment.isPending}
          className={cn(
              "flex items-center gap-1 text-xs font-medium transition-colors rounded-full px-2 py-0.5",
              comment.myReaction === "like"
                ? "text-success bg-success/15"
                : "text-muted-foreground hover:text-success"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", comment.myReaction === "like" && "fill-current")} />
            <span className="font-bold">{comment.likes}</span>
            <span className="hidden sm:inline">LIKE</span>
          </button>

          <button
            onClick={() => handleReact("bomba")}
            disabled={reactToComment.isPending}
            className={cn(
              "flex items-center gap-1 text-xs font-medium transition-colors rounded-full px-2 py-0.5",
              comment.myReaction === "bomba"
                ? "text-destructive bg-destructive/15"
                : "text-muted-foreground hover:text-destructive"
            )}
          >
            <Bomb className={cn("w-3.5 h-3.5", comment.myReaction === "bomba" && "fill-current")} />
            <span className="font-bold">{comment.bombas}</span>
            <span className="hidden sm:inline">BOMBA</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create Comment Form (apenas juízes) ──────────────────────────────────
const CommentForm = ({ postId }: { postId: string }) => {
  const { profile } = useAuth();
  const createComment = useCreateComment();
  const { upload, uploading, ACCEPT } = useMediaUpload();

  const [texto, setTexto] = useState("");
  const [media, setMedia] = useState<MediaPreview | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [mediaTypeToSelect, setMediaTypeToSelect] = useState<"video" | "music">("video");

  if (profile?.user_type !== "juiz") return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMedia({ file, url: URL.createObjectURL(file), type: "image" });
    e.target.value = "";
  };

  const handleFileSelect = (type: "video" | "music") => {
    setMediaTypeToSelect(type);
    if (fileRef.current) { fileRef.current.accept = ACCEPT[type]; fileRef.current.click(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMedia({ file, url: URL.createObjectURL(file), type: mediaTypeToSelect });
    e.target.value = "";
  };

  const removeMedia = () => {
    if (media) { URL.revokeObjectURL(media.url); setMedia(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() && !media) { toast.error("Escreva algo ou adicione mídia!"); return; }

    try {
      let midiaUrl: string | undefined;
      let midiaType: string | undefined;

      if (media) {
        const url = await upload(media.file, media.type);
        if (!url) return;
        midiaUrl = url;
        midiaType = media.type;
      }

      await createComment.mutateAsync({ postId, texto: texto.trim(), midiaUrl, midiaType });
      setTexto("");
      removeMedia();
      toast.success("Comentário publicado!");
    } catch { toast.error("Erro ao publicar comentário"); }
  };

  const isSubmitting = createComment.isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="border-t border-border/50 pt-3 mt-3">
      <input ref={imageRef} type="file" accept={ACCEPT.image} className="hidden" onChange={handleImageChange} />
      <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />

      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-accent/30">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-accent font-bold text-[10px]">{profile?.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Comentário do juiz... ⚖️"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="min-h-[60px] text-sm bg-background border-border resize-none"
            maxLength={300}
            disabled={isSubmitting}
          />

          {media && (
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
              <button type="button" onClick={removeMedia} className="absolute top-1 right-1 z-10 bg-background/80 rounded-full p-0.5 hover:bg-background transition-colors">
                <X className="w-3 h-3 text-foreground" />
              </button>
              {media.type === "image" && <img src={media.url} alt="" className="w-full max-h-40 object-cover" />}
              {media.type === "video" && <video src={media.url} controls className="w-full max-h-40" />}
              {media.type === "music" && (
                <div className="p-2 flex items-center gap-2">
                  <Music className="w-4 h-4 text-accent flex-shrink-0" />
                  <audio src={media.url} controls className="w-full" />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <button type="button" onClick={() => imageRef.current?.click()} disabled={isSubmitting || !!media}
                className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40">
                <Image className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => handleFileSelect("video")} disabled={isSubmitting || !!media}
                className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40">
                <Video className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => handleFileSelect("music")} disabled={isSubmitting || !!media}
                className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40">
                <Music className="w-4 h-4" />
              </button>
            </div>
            <Button type="submit" size="sm" disabled={isSubmitting || (!texto.trim() && !media)}
              className="h-7 px-3 text-xs bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Comentar"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

// ─── Main CommentSection ──────────────────────────────────────────────────
interface CommentSectionProps {
  postId: string;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const { comments, isLoading } = useComments(postId);
  const { profile } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const isJuiz = profile?.user_type === "juiz";
  const hasComments = comments.length > 0;

  // Show comments to ALL users, form only for juízes
  if (!hasComments && !isJuiz) return null;

  const PREVIEW_COUNT = 2;
  const showAll = expanded || comments.length <= PREVIEW_COUNT;
  const visibleComments = showAll ? comments : comments.slice(0, PREVIEW_COUNT);
  const hiddenCount = comments.length - PREVIEW_COUNT;

  return (
    <div className="space-y-3">
      {/* Section header */}
      {hasComments && (
        <div className="flex items-center gap-2">
          <Gavel className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Veredito dos Juízes ({comments.length})
          </span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Comments list */}
      {!isLoading && (
        <div className="space-y-3">
          {visibleComments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} postId={postId} />
          ))}

          {/* Show more / less toggle */}
          {comments.length > PREVIEW_COUNT && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors ml-12"
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Ver mais {hiddenCount} {hiddenCount === 1 ? "comentário" : "comentários"}</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Form para juízes comentarem */}
      <CommentForm postId={postId} />
    </div>
  );
};

export default CommentSection;
