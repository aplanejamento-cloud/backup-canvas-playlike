import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Upload, Trash2, Loader2, ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { toast } from "sonner";

interface RegrasItem {
  id: string;
  media_url: string;
  media_type: string;
  position: number;
}

const Regras = () => {
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fullscreenItem, setFullscreenItem] = useState<RegrasItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["regras-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regras_content")
        .select("*")
        .order("position");
      if (error) throw error;
      return data as RegrasItem[];
    },
  });

  const photos = items.filter((i) => i.media_type === "image");
  const videos = items.filter((i) => i.media_type === "video");

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const isVideo = file.type.startsWith("video/");
      const path = `regras/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("home-media").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("home-media").getPublicUrl(path);
      await supabase.from("regras_content").insert({
        media_url: urlData.publicUrl,
        media_type: isVideo ? "video" : "image",
        position: items.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regras-content"] });
      toast.success("Mídia adicionada!");
    },
    onError: () => toast.error("Erro ao enviar mídia"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("regras_content").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regras-content"] });
      toast.success("Removido!");
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      await uploadMutation.mutateAsync(file);
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <InviteButton />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <h1 className="font-cinzel text-2xl text-center text-foreground">
          📜 <span className="text-primary">Regras do Jogo</span>
        </h1>

        {/* Admin upload */}
        {isAdmin && (
          <div className="flex gap-2 justify-center">
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} variant="outline" className="border-primary/50 text-primary">
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Adicionar Fotos/Vídeos
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Nenhuma regra cadastrada ainda.</p>
        ) : (
          <>
            {/* Photos carousel */}
            {photos.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-cinzel text-lg text-foreground">📸 Fotos</h2>
                <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory">
                  {photos.map((item) => (
                    <div key={item.id} className="relative flex-shrink-0 w-64 h-64 rounded-xl overflow-hidden border border-border snap-center group">
                      <img
                        src={item.media_url}
                        alt="Regra"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setFullscreenItem(item)}
                      />
                      {isAdmin && (
                        <button onClick={() => deleteMutation.mutate(item.id)} className="absolute top-2 right-2 bg-destructive/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3 text-destructive-foreground" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-cinzel text-lg text-foreground">🎬 Vídeos Explicativos</h2>
                <div className="space-y-4">
                  {videos.map((item) => (
                    <div key={item.id} className="relative rounded-xl overflow-hidden border border-border group">
                      <div className="relative cursor-pointer" onClick={() => setFullscreenItem(item)}>
                        <video src={item.media_url} className="w-full rounded-xl aspect-video object-cover" preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-12 h-12 text-white fill-white/80" />
                        </div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => deleteMutation.mutate(item.id)} className="absolute top-2 right-2 bg-destructive/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3 text-destructive-foreground" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Fullscreen Modal */}
        <Dialog open={!!fullscreenItem} onOpenChange={() => setFullscreenItem(null)}>
          <DialogContent className="max-w-4xl bg-black border-none p-0">
            <button onClick={() => setFullscreenItem(null)} className="absolute top-4 right-4 z-50 bg-white/20 rounded-full p-2 hover:bg-white/40 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
            {fullscreenItem?.media_type === "video" ? (
              <video src={fullscreenItem.media_url} controls autoPlay className="w-full max-h-[90vh] object-contain" />
            ) : (
              <img src={fullscreenItem?.media_url} alt="Regra" className="w-full max-h-[90vh] object-contain" />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Regras;
