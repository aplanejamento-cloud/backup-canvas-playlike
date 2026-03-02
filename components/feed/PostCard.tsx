import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Post, InteractionType } from "@/types/feed";
import { usePostInteractions, useInteract, useRemoveInteraction } from "@/hooks/useInteractions";
import { useFollows, useToggleFollow } from "@/hooks/useFollows";
import { useAuth } from "@/contexts/AuthContext";
import { useDeletePost } from "@/hooks/usePosts";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useRemixCount } from "@/hooks/useRemix";
import { Button } from "@/components/ui/button";
import { Heart, Flame, Bomb, UserPlus, UserMinus, Trash2, Crown, User, Music, Gift, Repeat2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ImageCarousel from "./ImageCarousel";
import CommentSection from "./CommentSection";
import MimoModal from "@/components/MimoModal";
import VideoPost from "./VideoPost";
import PostModerationBar from "./PostModerationBar";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user, profile } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { userInteraction } = usePostInteractions(post.id);
  const { following } = useFollows();
  const interact = useInteract();
  const removeInteraction = useRemoveInteraction();
  const toggleFollow = useToggleFollow();
  const deletePost = useDeletePost();
  const { data: remixCount } = useRemixCount(post.id);
  const navigate = useNavigate();
  const [showMimo, setShowMimo] = useState(false);

  const isFollowing = following.includes(post.user_id);
  const isOwnPost = user?.id === post.user_id;

  const allImages: string[] = [];
  if (post.image_url) allImages.push(post.image_url);
  if (post.additional_images) allImages.push(...post.additional_images);

  const handleInteraction = async (type: InteractionType) => {
    if (!user) { toast.error("Faça login para interagir!"); return; }
    try {
      if (userInteraction?.interaction_type === type) {
        await removeInteraction.mutateAsync(userInteraction.id);
        toast.success("Interação removida!");
      } else {
        await interact.mutateAsync({ postId: post.id, interactionType: type });
        const messages: Record<string, string> = { like: "Você curtiu! 💛", love: "LACROU! 🔥", bomb: "BOMBA! 💣" };
        toast.success(messages[type] || "Interação registrada!");
      }
    } catch { toast.error("Erro ao interagir"); }
  };

  const handleToggleFollow = async () => {
    if (!user) { toast.error("Faça login para seguir!"); return; }
    try {
      await toggleFollow.mutateAsync({ targetUserId: post.user_id, isFollowing });
      toast.success(isFollowing ? "Deixou de seguir" : "Seguindo!");
    } catch { toast.error("Erro ao seguir usuário"); }
  };

  const handleDelete = async () => {
    const msg = isAdmin && !isOwnPost
      ? "Deletar post como admin? ✅ Likes PRESERVADOS"
      : "Tem certeza que deseja excluir este post?";
    if (!confirm(msg)) return;
    try {
      await deletePost.mutateAsync(post.id);
      toast.success("Post removido!");
    } catch { toast.error("Erro ao excluir post"); }
  };

  const InteractionButton = ({ type, icon: Icon, label, activeClass, value }: {
    type: InteractionType; icon: typeof Heart; label: string; activeClass: string; value: string;
  }) => {
    const isActive = userInteraction?.interaction_type === type;
    return (
      <button
        onClick={() => handleInteraction(type)}
        disabled={interact.isPending || removeInteraction.isPending}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
          isActive ? activeClass : "bg-muted/50 text-muted-foreground hover:bg-muted"
        )}
      >
        <Icon className={cn("w-4 h-4", isActive && "fill-current")} />
        <span className="hidden sm:inline">{label}</span>
        <span className="text-[10px] opacity-70">{value}</span>
      </button>
    );
  };

  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3">
        <header className="flex items-start justify-between">
          <button
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/profile/${post.user_id}`)}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {post.author?.avatar_url ? (
                <img src={post.author.avatar_url} alt={post.author.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-bold text-sm">{post.author?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{post.author?.name || "Anônimo"}</span>
                {post.author?.user_type === "jogador" ? <Crown className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-accent" />}
                {isAdmin && (post.author as any)?.is_bot && <span className="text-[9px] px-1 py-0.5 rounded bg-accent/20 text-accent">🤖</span>}
              </div>
              <time className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
              </time>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {!isOwnPost && user && (
              <Button variant="ghost" size="sm" onClick={handleToggleFollow} disabled={toggleFollow.isPending} className={cn("h-8 px-2", isFollowing ? "text-primary" : "text-muted-foreground")}>
                {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              </Button>
            )}
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deletePost.isPending} className="h-8 px-2 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </header>

        {post.content && <p className="text-foreground whitespace-pre-wrap break-words mt-2">{post.content}</p>}
      </div>

      {/* MEDIA — Facebook-style: full width, large */}
      {allImages.length > 0 && (
        <div className="w-full">
          <ImageCarousel images={allImages} />
        </div>
      )}

      {post.video_url && (
        <div className="w-full">
          <VideoPost src={post.video_url} />
        </div>
      )}

      {post.music_url && (
        <div className="flex items-center gap-3 p-3 mx-3 bg-muted/30 rounded-lg border border-border">
          <Music className="w-6 h-6 text-primary flex-shrink-0" />
          <audio src={post.music_url} controls className="w-full" preload="metadata" />
        </div>
      )}

      {/* Footer */}
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Heart className={cn("w-4 h-4", post.likes_count >= 0 ? "text-primary fill-primary" : "text-destructive")} />
          <span className={cn("font-bold", post.likes_count >= 10 ? "text-primary glow-gold" : post.likes_count < 0 ? "text-destructive" : "text-foreground")}>
            {post.likes_count.toLocaleString("pt-BR")}
          </span>
          <span className="text-muted-foreground">likes</span>
        </div>

        <footer className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <InteractionButton type="like" icon={Heart} label="Curtir" activeClass="bg-primary/20 text-primary" value="+1" />
          <InteractionButton type="love" icon={Flame} label="Lacrou" activeClass="bg-orange-500/20 text-orange-500" value="+10" />
          <InteractionButton type="bomb" icon={Bomb} label="Bomba" activeClass="bg-destructive/20 text-destructive" value="-10" />
          {user && !isOwnPost && (
            <button
              onClick={() => {
                // Open editor modal with remix context - pass image or video
                const mediaParam = post.image_url ? `&image=${encodeURIComponent(post.image_url)}` : post.video_url ? `&video=${encodeURIComponent(post.video_url)}` : "";
                navigate(`/editor?remix=${post.id}${mediaParam}`);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 transition-all"
            >
              <Repeat2 className="w-4 h-4" />
              <span className="hidden sm:inline">Remix</span>
              {(remixCount || 0) > 0 && <span className="text-[10px] opacity-70">{remixCount}</span>}
            </button>
          )}
          {profile?.user_type === "juiz" && !isOwnPost && user && post.author?.user_type === "jogador" && (
            <button
              onClick={() => setShowMimo(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/20 text-accent hover:bg-accent/30 transition-all ml-auto"
            >
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Mimo</span>
            </button>
          )}
        </footer>

        <PostModerationBar
          postId={post.id}
          dislikes={(post as any).dislikes_tema || 0}
          denuncias={(post as any).denuncias_improprio || 0}
          temaTitle={undefined}
          temaFator={undefined}
        />

        <CommentSection postId={post.id} />
      </div>

      {showMimo && post.author && (
        <MimoModal
          open={showMimo}
          onOpenChange={setShowMimo}
          targetUserId={post.user_id}
          targetName={post.author.name}
        />
      )}
    </article>
  );
};

export default PostCard;
