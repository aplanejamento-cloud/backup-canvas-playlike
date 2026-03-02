import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDailyReport } from "@/hooks/useDailyReport";
import { Trophy, Heart, Swords, TrendingUp, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DailyReportModal = () => {
  const { user } = useAuth();
  const { data: report } = useDailyReport();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !report || report.rankPosition === 0) return;

    // Show modal once per day after 22h
    const now = new Date();
    if (now.getHours() >= 22) {
      const key = `daily_report_shown_${now.toISOString().slice(0, 10)}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "true");
        setOpen(true);
      }
    }
  }, [user, report]);

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-primary/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-xl text-primary text-center">
            🏆 RELATÓRIO DO DIA
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <Trophy className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold text-foreground">#{report.rankPosition}</p>
              <p className="text-xs text-muted-foreground">de {report.totalPlayers}</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <Heart className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold text-foreground">+{report.totalLikesToday}</p>
              <p className="text-xs text-muted-foreground">likes hoje</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <Swords className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold text-foreground">{report.duelsWon}</p>
              <p className="text-xs text-muted-foreground">duelos ganhos</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold text-foreground">{report.postsToday}</p>
              <p className="text-xs text-muted-foreground">posts hoje</p>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Continue jogando para subir no ranking! 🚀
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyReportModal;
