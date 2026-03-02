import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Users, Loader2 } from "lucide-react";

const Seguidores = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchFollowers, setSearchFollowers] = useState("");
  const [searchFollowing, setSearchFollowing] = useState("");

  // Fetch followers (people who follow me)
  const { data: followers = [], isLoading: loadingFollowers } = useQuery({
    queryKey: ["my-followers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id);
      if (!data?.length) return [];
      const ids = data.map((f) => f.follower_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url, user_type")
        .in("user_id", ids)
        .order("name");
      return profiles || [];
    },
    enabled: !!user,
  });

  // Fetch following (people I follow)
  const { data: following = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ["my-following", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      if (!data?.length) return [];
      const ids = data.map((f) => f.following_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url, user_type")
        .in("user_id", ids)
        .order("name");
      return profiles || [];
    },
    enabled: !!user,
  });

  const filterList = (list: any[], search: string) => {
    if (!search.trim()) return list;
    return list.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));
  };

  const filteredFollowers = filterList(followers, searchFollowers);
  const filteredFollowing = filterList(following, searchFollowing);

  const UserItem = ({ profile: p }: { profile: any }) => (
    <button
      onClick={() => navigate(`/profile/${p.user_id}`)}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
    >
      <Avatar className="w-10 h-10 border-2 border-border">
        <AvatarImage src={p.avatar_url || ""} />
        <AvatarFallback className="bg-secondary text-foreground font-cinzel text-sm">
          {p.name?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{p.name}</p>
        <p className="text-xs text-muted-foreground capitalize">{p.user_type}</p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <InviteButton />
      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <h1 className="font-cinzel text-2xl text-center text-foreground">
          👥 <span className="text-primary">Seguidores</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: Followers */}
          <div className="space-y-3">
            <h2 className="font-cinzel text-lg text-accent flex items-center gap-2">
              <Users className="w-5 h-5" /> Meus Seguidores ({followers.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar seguidor..."
                value={searchFollowers}
                onChange={(e) => setSearchFollowers(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            {loadingFollowers ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredFollowers.length > 0 ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredFollowers.map((p) => <UserItem key={p.user_id} profile={p} />)}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                {searchFollowers ? "Nenhum resultado." : "Nenhum seguidor ainda."}
              </p>
            )}
          </div>

          {/* RIGHT: Following */}
          <div className="space-y-3">
            <h2 className="font-cinzel text-lg text-accent flex items-center gap-2">
              <Users className="w-5 h-5" /> Estou Seguindo ({following.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar seguindo..."
                value={searchFollowing}
                onChange={(e) => setSearchFollowing(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            {loadingFollowing ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredFollowing.length > 0 ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredFollowing.map((p) => <UserItem key={p.user_id} profile={p} />)}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                {searchFollowing ? "Nenhum resultado." : "Você não segue ninguém ainda."}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Seguidores;
