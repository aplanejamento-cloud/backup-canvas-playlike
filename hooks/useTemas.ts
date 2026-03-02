import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Tema {
  id: string;
  midia_url: string | null;
  titulo: string;
  fator: number;
  ativo: boolean;
  created_at: string;
}

export function useTemas() {
  const { data: temas = [], isLoading } = useQuery({
    queryKey: ["temas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("temas")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false });
      return (data || []) as Tema[];
    },
  });

  return { temas, isLoading };
}

export function useAllTemas() {
  const { data: temas = [], isLoading } = useQuery({
    queryKey: ["temas-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("temas")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as Tema[];
    },
  });

  return { temas, isLoading };
}

export function useActivateTema() {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tema: Tema) => {
      if (!user) throw new Error("Não autenticado");
      await supabase
        .from("profiles")
        .update({ tema_id: tema.id, multiplicador_ativo: tema.fator } as any)
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useDeactivateTema() {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      await supabase
        .from("profiles")
        .update({ tema_id: null, multiplicador_ativo: 1.0 } as any)
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
