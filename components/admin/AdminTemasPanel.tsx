import { useState, useRef } from "react";
import { useAllTemas } from "@/hooks/useTemas";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Palette, ChevronDown, ChevronUp, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const AdminTemasPanel = () => {
  const [expanded, setExpanded] = useState(false);
  const { temas } = useAllTemas();
  const [titulo, setTitulo] = useState("");
  const [fator, setFator] = useState("2.0");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const createTema = useMutation({
    mutationFn: async (midiaUrl?: string) => {
      if (!titulo.trim()) throw new Error("Título obrigatório");
      const { error } = await supabase.from("temas").insert({
        titulo: titulo.trim(),
        fator: parseFloat(fator) || 2.0,
        midia_url: midiaUrl || null,
        ativo: true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setTitulo("");
      setFator("2.0");
      queryClient.invalidateQueries({ queryKey: ["temas"] });
      queryClient.invalidateQueries({ queryKey: ["temas-all"] });
      toast.success("Tema criado!");
    },
    onError: () => toast.error("Erro ao criar tema"),
  });

  const deleteTema = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await supabase.from("temas").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temas"] });
      queryClient.invalidateQueries({ queryKey: ["temas-all"] });
      toast.success("Tema removido!");
    },
  });

  const toggleTema = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await supabase.from("temas").update({ ativo } as any).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["temas"] });
      queryClient.invalidateQueries({ queryKey: ["temas-all"] });
    },
  });

  const handleCreate = async () => {
    const file = fileRef.current?.files?.[0];
    if (file) {
      setUploading(true);
      const path = `temas/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("home-media").upload(path, file);
      if (error) { toast.error("Erro upload"); setUploading(false); return; }
      const { data } = supabase.storage.from("home-media").getPublicUrl(path);
      await createTema.mutateAsync(data.publicUrl);
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    } else {
      await createTema.mutateAsync(undefined);
    }
  };

  return (
    <Card className="border-primary/50 bg-card/80">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-accent" />
          <span className="font-cinzel text-primary font-bold">Temas 2x</span>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Create */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex gap-2">
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: FUNK GOSPEL" className="flex-1" />
              <Input value={fator} onChange={(e) => setFator(e.target.value)} placeholder="2.0" className="w-16" type="number" step="0.5" min="1" max="5" />
            </div>
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" /> Foto
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={uploading || !titulo.trim()}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Criar
              </Button>
            </div>
          </div>

          {/* List */}
          {temas.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              {t.midia_url && <img src={t.midia_url} className="w-12 h-12 rounded-md object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{t.titulo}</p>
                <p className="text-xs text-primary">{t.fator}x likes</p>
              </div>
              <Button
                size="sm"
                variant={t.ativo ? "outline" : "default"}
                onClick={() => toggleTema.mutate({ id: t.id, ativo: !t.ativo })}
              >
                {t.ativo ? "Ativo" : "Off"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteTema.mutate({ id: t.id })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {temas.length === 0 && <p className="text-xs text-muted-foreground text-center">Nenhum tema cadastrado</p>}
        </div>
      )}
    </Card>
  );
};

export default AdminTemasPanel;
