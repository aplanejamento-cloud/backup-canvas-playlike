import { useState, useRef } from "react";
import { useAssets, useUploadAsset, useDeleteAsset } from "@/hooks/useAssetsMarketing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderDown, ChevronDown, ChevronUp, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminAssetsPanel = () => {
  const [expanded, setExpanded] = useState(false);
  const { data: assets = [] } = useAssets();
  const upload = useUploadAsset();
  const deleteAsset = useDeleteAsset();
  const [tipo, setTipo] = useState("audio");
  const [titulo, setTitulo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Selecione um arquivo"); return; }
    try {
      await upload.mutateAsync({ file, tipo, titulo: titulo || undefined });
      toast.success("Asset enviado!");
      setTitulo("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast.error("Erro ao enviar");
    }
  };

  return (
    <Card className="border-primary/50 bg-card/80">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <FolderDown className="h-5 w-5 text-accent" />
          <span className="font-cinzel text-primary font-bold">Assets Marketing</span>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex gap-2">
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="bg-input border border-border rounded-md px-2 text-sm text-foreground">
                <option value="audio">Áudio</option>
                <option value="video">Vídeo</option>
                <option value="imagem">Imagem</option>
                <option value="logo">Logo</option>
                <option value="documento">Documento</option>
              </select>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título..." className="flex-1" />
            </div>
            <div className="flex gap-2">
              <input ref={fileRef} type="file" className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" /> Arquivo
              </Button>
              <Button size="sm" onClick={handleUpload} disabled={upload.isPending}>
                {upload.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar"}
              </Button>
            </div>
          </div>

          {assets.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {a.tipo === "imagem" || a.tipo === "logo" ? (
                  <img src={a.arquivo_url} alt={a.titulo || ""} className="w-full h-full object-cover" />
                ) : a.tipo === "video" ? (
                  <video src={a.arquivo_url} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderDown className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.titulo}</p>
                <p className="text-xs text-muted-foreground capitalize">{a.tipo}</p>
              </div>
              <a href={a.arquivo_url} download target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <FolderDown className="w-4 h-4" />
                </Button>
              </a>
              <Button size="sm" variant="destructive" onClick={() => deleteAsset.mutate(a.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {assets.length === 0 && <p className="text-xs text-muted-foreground text-center">Nenhum asset cadastrado</p>}
        </div>
      )}
    </Card>
  );
};

export default AdminAssetsPanel;
