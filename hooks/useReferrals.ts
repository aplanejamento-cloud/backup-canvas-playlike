import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Referral {
  id: string;
  user_id: string;
  network: string;
  used_first_time: boolean;
  friends_invited: number;
  likes_earned: number;
  created_at: string;
}

export function useReferrals() {
  const { user, refreshProfile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferrals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_referrals")
      .select("*")
      .eq("user_id", user.id);
    setReferrals((data as Referral[]) || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReferrals();
  }, [user]);

  const claimNetwork = async (network: string) => {
    if (!user) return { success: false, likes: 0 };

    const existing = referrals.find((r) => r.network === network);
    if (existing) {
      // Already claimed — give 10 likes
      const { error } = await supabase
        .from("user_referrals")
        .update({
          friends_invited: existing.friends_invited + 1,
          likes_earned: existing.likes_earned + 10,
          used_first_time: false,
        })
        .eq("id", existing.id);

      if (!error) {
        // Update profile total_likes
        await supabase.rpc("has_role", { _user_id: user.id, _role: "user" }); // dummy to keep connection
        await supabase
          .from("profiles")
          .update({ total_likes: (await getCurrentLikes()) + 10 })
          .eq("user_id", user.id);
        await refreshProfile();
        await fetchReferrals();
        return { success: true, likes: 10 };
      }
      return { success: false, likes: 0 };
    }

    // First time — give 1000 likes
    const { error } = await supabase.from("user_referrals").insert({
      user_id: user.id,
      network,
      used_first_time: true,
      friends_invited: 1,
      likes_earned: 1000,
    });

    if (!error) {
      await supabase
        .from("profiles")
        .update({ total_likes: (await getCurrentLikes()) + 1000 })
        .eq("user_id", user.id);
      await refreshProfile();
      await fetchReferrals();
      return { success: true, likes: 1000 };
    }
    return { success: false, likes: 0 };
  };

  const getCurrentLikes = async (): Promise<number> => {
    if (!user) return 0;
    const { data } = await supabase
      .from("profiles")
      .select("total_likes")
      .eq("user_id", user.id)
      .single();
    return data?.total_likes || 0;
  };

  const totalLikesEarned = referrals.reduce((sum, r) => sum + r.likes_earned, 0);
  const networksUsed = referrals.length;

  return { referrals, isLoading, claimNetwork, totalLikesEarned, networksUsed, fetchReferrals };
}
