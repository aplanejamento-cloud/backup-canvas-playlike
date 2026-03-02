import { useState, useRef } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useAllPremios, useDoacoesPendentes, useAprovarDoacao, useRecusarDoacao, useAdicionarPremio, useRemoverPremio, DoacaoPremioPendente } from "@/hooks/usePremios";
import { useMediaUploadPremio } from "@/hooks/useMediaUploadPremio";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Power, PowerOff, Upload, Trash2, CheckCircle2, XCircle, Image as ImageIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Game State Tab ──────────────────────────────────────
const GameStateTab = () => {
  const { gameState, isLoading, toggleGame } = useGameState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingState, setPendingState] = useState<boolean>(false);

  const handleToggle = (target: boolean) => {
    setPendingState(target);
    setConfirmOpen(true);
  };

  const confirm = () => {
    toggleGame.mutate(pendingState);
    setConfirmOpen(false);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const isOn = gameState?.game_on ?? false;

  return (
    <div className="space-y-6">
      {/* Mega Toggle */}
      <div className={cn(
        "rounded-2xl p-8 text-center transition-all border-2",
        isOn ? "bg-primary/10 border-primary" : "bg-muted/50 border-border"
      )}>
        <div className={cn("inline-flex rounded-full p-6 mb-4", isOn ? "bg-primary/20" : "bg-muted")}>
          {isOn
            ? <Power className="w-16 h-16 text-primary" />
            : <PowerOff className="w-16 h-16 text-muted-foreground" />
          }
        </div>
        <h2 className={cn("font-cinzel font-bold text-3xl mb-2", isOn ? "text-primary" : "text-muted-foreground")}>
          JOGO {isOn ? "LIGADO" : "DESLIGADO"}
        </h2>
        {gameState?.start_date && isOn && (
          <p className="text-xs text-muted-foreground mb-4">
            Iniciado em: {new Date(gameState.start_date).toLocaleString("pt-BR")}
          </p>
        )}
        <div className="flex gap-3 justify-center mt-4">
          <Button
            size="lg"
            disabled={isOn || toggleGame.isPending}
            onClick={() => handleToggle(true)}
            className="font-cinzel font-bold px-8"
          >
            {toggleGame.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Power className="w-4 h-4 mr-2" />}
            LIGAR JOGO
          </Button>
          <Button
            size="lg"
            variant="destructive"
            disabled={!isOn || toggleGame.isPending}
            onClick={() => handleToggle(false)}
            className="font-cinzel font-bold px-8"
          >
            {toggleGame.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PowerOff className="w-4 h-4 mr-2" />}
            DESLIGAR
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingState ? "🎮 Ligar o Jogo?" : "🔒 Desligar o Jogo?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingState
                ? "Isso liberará acesso a todas as rotas e notificará os usuários que o jogo começou."
                : "Isso bloqueará todas as rotas exceto Home, Cadastro e Perfil. Confirmar?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>{pendingState ? "Ligar" : "Desligar"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Prêmios Tab ─────────────────────────────────────────
const PremiosTab = () => {
  const { data: premios = [], isLoading } = useAllPremios();
  const adicionarPremio = useAdicionarPremio();
  const removerPremio = useRemoverPremio();
  const { upload, uploading } = useMediaUploadPremio();
  const fileRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [likesCusto, setLikesCusto] = useState(100);
  const [estoque, setEstoque] = useState(1);
  const [prateleira, setPrateleira] = useState<"1" | "2">("1");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleAdd = async () => {
    let midia_url: string | null = null;
    if (selectedFile) {
      midia_url = await upload(selectedFile);
    }
    await adicionarPremio.mutateAsync({
      tipo_prateleira: Number(prateleira) as 1 | 2,
      midia_url,
      titulo: titulo || null,
      descricao: descricao || null,
      likes_custo: likesCusto,
      estoque,
      quantidade: estoque,
      estado: null,
      cidade: null,
      bairro: null,
      endereco: null,
      numero: null,
      complemento: null,
    });
    setTitulo(""); setDescricao(""); setLikesCusto(100); setEstoque(1);
    setPreviewUrl(null); setSelectedFile(null);
  };

  return (
    <div className="space-y-5">
      {/* Add form */}
      <Card className="p-4 space-y-3 border-primary/20">
        <h3 className="font-montserrat font-semibold text-sm text-foreground flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Novo Prêmio</h3>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden"
        >
          {previewUrl ? (
            selectedFile?.type.startsWith("video/") ? (
              <video src={previewUrl} className="w-full h-full object-cover" muted />
            ) : (
              <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
            )
          ) : (
            <><ImageIcon className="w-8 h-8 text-muted-foreground mb-1" /><p className="text-xs text-muted-foreground">Foto / Vídeo (opcional)</p></>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="col-span-2" />
          <div>
            <label className="text-xs text-muted-foreground">Custo (likes)</label>
            <Input type="number" min={0} value={likesCusto} onChange={(e) => setLikesCusto(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Estoque</label>
            <Input type="number" min={1} value={estoque} onChange={(e) => setEstoque(Number(e.target.value))} />
          </div>
        </div>
        <Select value={prateleira} onValueChange={(v) => setPrateleira(v as "1" | "2")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">🏆 Prêmios Maiores</SelectItem>
            <SelectItem value="2">📍 Retirada Doador</SelectItem>
          </SelectContent>
        </Select>
        <Button className="w-full" disabled={adicionarPremio.isPending || uploading} onClick={handleAdd}>
          {adicionarPremio.isPending || uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          Adicionar Prêmio
        </Button>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : premios.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-4">Nenhum prêmio cadastrado</p>
      ) : (
        <div className="space-y-2">
          {premios.map((p) => (
            <Card key={p.id} className="p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {p.midia_url ? (
                  p.midia_url.match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={p.midia_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={p.midia_url} alt={p.titulo || "prêmio"} className="w-full h-full object-cover" />
                  )
                ) : <ImageIcon className="w-6 h-6 text-muted-foreground m-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.titulo || "Sem título"}</p>
                <p className="text-xs text-muted-foreground">{p.likes_custo} likes · Est: {p.estoque} · P{p.tipo_prateleira}</p>
              </div>
              <Button variant="destructive" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removerPremio.mutate(p.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Doações Tab ──────────────────────────────────────────
const DoacoesTab = () => {
  const { data: doacoes = [], isLoading } = useDoacoesPendentes();
  const aprovar = useAprovarDoacao();
  const recusar = useRecusarDoacao();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-montserrat font-semibold text-sm text-foreground">Doações Pendentes</h3>
        {doacoes.length > 0 && <Badge className="bg-destructive text-destructive-foreground">{doacoes.length}</Badge>}
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : doacoes.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-6">Nenhuma doação pendente 🎉</p>
      ) : (
        <div className="space-y-3">
          {doacoes.map((d: DoacaoPremioPendente) => (
            <Card key={d.id} className="p-3 space-y-3 border-border">
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {d.midia_url.match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={d.midia_url} className="w-full h-full object-cover" muted controls />
                  ) : (
                    <img src={d.midia_url} alt={d.titulo || "doação"} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{d.titulo || "Sem título"}</p>
                  {d.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{d.descricao}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Quer: <span className="text-primary font-bold">{d.likes_recebidos} likes</span> · P{d.tipo_prateleira}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 font-cinzel"
                  disabled={aprovar.isPending}
                  onClick={() => aprovar.mutate(d)}
                >
                  {aprovar.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                  APROVAR
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  disabled={recusar.isPending}
                  onClick={() => recusar.mutate(d.id)}
                >
                  {recusar.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  RECUSAR
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Export ─────────────────────────────────────────
const AdminGamePanel = () => {
  const { data: doacoes = [] } = useDoacoesPendentes();
  const pendingCount = doacoes.length;

  return (
    <Tabs defaultValue="gamestate" className="w-full">
      <TabsList className="w-full grid grid-cols-3 h-auto">
        <TabsTrigger value="gamestate" className="text-xs py-2 font-cinzel">🎮 Jogo</TabsTrigger>
        <TabsTrigger value="premios" className="text-xs py-2 font-cinzel">🏆 Prêmios</TabsTrigger>
        <TabsTrigger value="doacoes" className="text-xs py-2 font-cinzel relative">
          🎁 Doações
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {pendingCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="gamestate" className="mt-4"><GameStateTab /></TabsContent>
      <TabsContent value="premios" className="mt-4"><PremiosTab /></TabsContent>
      <TabsContent value="doacoes" className="mt-4"><DoacoesTab /></TabsContent>
    </Tabs>
  );
};

export default AdminGamePanel;
