import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Flame } from "lucide-react";

const StreakBadge = ({ userId }: { userId?: string }) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  const { data: streak = 0 } = useQuery({
    queryKey: ["streak", targetId],
    queryFn: async () => {
      if (!targetId) return 0;
      const { data } = await supabase
        .from("daily_stats" as any)
        .select("streak_dias")
        .eq("user_id", targetId)
        .order("data", { ascending: false })
        .limit(1);
      return (data as any)?.[0]?.streak_dias || 0;
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000,
  });

  if (streak < 2) return null;

  return (
    <div className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-500 rounded-full px-2.5 py-1 text-xs font-bold animate-fade-in">
      <Flame className="w-3.5 h-3.5 fill-orange-500" />
      STREAK {streak} dias
      {streak >= 7 && " 🔥"}
      {streak >= 3 && streak < 7 && " ⚡"}
    </div>
  );
};

export default StreakBadge;
