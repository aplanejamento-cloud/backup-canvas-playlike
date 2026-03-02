import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMinhasDoacoes } from "@/hooks/usePremios";
import { useMediaUploadPremio } from "@/hooks/useMediaUploadPremio";
import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, Clock, CheckCircle2, Lock, Image as ImageIcon, MapPin, Ticket, Send, XCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Donor Ticket Verification ────────────────────────────
const TicketVerifier = ({ doacaoId }: { doacaoId: string }) => {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; usuario_nome?: string } | null>(null);

  const handleVerify = async () => {
    if (code.length !== 6) { toast.error("Digite o código de 6 dígitos"); return; }
    setVerifying(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("verify-ticket", {
        body: { codigo_ticket: code, doador_id: user?.id },
      });
      if (error) throw error;
      if (data?.success) {
        setResult({ success: true, message: data.message, usuario_nome: data.usuario_nome });
        toast.success(`✅ Entregue para ${data.usuario_nome}!`);
      } else {
        setResult({ success: false, message: data?.error || "Ticket inválido" });
        toast.error(data?.error || "Ticket inválido");
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message || "Erro ao verificar" });
      toast.error("Erro ao verificar ticket");
    }
    setVerifying(false);
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Senha 6 dígitos"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          className="font-mono text-center text-lg tracking-widest"
        />
        <Button size="sm" onClick={handleVerify} disabled={verifying || code.length !== 6}>
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
      {result && (
        <p className={cn("text-xs font-medium", result.success ? "text-green-500" : "text-destructive")}>
          {result.message}
          {!result.success && <span className="block text-destructive font-bold mt-1">⚠️ NÃO entregue o produto!</span>}
        </p>
      )}
    </div>
  );
};

// ─── Donation Form ────────────────────────────────────────
const DonationForm = () => {
  const { user } = useAuth();
  const { upload, uploading } = useMediaUploadPremio();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [likesRecebidos, setLikesRecebidos] = useState(100);
  const [quantidade, setQuantidade] = useState(1);
  const [prateleira, setPrateleira] = useState<"1" | "2">("1");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");

  const doarMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedFile) throw new Error("Arquivo obrigatório");
      const url = await upload(selectedFile);
      if (!url) throw new Error("Falha no upload");
      const { error } = await supabase.from("doacoes_premios").insert({
        usuario_id: user.id, midia_url: url, titulo: titulo || null, descricao: descricao || null,
        likes_recebidos: likesRecebidos, tipo_prateleira: Number(prateleira), aprovado: false, quantidade,
        estado: estado || null, cidade: cidade || null, bairro: bairro || null,
        endereco: endereco || null, numero: numero || null, complemento: complemento || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["minhas_doacoes", user?.id] });
      setTitulo(""); setDescricao(""); setLikesRecebidos(100); setQuantidade(1);
      setPreviewUrl(null); setSelectedFile(null);
      setEstado(""); setCidade(""); setBairro(""); setEndereco(""); setNumero(""); setComplemento("");
      toast.success("🎁 Doação enviada! Aguardando aprovação do admin.");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao enviar doação"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  return (
    <Card className="p-4 space-y-4 border-primary/20">
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden"
      >
        {previewUrl ? (
          selectedFile?.type.startsWith("video/") ? (
            <video src={previewUrl} className="w-full h-full object-cover" muted />
          ) : (
            <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
          )
        ) : (
          <>
            <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Clique para selecionar foto ou vídeo</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
      </div>

      <Input placeholder="Título do prêmio (opcional)" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <Input placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Likes que você quer receber</label>
          <Input type="number" min={1} value={likesRecebidos} onChange={(e) => setLikesRecebidos(Number(e.target.value))} />
        </div>
        <div className="w-28">
          <label className="text-xs text-muted-foreground mb-1 block">Quantidade</label>
          <Input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Prateleira</label>
        <Select value={prateleira} onValueChange={(v) => setPrateleira(v as "1" | "2")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">🏆 Prêmios Maiores</SelectItem>
            <SelectItem value="2">📍 Retirada Doador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MapPin className="w-4 h-4 text-primary" />
          Endereço para retirada
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} />
          <Input placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          <Input placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
          <Input placeholder="Endereço (Rua)" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          <Input placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} />
          <Input placeholder="Complemento" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground italic">💡 Receba likes por cada produto doado!</p>

      <Button
        className="w-full font-cinzel font-bold"
        disabled={!selectedFile || doarMutation.isPending || uploading}
        onClick={() => doarMutation.mutate()}
      >
        {doarMutation.isPending || uploading ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</>
        ) : (
          <><Upload className="w-4 h-4 mr-2" /> Enviar Doação</>
        )}
      </Button>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────
const Doacoes = () => {
  const { user } = useAuth();
  const { data: minhasDoacoes = [] } = useMinhasDoacoes(user?.id);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Lock className="w-12 h-12 text-muted-foreground" />
        <p className="font-cinzel font-bold text-xl text-foreground">Faça login para doar prêmios</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <AppHeader />
      <InviteButton />

      <div className="container mx-auto max-w-2xl px-4 pt-4 space-y-6">
        <div>
          <h1 className="font-cinzel font-bold text-2xl text-foreground">🎁 Doe um Prêmio</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Doe um prêmio e receba likes quando aprovado. Por cada produto doado!
          </p>
        </div>

        <DonationForm />

        {minhasDoacoes.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-cinzel font-bold text-lg text-foreground">Minhas Doações</h2>
            {minhasDoacoes.map((d) => {
              const isApproved = d.aprovado;
              return (
                <Card key={d.id} className={cn(
                  "p-3 space-y-2 border-border",
                  isApproved && "border-primary/30"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {d.midia_url.match(/\.(mp4|webm|mov)$/i) ? (
                        <video src={d.midia_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={d.midia_url} alt="doação" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{d.titulo || "Sem título"}</p>
                      <p className="text-xs text-muted-foreground">{d.likes_recebidos} likes · {d.quantidade} un.</p>
                    </div>
                    {isApproved ? (
                      <Badge className="flex items-center gap-1 bg-primary/20 text-primary border-primary/30">
                        <CheckCircle2 className="w-3 h-3" /> Aprovada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3 animate-pulse" /> Aguardando
                      </Badge>
                    )}
                  </div>

                  {/* Ticket verification for approved donations */}
                  {isApproved && (
                    <div className="border-t border-border pt-2">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Ticket className="w-3 h-3" /> Verificar senha do usuário para entrega:
                      </p>
                      <TicketVerifier doacaoId={d.id} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Doacoes;
