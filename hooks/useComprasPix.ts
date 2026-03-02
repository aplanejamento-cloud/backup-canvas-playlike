import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CompraPix {
  id: string;
  usuario_id: string;
  valor: number;
  likes_adquiridos: number;
  pix_copia: string | null;
  comprovante_url: string | null;
  status: string;
  tipo: string;
  created_at: string;
}

export function useMinhasCompras() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["compras-pix", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("compras_pix")
        .select("*")
        .eq("usuario_id", user!.id)
        .order("created_at", { ascending: false });
      return (data || []) as CompraPix[];
    },
    enabled: !!user,
  });
}

export function useAllCompras() {
  return useQuery({
    queryKey: ["compras-pix-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("compras_pix")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as CompraPix[];
    },
  });
}

export function useCreateCompra() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ valor, likes, pixCopia, tipo }: { valor: number; likes: number; pixCopia: string; tipo: string }) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("compras_pix")
        .insert({
          usuario_id: user.id,
          valor,
          likes_adquiridos: likes,
          pix_copia: pixCopia,
          status: "pendente",
          tipo,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras-pix"] });
    },
  });
}

export function useApproveCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ compraId, usuarioId, likes, tipo }: { compraId: string; usuarioId: string; likes: number; tipo?: string }) => {
      // Approve compra
      const { error } = await supabase
        .from("compras_pix")
        .update({ status: "aprovado" } as any)
        .eq("id", compraId);
      if (error) throw error;

      const purchaseType = tipo || "likes";

      if (purchaseType === "likes") {
        // Add likes to user
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_likes")
          .eq("user_id", usuarioId)
          .single();
        if (profile) {
          await supabase
            .from("profiles")
            .update({ total_likes: (profile.total_likes || 0) + likes } as any)
            .eq("user_id", usuarioId);
        }
      } else if (purchaseType === "turbo" || purchaseType === "turbo_bomba") {
        // Activate turbo: multiplicador_ativo=10, 7 days
        const end = new Date();
        end.setDate(end.getDate() + 7);
        await supabase
          .from("profiles")
          .update({
            multiplicador_ativo: 10,
            multiplicador_end: end.toISOString(),
          } as any)
          .eq("user_id", usuarioId);
      } else if (purchaseType === "premium") {
        // Activate premium: 30 days
        const end = new Date();
        end.setDate(end.getDate() + 30);
        await supabase
          .from("profiles")
          .update({
            premium_active: true,
            premium_end: end.toISOString(),
          } as any)
          .eq("user_id", usuarioId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras-pix"] });
    },
  });
}

export function useRejectCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (compraId: string) => {
      const { error } = await supabase
        .from("compras_pix")
        .update({ status: "rejeitado" } as any)
        .eq("id", compraId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras-pix"] });
    },
  });
}
