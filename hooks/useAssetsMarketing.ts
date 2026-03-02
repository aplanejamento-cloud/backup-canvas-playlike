import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AssetMarketing {
  id: string;
  tipo: string;
  titulo: string | null;
  arquivo_url: string;
  created_at: string;
}

export function useAssets() {
  return useQuery({
    queryKey: ["assets-marketing"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets_marketing")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as AssetMarketing[];
    },
  });
}

export function useUploadAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, tipo, titulo }: { file: File; tipo: string; titulo?: string }) => {
      const path = `${tipo}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("assets-marketing")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("assets-marketing").getPublicUrl(path);

      const { error } = await supabase
        .from("assets_marketing")
        .insert({
          tipo,
          titulo: titulo || file.name,
          arquivo_url: urlData.publicUrl,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets-marketing"] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from("assets_marketing")
        .delete()
        .eq("id", assetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets-marketing"] });
    },
  });
}
