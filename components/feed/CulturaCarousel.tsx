import { useTrendingCultura } from "@/hooks/useCulturaPosts";
import { Card } from "@/components/ui/card";
import { BookOpen, Heart, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CulturaCarousel = () => {
  const { data: trending = [] } = useTrendingCultura();
  const navigate = useNavigate();

  if (trending.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-cinzel text-sm text-primary">🔥 Cultura em Alta</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {trending.slice(0, 6).map((post: any) => (
          <Card
            key={post.id}
            className="min-w-[200px] max-w-[200px] border-border hover:border-primary/40 cursor-pointer transition-colors flex-shrink-0"
            onClick={() => navigate(`/profile/${post.user_id}`)}
          >
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-1">
                {post.categoria && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {post.categoria}
                  </span>
                )}
                {(post.boost_likes ?? 0) > 0 && (
                  <span className="text-xs text-primary font-bold">+{post.boost_likes}</span>
                )}
              </div>
              <p className="text-xs text-foreground line-clamp-3 whitespace-pre-line">
                {post.content?.slice(0, 80)}...
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {post.author?.name?.slice(0, 12)}
                </span>
                <span className="text-xs text-primary flex items-center gap-1">
                  <Heart className="w-3 h-3" /> {post.likes_count}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CulturaCarousel;
