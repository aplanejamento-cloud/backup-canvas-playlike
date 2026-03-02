import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type MediaType = "image" | "video" | "music";

const MAX_SIZES: Record<MediaType, number> = {
  image: 5 * 1024 * 1024,    // 5MB
  video: 100 * 1024 * 1024,  // 100MB
  music: 100 * 1024 * 1024,  // 100MB
};

const ACCEPT: Record<MediaType, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
  music: "audio/mpeg,audio/mp3,audio/wav,audio/ogg",
};

export function useMediaUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, type: MediaType): Promise<string | null> => {
    if (!user) {
      toast.error("Faça login para enviar mídia!");
      return null;
    }

    if (file.size > MAX_SIZES[type]) {
      const maxMB = MAX_SIZES[type] / (1024 * 1024);
      toast.error(`Arquivo muito grande! Máximo: ${maxMB}MB`);
      return null;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${type}.${ext}`;

      const { error } = await supabase.storage
        .from("post-media")
        .upload(path, file, { upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("post-media")
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, ACCEPT };
}
