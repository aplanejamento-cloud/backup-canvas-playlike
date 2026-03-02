import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, ChevronDown, ChevronUp, AlertTriangle, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const AdminModerationPanel = () => {
  const [expanded, setExpanded] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newCat, setNewCat] = useState("sexo");
  const queryClient = useQueryClient();

  // Blacklist words
  const { data: blacklist = [] } = useQuery({
    queryKey: ["blacklist-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("blacklist_palavras").select("*").order("palavra");
      return data || [];
    },
  });

  // Reported posts (denuncias > 0)
  const { data: reportedPosts = [] } = useQuery({
    queryKey: ["reported-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, author:profiles!posts_user_id_fkey(name, avatar_url)")
        .gt("denuncias_improprio", 0)
        .eq("deletado", false)
        .order("denuncias_improprio", { ascending: false })
        .limit(50);
      return (data || []).map((p: any) => ({ ...p, author: Array.isArray(p.author) ? p.author[0] : p.author }));
    },
  });

  // Disliked posts (dislikes_tema >= 10)
  const { data: dislikedPosts = [] } = useQuery({
    queryKey: ["disliked-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, author:profiles!posts_user_id_fkey(name, avatar_url)")
        .gte("dislikes_tema", 10)
        .eq("deletado", false)
        .order("dislikes_tema", { ascending: false })
        .limit(50);
      return (data || []).map((p: any) => ({ ...p, author: Array.isArray(p.author) ? p.author[0] : p.author }));
    },
  });

  const addWord = useMutation({
    mutationFn: async () => {
      if (!newWord.trim()) return;
      const { error } = await supabase.from("blacklist_palavras").insert({ palavra: newWord.trim().toLowerCase(), categoria: newCat } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewWord("");
      queryClient.invalidateQueries({ queryKey: ["blacklist-admin"] });
      queryClient.invalidateQueries({ queryKey: ["blacklist"] });
      toast.success("Palavra adicionada!");
    },
    onError: () => toast.error("Erro (talvez duplicada)"),
  });

  const removeWord = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("blacklist_palavras").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blacklist-admin"] });
      queryClient.invalidateQueries({ queryKey: ["blacklist"] });
      toast.success("Palavra removida!");
    },
  });

  const hidePost = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from("posts").update({ deletado: true } as any).eq("id", postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reported-posts"] });
      queryClient.invalidateQueries({ queryKey: ["disliked-posts"] });
      toast.success("Post ocultado!");
    },
  });

  return (
    <Card className="border-primary/50 bg-card/80">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="font-cinzel text-primary font-bold">Moderação</span>
          {(reportedPosts.length + dislikedPosts.length) > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
              {reportedPosts.length + dislikedPosts.length}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-6">
          {/* Blacklist */}
          <section className="space-y-3">
            <h3 className="font-montserrat text-sm font-semibold text-foreground">🚫 Blacklist</h3>
            <div className="flex gap-2">
              <Input value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Palavra..." className="flex-1" />
              <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="bg-input border border-border rounded-md px-2 text-sm text-foreground">
                <option value="sexo">Sexo</option>
                <option value="drogas">Drogas</option>
                <option value="violencia">Violência</option>
                <option value="outro">Outro</option>
              </select>
              <Button size="sm" onClick={() => addWord.mutate()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {blacklist.map((w: any) => (
                <span key={w.id} className="inline-flex items-center gap-1 bg-destructive/10 text-destructive text-xs px-2 py-1 rounded-full">
                  {w.palavra}
                  <button onClick={() => removeWord.mutate(w.id)} className="hover:text-destructive/80"><Trash2 className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </section>

          {/* Reported Posts */}
          <section className="space-y-3">
            <h3 className="font-montserrat text-sm font-semibold text-foreground">🚨 Denunciados ({reportedPosts.length})</h3>
            {reportedPosts.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{p.author?.name}</p>
                  <p className="text-sm text-foreground truncate">{p.content}</p>
                  <p className="text-xs text-destructive">🚨 {p.denuncias_improprio} denúncias</p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => hidePost.mutate(p.id)}>
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {reportedPosts.length === 0 && <p className="text-xs text-muted-foreground">Nenhum post denunciado</p>}
          </section>

          {/* Disliked Posts */}
          <section className="space-y-3">
            <h3 className="font-montserrat text-sm font-semibold text-foreground">👎 10+ Dislikes ({dislikedPosts.length})</h3>
            {dislikedPosts.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{p.author?.name}</p>
                  <p className="text-sm text-foreground truncate">{p.content}</p>
                  <p className="text-xs text-yellow-500">👎 {p.dislikes_tema} dislikes</p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => hidePost.mutate(p.id)}>
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {dislikedPosts.length === 0 && <p className="text-xs text-muted-foreground">Nenhum post com 10+ dislikes</p>}
          </section>
        </div>
      )}
    </Card>
  );
};

export default AdminModerationPanel;
