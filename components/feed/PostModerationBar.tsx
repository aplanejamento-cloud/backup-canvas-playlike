import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ThumbsDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PostModerationBarProps {
  postId: string;
  dislikes: number;
  denuncias: number;
  temaTitle?: string;
  temaFator?: number;
}

const PostModerationBar = ({ postId, dislikes, denuncias, temaTitle, temaFator }: PostModerationBarProps) => {
  const { user } = useAuth();
  const [localDislikes, setLocalDislikes] = useState(dislikes);
  const [localDenuncias, setLocalDenuncias] = useState(denuncias);
  const [voted, setVoted] = useState<"dislike" | "report" | null>(null);

  const handleDislike = async () => {
    if (!user || voted === "dislike") return;
    const { error } = await supabase
      .from("posts")
      .update({ dislikes_tema: localDislikes + 1 } as any)
      .eq("id", postId);
    if (!error) {
      setLocalDislikes((d) => d + 1);
      setVoted("dislike");
      toast.success("👎 Dislike registrado");
    }
  };

  const handleReport = async () => {
    if (!user || voted === "report") return;
    const { error } = await supabase
      .from("posts")
      .update({ denuncias_improprio: localDenuncias + 1 } as any)
      .eq("id", postId);
    if (!error) {
      setLocalDenuncias((d) => d + 1);
      setVoted("report");
      toast.success("🚨 Denúncia registrada");
    }
  };

  return (
    <div className="flex items-center gap-3 text-xs">
      {temaTitle && (
        <span className="bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
          🎯 {temaTitle} {temaFator}x
        </span>
      )}
      <button
        onClick={handleDislike}
        disabled={voted === "dislike"}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full transition-colors",
          voted === "dislike" ? "bg-yellow-500/20 text-yellow-500" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
        <span>👎 {localDislikes}/10</span>
      </button>
      <button
        onClick={handleReport}
        disabled={voted === "report"}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full transition-colors",
          voted === "report" ? "bg-destructive/20 text-destructive" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>🚨 {localDenuncias}/10</span>
      </button>
    </div>
  );
};

export default PostModerationBar;
