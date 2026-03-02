import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Premio {
  id: string;
  tipo_prateleira: 1 | 2;
  midia_url: string | null;
  titulo: string | null;
  descricao: string | null;
  likes_custo: number;
  estoque: number;
  aprovado: boolean;
  created_at: string;
  quantidade: number;
  estado: string | null;
  cidade: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
}

export interface DoacaoPremioPendente {
  id: string;
  usuario_id: string;
  midia_url: string;
  titulo: string | null;
  descricao: string | null;
  likes_recebidos: number;
  aprovado: boolean;
  tipo_prateleira: 1 | 2;
  created_at: string;
  quantidade: number;
  estado: string | null;
  cidade: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
}

export function usePremios(prateleira?: 1 | 2) {
  return useQuery({
    queryKey: ["premios", prateleira],
    queryFn: async () => {
      let q = supabase.from("premios").select("*").eq("aprovado", true).gt("estoque", 0).order("created_at", { ascending: false });
      if (prateleira) q = q.eq("tipo_prateleira", prateleira);
      const { data, error } = await q;
      if (error) throw error;
      return data as Premio[];
    },
  });
}

export function useAllPremios() {
  return useQuery({
    queryKey: ["premios_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("premios").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Premio[];
    },
  });
}

export function useDoacoesPendentes() {
  return useQuery({
    queryKey: ["doacoes_pendentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doacoes_premios")
        .select("*")
        .eq("aprovado", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DoacaoPremioPendente[];
    },
  });
}

export function useMinhasDoacoes(userId?: string) {
  return useQuery({
    queryKey: ["minhas_doacoes", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doacoes_premios")
        .select("*")
        .eq("usuario_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DoacaoPremioPendente[];
    },
  });
}

export function useResgatarPremio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ premioId, userId, likesCusto, codigoTicket, enderecoCompleto }: {
      premioId: string; userId: string; likesCusto: number; codigoTicket: string; enderecoCompleto: string | null;
    }) => {
      const { data: profile } = await supabase.from("profiles").select("total_likes").eq("user_id", userId).single();
      if (!profile || profile.total_likes < likesCusto) throw new Error("Saldo insuficiente");

      const { data: premio } = await supabase.from("premios").select("estoque").eq("id", premioId).single();
      if (!premio || premio.estoque < 1) throw new Error("Sem estoque");

      const { error: rErr } = await supabase.from("resgates").insert({
        usuario_id: userId,
        premio_id: premioId,
        likes_gastos: likesCusto,
        codigo_ticket: codigoTicket,
        endereco_completo: enderecoCompleto,
      });
      if (rErr) throw rErr;

      await Promise.all([
        supabase.from("profiles").update({ total_likes: profile.total_likes - likesCusto }).eq("user_id", userId),
        supabase.from("premios").update({ estoque: premio.estoque - 1 }).eq("id", premioId),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["premios"] });
      qc.invalidateQueries({ queryKey: ["meus_resgates"] });
      qc.invalidateQueries({ queryKey: ["profile_likes"] });
      toast.success("🎁 Resgate solicitado! Verifique seu ticket abaixo.");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao resgatar prêmio"),
  });
}

export function useAprovarDoacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doacao: DoacaoPremioPendente) => {
      const { error: pErr } = await supabase.from("premios").insert({
        tipo_prateleira: doacao.tipo_prateleira,
        midia_url: doacao.midia_url,
        titulo: doacao.titulo,
        descricao: doacao.descricao,
        likes_custo: doacao.likes_recebidos,
        estoque: doacao.quantidade || 1,
        aprovado: true,
        quantidade: doacao.quantidade || 1,
        estado: doacao.estado,
        cidade: doacao.cidade,
        bairro: doacao.bairro,
        endereco: doacao.endereco,
        numero: doacao.numero,
        complemento: doacao.complemento,
      });
      if (pErr) throw pErr;
      const { data: profile } = await supabase.from("profiles").select("total_likes").eq("user_id", doacao.usuario_id).single();
      if (profile) {
        await supabase.from("profiles").update({ total_likes: profile.total_likes + doacao.likes_recebidos }).eq("user_id", doacao.usuario_id);
      }
      await supabase.from("doacoes_premios").update({ aprovado: true }).eq("id", doacao.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doacoes_pendentes"] });
      qc.invalidateQueries({ queryKey: ["premios"] });
      toast.success("✅ Doação aprovada e prêmio publicado!");
    },
    onError: () => toast.error("Erro ao aprovar doação"),
  });
}

export function useRecusarDoacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doacaoId: string) => {
      await supabase.from("doacoes_premios").delete().eq("id", doacaoId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doacoes_pendentes"] });
      toast.success("❌ Doação recusada.");
    },
    onError: () => toast.error("Erro ao recusar doação"),
  });
}

export function useAdicionarPremio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<Premio, "id" | "created_at" | "aprovado">) => {
      const { error } = await supabase.from("premios").insert({ ...p, aprovado: true });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["premios"] });
      qc.invalidateQueries({ queryKey: ["premios_all"] });
      toast.success("🏆 Prêmio adicionado!");
    },
    onError: () => toast.error("Erro ao adicionar prêmio"),
  });
}

export function useRemoverPremio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("premios").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["premios"] });
      qc.invalidateQueries({ queryKey: ["premios_all"] });
      toast.success("Prêmio removido.");
    },
    onError: () => toast.error("Erro ao remover prêmio"),
  });
}
