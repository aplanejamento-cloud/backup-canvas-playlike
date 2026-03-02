import { useState, useRef, useCallback } from "react";
import CreatePostForm from "@/components/feed/CreatePostForm";
import { useAuth } from "@/contexts/AuthContext";
import { useGameState } from "@/hooks/useGameState";
import { useUserMedia } from "@/hooks/useUserMedia";
import { useTemas, useActivateTema, useDeactivateTema } from "@/hooks/useTemas";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Heart, Users, Camera, Video, Trash2, Save, X, Eye, EyeOff,
  Image as ImageIcon, ChevronLeft, ChevronRight, MessageCircle, Loader2, Palette, UserPlus, UserMinus, Mail,
} from "lucide-react";
import { useFollows, useToggleFollow } from "@/hooks/useFollows";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";
import PostCard from "@/components/feed/PostCard";
import AvatarCropDialog from "@/components/AvatarCropDialog";
import StreakBadge from "@/components/retention/StreakBadge";

const Profile = () => {
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const { user, profile: myProfile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = !routeUserId || routeUserId === user?.id;
  const { gameState } = useGameState();
  const { temas } = useTemas();
  const activateTema = useActivateTema();
  const deactivateTema = useDeactivateTema();

  // Fetch profile for the viewed user
  const { data: viewedProfile } = useQuery({
    queryKey: ["profile", routeUserId],
    queryFn: async () => {
      if (!routeUserId) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", routeUserId).single();
      return data;
    },
    enabled: !!routeUserId && !isOwnProfile,
  });

  const profile = isOwnProfile ? myProfile : viewedProfile;
  const profileUserId = isOwnProfile ? user?.id : routeUserId;

  const { photos, videos, uploadMedia, deleteMedia, isLoading: mediaLoading, MAX_PHOTOS, MAX_VIDEOS } = useUserMedia();

  const { data: followersCount = 0 } = useQuery({
    queryKey: ["followers-count", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return 0;
      const { count } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileUserId);
      return count || 0;
    },
    enabled: !!profileUserId,
  });

  // User's own posts (for jogadores AND juízes)
  const { data: ownPosts = [] } = useQuery({
    queryKey: ["user-own-posts", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return [];
      const { data: posts } = await supabase
        .from("posts")
        .select("*, author:profiles!posts_user_id_fkey(id, name, avatar_url, user_type)")
        .eq("user_id", profileUserId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(50);
      return (posts || []).map((p: any) => ({ ...p, author: Array.isArray(p.author) ? p.author[0] : p.author }));
    },
    enabled: !!profileUserId,
  });

  // Posts the user interacted with (for ALL user types)
  const { data: interactedPosts = [] } = useQuery({
    queryKey: ["user-interacted-posts", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return [];
      const { data: interactions } = await supabase
        .from("post_interactions")
        .select("post_id")
        .eq("user_id", profileUserId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!interactions?.length) return [];
      const postIds = [...new Set(interactions.map((i) => i.post_id))];
      const { data: posts } = await supabase
        .from("posts")
        .select("*, author:profiles!posts_user_id_fkey(id, name, avatar_url, user_type)")
        .in("id", postIds)
        .gt("expires_at", new Date().toISOString());
      return (posts || []).map((p: any) => ({ ...p, author: Array.isArray(p.author) ? p.author[0] : p.author }));
    },
    enabled: !!profileUserId,
  });

  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(profile?.bio || "");
  const [uploading, setUploading] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showWhatsapp, setShowWhatsapp] = useState((profile as any)?.show_whatsapp !== false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showAvatarZoom, setShowAvatarZoom] = useState(false);
  const [showEmail, setShowEmail] = useState(true);

  const { following } = useFollows();
  const toggleFollow = useToggleFollow();
  const isFollowing = !isOwnProfile && profileUserId ? following.includes(profileUserId) : false;

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSaveBio = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ bio }).eq("user_id", user.id);
    await refreshProfile();
    setEditingBio(false);
    toast.success("Bio atualizada!");
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleCropComplete = useCallback(async (blob: Blob) => {
    if (!user) return;
    setShowCropDialog(false);
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("user-media").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (error) { toast.error("Erro ao enviar avatar"); setUploading(false); return; }
    const { data } = supabase.storage.from("user-media").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
    await refreshProfile();
    setUploading(false);
    toast.success("Avatar atualizado!");
  }, [user, refreshProfile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB!"); return; }
    setUploading(true);
    await uploadMedia(file, "photo");
    setUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { toast.error("Máximo 100MB!"); return; }
    setUploading(true);
    await uploadMedia(file, "video");
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <InviteButton />

      {/* Game OFF banner - enhanced */}
      {isOwnProfile && gameState && !gameState.game_on && (
        <div className="bg-accent px-4 py-6 text-center space-y-3">
          <p className="text-accent-foreground font-montserrat font-bold text-base md:text-lg leading-snug">
            👑 VOCÊ SE CADASTROU PARA PARTICIPAR DA REDE SOCIAL DOS FAMOSOS E JOGAR NO PLAYLIKE
          </p>
          <p className="text-accent-foreground/80 text-sm">
            📩 Aguarde nosso e-mail ou WhatsApp com a data de início do jogo!
          </p>
          <p className="text-accent-foreground/60 text-xs">
            CONVIDE AMIGOS AGORA ENQUANTO AGUARDA O INÍCIO DO JOGO
          </p>
          <button
            onClick={() => navigate("/convites")}
            className="inline-flex items-center gap-2 bg-accent-foreground hover:bg-accent-foreground/90 text-accent font-cinzel font-bold text-sm md:text-base px-6 py-3 rounded-full transition-colors shadow-lg animate-pulse"
          >
            🔥 CONVIDAR AMIGOS E GANHAR LIKE
          </button>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <button onClick={() => setShowAvatarZoom(true)} className="focus:outline-none">
              <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-primary shadow-gold cursor-pointer hover:opacity-90 transition-opacity">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-secondary text-foreground font-cinzel text-3xl">
                  {profile?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </button>
            {isOwnProfile && (
              <>
                <button onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-gold">
                  <Camera className="w-4 h-4" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
              </>
            )}
          </div>

          <div className="text-center">
            <h2 className="font-cinzel text-2xl text-foreground">{profile?.name}</h2>
            <button
              onClick={() => {
                const username = profile?.name?.toLowerCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                navigator.clipboard.writeText(`${window.location.origin}/@${username}`);
                toast.success("Link copiado!");
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              title="Clique para copiar link"
            >
              @{profile?.name?.toLowerCase().replace(/\s+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}
            </button>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{profile?.user_type}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1 text-primary">
                <Heart className="w-5 h-5 fill-primary" />
                <span className="font-bold text-lg">{profile?.total_likes?.toLocaleString("pt-BR")}</span>
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

          {/* Streak Badge */}
          <StreakBadge userId={profileUserId} />

          {/* Follow button for other profiles */}
          {!isOwnProfile && user && profileUserId && (
            <Button
              variant={isFollowing ? "outline" : "default"}
              onClick={() => toggleFollow.mutateAsync({ targetUserId: profileUserId, isFollowing })}
              disabled={toggleFollow.isPending}
              className="font-cinzel"
            >
              {isFollowing ? <><UserMinus className="w-4 h-4 mr-2" /> Seguindo</> : <><UserPlus className="w-4 h-4 mr-2" /> Seguir este perfil</>}
            </Button>
          )}
        </div>

        {/* Bio */}
        <Card className="bg-card/80 border-border">
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel text-sm text-primary">Bio</h3>
              {isOwnProfile && !editingBio && (
                <Button variant="ghost" size="sm" onClick={() => { setBio(profile?.bio || ""); setEditingBio(true); }}>Editar</Button>
              )}
              {isOwnProfile && editingBio && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleSaveBio}><Save className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingBio(false)}><X className="w-4 h-4" /></Button>
                </div>
              )}
            </div>
            {editingBio ? (
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte sobre você..." className="bg-input border-border" maxLength={300} />
            ) : (
              <p className="text-sm text-foreground/80">{profile?.bio || "Nenhuma bio ainda..."}</p>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Toggle */}
        {profile?.whatsapp && (
          <Card className="bg-card/80 border-border">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  {showWhatsapp ? (
                    <p className="text-sm text-foreground">{profile.whatsapp}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Oculto</p>
                  )}
                </div>
              </div>
              {isOwnProfile && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{showWhatsapp ? "Visível" : "Oculto"}</span>
                  <Switch
                    checked={showWhatsapp}
                    onCheckedChange={async (val) => {
                      setShowWhatsapp(val);
                      if (user) {
                        await supabase.from("profiles").update({ show_whatsapp: val } as any).eq("user_id", user.id);
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Email Toggle */}
        {isOwnProfile && user?.email && (
          <Card className="bg-card/80 border-border">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  {showEmail ? (
                    <p className="text-sm text-foreground">{user.email}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Oculto</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{showEmail ? "Visível" : "Oculto"}</span>
                <Switch
                  checked={showEmail}
                  onCheckedChange={(val) => setShowEmail(val)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Gallery - only own profile */}
        {isOwnProfile && (
          <Card className="bg-card/80 border-border">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-cinzel text-sm text-primary flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Fotos ({photos.length}/{MAX_PHOTOS})
                </h3>
                <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} disabled={uploading} className="border-primary/50 text-primary">
                  <Camera className="w-4 h-4 mr-1" />
                  {photos.length >= MAX_PHOTOS ? "Substituir" : "Adicionar"}
                </Button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              {mediaLoading ? (
                <div className="grid grid-cols-3 gap-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}</div>
              ) : photos.length > 0 ? (
                <>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={photos[galleryIndex]?.media_url} alt="" className="w-full h-full object-cover" />
                    {photos.length > 1 && (
                      <>
                        <button onClick={() => setGalleryIndex((i) => (i - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 rounded-full p-1"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
                        <button onClick={() => setGalleryIndex((i) => (i + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 rounded-full p-1"><ChevronRight className="w-5 h-5 text-foreground" /></button>
                      </>
                    )}
                    <button onClick={() => deleteMedia(photos[galleryIndex].id)} className="absolute top-2 right-2 bg-destructive/80 rounded-full p-1.5"><Trash2 className="w-4 h-4 text-destructive-foreground" /></button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/70 rounded-full px-2 py-0.5 text-xs text-foreground">{galleryIndex + 1}/{photos.length}</div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((p, i) => (
                      <button key={p.id} onClick={() => setGalleryIndex(i)} className={`w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 ${i === galleryIndex ? "border-primary" : "border-transparent"}`}>
                        <img src={p.media_url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma foto ainda. Adicione até {MAX_PHOTOS} fotos!</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Video - only own profile */}
        {isOwnProfile && (
          <Card className="bg-card/80 border-border">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-cinzel text-sm text-primary flex items-center gap-2"><Video className="w-4 h-4" /> Vídeo ({videos.length}/{MAX_VIDEOS})</h3>
                <Button variant="outline" size="sm" onClick={() => videoInputRef.current?.click()} disabled={uploading} className="border-primary/50 text-primary">
                  <Video className="w-4 h-4 mr-1" />
                  {videos.length >= MAX_VIDEOS ? "Substituir" : "Adicionar"}
                </Button>
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
              </div>
              {videos.length > 0 ? (
                <div className="relative">
                  <video src={videos[0].media_url} controls className="w-full rounded-lg max-h-80" />
                  <button onClick={() => deleteMedia(videos[0].id)} className="absolute top-2 right-2 bg-destructive/80 rounded-full p-1.5"><Trash2 className="w-4 h-4 text-destructive-foreground" /></button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">Nenhum vídeo ainda. Adicione 1 vídeo!</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Followers Button - hide when game OFF */}
        {isOwnProfile && gameState?.game_on && (
          <Button
            variant="outline"
            className="w-full border-primary/50 text-primary font-cinzel"
            onClick={() => navigate("/seguidores")}
          >
            <Users className="w-5 h-5 mr-2" /> 👥 IR PARA SEGUIDORES
          </Button>
        )}

        {/* Temas Multiplicadores Shelf */}
        {isOwnProfile && gameState?.game_on && temas.length > 0 && (
          <Card className="bg-card/80 border-border">
            <CardContent className="py-4 space-y-3">
              <h3 className="font-cinzel text-sm text-primary flex items-center gap-2">
                <Palette className="w-4 h-4" /> Temas Multiplicadores
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {temas.map((t) => {
                  const isActive = (profile as any)?.tema_id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => isActive ? deactivateTema.mutate() : activateTema.mutate(t)}
                      className={`flex-shrink-0 w-28 rounded-lg border-2 p-2 text-center transition-all ${isActive ? "border-primary bg-primary/10 shadow-gold" : "border-border hover:border-primary/50"}`}
                    >
                      {t.midia_url && <img src={t.midia_url} className="w-full h-16 object-cover rounded-md mb-1" />}
                      <p className="text-xs font-bold text-foreground truncate">{t.titulo}</p>
                      <p className="text-xs text-primary font-bold">{t.fator}x likes</p>
                      <span className={`text-[10px] mt-1 block ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                        {isActive ? "✅ ATIVO" : "ATIVAR"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {isOwnProfile && profile?.user_type === "jogador" && gameState?.game_on && (
          <div className="space-y-2">
            <h3 className="font-cinzel text-lg text-primary text-center">Publicar</h3>
            <CreatePostForm />
          </div>
        )}

        {/* Own Posts (juízes: desafios pagos + posts; jogadores: posts) */}
        {ownPosts.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-cinzel text-lg text-primary text-center">
              {isOwnProfile ? "Minhas Publicações" : `Publicações de ${profile?.name?.split(" ")[0]}`}
            </h3>
            {ownPosts.map((post: any) => <PostCard key={post.id} post={post} />)}
          </div>
        )}

        {/* Interacted Posts (ALL user types) */}
        <div className="space-y-4">
          <h3 className="font-cinzel text-lg text-primary text-center">
            Publicações que interagiu
          </h3>
          {interactedPosts.length > 0 ? (
            interactedPosts.map((post: any) => <PostCard key={`interacted-${post.id}`} post={post} />)
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma interação ainda.</p>
          )}
        </div>

        {/* Delete Account */}
        {isOwnProfile && (
          <Card className="bg-card/80 border-destructive/30">
            <CardContent className="py-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Conta e Sair do Jogo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive font-cinzel text-xl">Deletar Conta e Sair do Jogo</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Esta ação é irreversível.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="text-sm text-foreground/80 space-y-1">
                <p>✅ Seus posts serão <strong>APAGADOS</strong>.</p>
                <p>✅ Likes/bombas que você <strong>DEU</strong> a outros serão <strong>mantidos</strong>.</p>
                <p>✅ Você poderá recadastrar com o mesmo email.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Digite sua senha atual:</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha atual"
                    className="bg-input border-border pr-10"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPassword ? <X className="w-4 h-4" /> : <span className="text-xs">👁</span>}
                  </button>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                disabled={deleting || !deletePassword}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const res = await fetch(
                      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${session?.access_token}`,
                          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                        },
                        body: JSON.stringify({ password: deletePassword }),
                      }
                    );
                    const result = await res.json();
                    if (!res.ok) {
                      toast.error(result.error || "Erro ao deletar conta");
                      setDeleting(false);
                      return;
                    }
                    toast.success("Conta deletada com sucesso.");
                    await signOut();
                    navigate("/");
                  } catch {
                    toast.error("Erro ao deletar conta. Tente novamente.");
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deletando...</>
                ) : "CONFIRMAR DELEÇÃO PERMANENTE"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Avatar Crop Dialog */}
        {cropImageSrc && (
          <AvatarCropDialog
            open={showCropDialog}
            onOpenChange={setShowCropDialog}
            imageSrc={cropImageSrc}
            onCropComplete={handleCropComplete}
          />
        )}

        {/* Avatar Zoom Modal */}
        <Dialog open={showAvatarZoom} onOpenChange={setShowAvatarZoom}>
          <DialogContent className="bg-card border-border max-w-md p-2">
            <DialogHeader className="sr-only">
              <DialogTitle>Foto de perfil</DialogTitle>
            </DialogHeader>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full rounded-lg" />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-muted rounded-lg">
                <span className="font-cinzel text-6xl text-muted-foreground">{profile?.name?.charAt(0) || "?"}</span>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Profile;
