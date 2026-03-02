import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserMedia {
  id: string;
  user_id: string;
  media_type: "photo" | "video";
  media_url: string;
  position: number;
  created_at: string;
}

const MAX_PHOTOS = 10;
const MAX_VIDEOS = 1;

export function useUserMedia(targetUserId?: string) {
  const { user } = useAuth();
  const userId = targetUserId || user?.id;
  const [media, setMedia] = useState<UserMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const photos = media.filter((m) => m.media_type === "photo");
  const videos = media.filter((m) => m.media_type === "video");

  const fetchMedia = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("user_media")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    if (!error && data) setMedia(data as UserMedia[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, [userId]);

  const uploadMedia = async (file: File, type: "photo" | "video") => {
    if (!user) return null;

    const currentCount = type === "photo" ? photos.length : videos.length;
    const max = type === "photo" ? MAX_PHOTOS : MAX_VIDEOS;

    // If at limit, delete oldest
    if (currentCount >= max) {
      const oldest = (type === "photo" ? photos : videos).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];
      if (oldest) {
        await supabase.from("user_media").delete().eq("id", oldest.id);
        // Delete from storage too
        const path = oldest.media_url.split("/user-media/")[1];
        if (path) await supabase.storage.from("user-media").remove([path]);
      }
    }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}-${type}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("user-media")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      toast.error("Erro ao enviar arquivo");
      return null;
    }

    const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);

    const { error: insertError } = await supabase.from("user_media").insert({
      user_id: user.id,
      media_type: type,
      media_url: urlData.publicUrl,
      position: currentCount >= max ? 0 : currentCount,
    });

    if (insertError) {
      toast.error("Erro ao salvar mídia");
      return null;
    }

    toast.success(type === "photo" ? "Foto adicionada!" : "Vídeo adicionado!");
    await fetchMedia();
    return urlData.publicUrl;
  };

  const deleteMedia = async (mediaId: string) => {
    const item = media.find((m) => m.id === mediaId);
    if (!item) return;

    await supabase.from("user_media").delete().eq("id", mediaId);
    const path = item.media_url.split("/user-media/")[1];
    if (path) await supabase.storage.from("user-media").remove([path]);

    toast.success("Mídia removida!");
    await fetchMedia();
  };

  return {
    media,
    photos,
    videos,
    isLoading,
    uploadMedia,
    deleteMedia,
    MAX_PHOTOS,
    MAX_VIDEOS,
    refresh: fetchMedia,
  };
}
