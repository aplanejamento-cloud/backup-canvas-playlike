import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SecondaryPrize {
  id: string;
  url: string;
  type: "image" | "video";
}

export interface Sponsor {
  id: string;
  url: string;
}

export interface HomeConfig {
  id: string;
  prize_value: string;
  prize_enabled: boolean;
  promo_text: string;
  promo_text_2: string;
  video_loop_url: string | null;
  video_rules_url: string | null;
  video_prize_url: string | null;
  secondary_prizes: SecondaryPrize[];
  sponsors: Sponsor[];
  updated_at: string;
}

export function useHomeConfig() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["home-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_config")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return {
        ...data,
        secondary_prizes: (data.secondary_prizes as unknown as SecondaryPrize[]) || [],
        sponsors: (data.sponsors as unknown as Sponsor[]) || [],
      } as HomeConfig;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<Omit<HomeConfig, "id" | "updated_at">>) => {
      if (!config) throw new Error("No config");
      const payload: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("home_config")
        .update(payload as any)
        .eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-config"] });
      toast.success("Configuração salva!");
    },
    onError: () => toast.error("Erro ao salvar configuração"),
  });

  const uploadHomeMedia = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("home-media")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error("Erro ao enviar arquivo");
      return null;
    }
    const { data } = supabase.storage.from("home-media").getPublicUrl(path);
    return data.publicUrl;
  };

  return { config, isLoading, updateConfig, uploadHomeMedia };
}
