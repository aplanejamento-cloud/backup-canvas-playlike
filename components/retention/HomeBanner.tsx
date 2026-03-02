import { Heart, Trophy, Target } from "lucide-react";
import { useDailyReport } from "@/hooks/useDailyReport";

const HomeBanner = () => {
  const { data: report } = useDailyReport();

  if (!report || report.rankPosition === 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border border-primary/30 rounded-xl p-3 animate-fade-in">
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">👑</span>
          <span className="text-foreground font-semibold">
            +{report.totalLikesToday} likes HOJE
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          <span>#{report.rankPosition}</span>
        </div>
      </div>
    </div>
  );
};

export default HomeBanner;
