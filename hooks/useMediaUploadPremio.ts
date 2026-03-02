import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMediaUploadPremio() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File): Promise<string | null> => {
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Arquivo muito grande! Máximo: 100MB");
      return null;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `premios/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("home-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("home-media").getPublicUrl(path);
      return data.publicUrl;
    } catch {
      toast.error("Erro ao fazer upload");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
