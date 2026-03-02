import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Heart, Users, Copy, UserPlus, UserMinus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import PostCard from "@/components/feed/PostCard";
import { useFollows, useToggleFollow } from "@/hooks/useFollows";

const normalizeUsername = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const ProfileByName = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { following } = useFollows();
  const toggleFollow = useToggleFollow();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile-by-name", username],
    queryFn: async () => {
      if (!username) return null;
      const target = normalizeUsername(username);
      // Busca eficiente: filtra com ilike no banco usando o username normalizado
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .ilike("name", username.replace(/-/g, " ") + "%");
      if (!data) return null;
      // Fallback de normalização local para garantir match exato
      return data.find((p) => normalizeUsername(p.name) === target) || null;
    },
    enabled: !!username,
  });

  const { data: followersCount = 0 } = useQuery({
    queryKey: ["followers-count-public", profileData?.user_id],
    queryFn: async () => {
      if (!profileData?.user_id) return 0;
      const { count } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileData.user_id);
      return count || 0;
    },
    enabled: !!profileData?.user_id,
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ["user-posts-public", profileData?.user_id],
    queryFn: async () => {
      if (!profileData?.user_id) return [];
      const { data: posts } = await supabase
        .from("posts")
        .select("*, author:profiles!posts_user_id_fkey(id, name, avatar_url, user_type)")
        .eq("user_id", profileData.user_id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(20);
      return (posts || []).map((p: any) => ({ ...p, author: Array.isArray(p.author) ? p.author[0] : p.author }));
    },
    enabled: !!profileData?.user_id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        {user ? <AppHeader /> : (
          <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <button onClick={() => navigate("/")} className="font-cinzel text-xl text-primary glow-gold-subtle">PLAYLIKE</button>
              <Button onClick={() => navigate("/")} variant="outline" size="sm">Entrar</Button>
            </div>
          </header>
        )}
        <main className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-cinzel text-4xl text-primary mb-4">404</h1>
          <p className="text-muted-foreground text-lg">Perfil @{username} não encontrado.</p>
          <Button onClick={() => navigate("/")} className="mt-6 bg-primary text-primary-foreground">Ir para Home</Button>
        </main>
      </div>
    );
  }

  // If user is logged in and viewing own profile, redirect to /profile
  if (user && user.id === profileData.user_id) {
    return <Navigate to="/profile" replace />;
  }

  const usernameNormalized = normalizeUsername(profileData.name);
  const profileUrl = `${window.location.origin}/@${usernameNormalized}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Link copiado!");
  };

  const handleAction = () => {
    if (!user) {
      navigate("/");
      return;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {user ? <AppHeader /> : (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="font-cinzel text-xl text-primary glow-gold-subtle">PLAYLIKE</button>
            <Button onClick={() => navigate("/")} variant="outline" size="sm">Entrar</Button>
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-4">
          <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-primary shadow-gold">
            <AvatarImage src={profileData.avatar_url || ""} />
            <AvatarFallback className="bg-secondary text-foreground font-cinzel text-3xl">
              {profileData.name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <h2 className="font-cinzel text-2xl text-foreground">{profileData.name}</h2>
            <button
              onClick={handleCopyLink}
              className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1 mx-auto"
              title="Clique para copiar link"
            >
              @{usernameNormalized}
              <Copy className="w-3 h-3" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1 text-primary">
                <Heart className="w-5 h-5 fill-primary" />
                <span className="font-bold text-lg">{profileData.total_likes?.toLocaleString("pt-BR")}</span>
              </div>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="flex items-center gap-1 text-accent">
                <Users className="w-5 h-5" />
                <span className="font-bold text-lg">{followersCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Seguidores</p>
            </div>
          </div>

          {/* Follow button */}
          {user && profileData?.user_id && (
            <Button
              variant={following.includes(profileData.user_id) ? "outline" : "default"}
              onClick={() => toggleFollow.mutateAsync({ targetUserId: profileData.user_id, isFollowing: following.includes(profileData.user_id) })}
              disabled={toggleFollow.isPending}
              className="font-cinzel"
            >
              {following.includes(profileData.user_id) ? <><UserMinus className="w-4 h-4 mr-2" /> Seguindo</> : <><UserPlus className="w-4 h-4 mr-2" /> Seguir este perfil</>}
            </Button>
          )}

          {/* Bio */}
          {profileData.bio && (
            <p className="text-sm text-foreground/80 text-center max-w-md">{profileData.bio}</p>
          )}
        </div>

        {/* Action buttons for non-logged users */}
        {!user && (
          <div className="text-center">
            <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground font-cinzel">
              Cadastre-se para interagir
            </Button>
          </div>
        )}

        {/* User Posts */}
        <div className="space-y-4">
          <h3 className="font-cinzel text-lg text-primary text-center">Publicações</h3>
          {userPosts.length > 0 ? (
            userPosts.map((post: any) => <PostCard key={post.id} post={post} />)
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma publicação ainda.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfileByName;
