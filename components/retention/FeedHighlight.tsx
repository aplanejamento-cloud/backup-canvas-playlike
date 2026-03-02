import { useDailyReport } from "@/hooks/useDailyReport";
import { TrendingUp, Heart, MessageSquare } from "lucide-react";

const FeedHighlight = () => {
  const { data: report } = useDailyReport();

  if (!report || report.totalLikesToday === 0) return null;

  const messages = [
    report.totalLikesToday >= 100 && `🔥 Seu conteúdo EXPLODIU! ${report.totalLikesToday} likes hoje!`,
    report.totalLikesToday >= 20 && `⚡ Você está em alta! +${report.totalLikesToday} likes hoje`,
    report.totalLikesToday >= 5 && `💛 +${report.totalLikesToday} likes hoje! Continue assim!`,
    `✨ +${report.totalLikesToday} likes hoje`,
  ].filter(Boolean);

  const message = messages[0];

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 flex items-center gap-2 text-sm animate-fade-in">
      <TrendingUp className="w-4 h-4 text-accent flex-shrink-0" />
      <span className="text-foreground font-medium">{message}</span>
    </div>
  );
};

export default FeedHighlight;
