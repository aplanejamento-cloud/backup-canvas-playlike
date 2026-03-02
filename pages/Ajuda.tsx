import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Send, Loader2, CheckCircle, Clock, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Ajuda = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [resposta, setResposta] = useState("");

  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["ajuda-tickets", isAdmin],
    queryFn: async () => {
      let query = supabase.from("ajuda_tickets").select("*").order("created_at", { ascending: false });
      if (!isAdmin) {
        query = query.eq("user_id", user!.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const pendingCount = tickets.filter((t) => t.status === "pendente").length;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user || !texto.trim()) return;
    setSending(true);
    let fotoUrl: string | null = null;

    if (foto) {
      const path = `ajuda/${user.id}/${Date.now()}-${foto.name}`;
      const { error } = await supabase.storage.from("user-media").upload(path, foto);
      if (!error) {
        const { data } = supabase.storage.from("user-media").getPublicUrl(path);
        fotoUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("ajuda_tickets").insert({
      user_id: user.id,
      texto: texto.trim(),
      foto_url: fotoUrl,
    });

    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
    } else {
      toast.success("Ajuda enviada! Responderemos em breve.");
      setTexto("");
      setFoto(null);
      setFotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ["ajuda-tickets"] });
    }
    setSending(false);
  };

  const handleRespond = async (ticketId: string) => {
    if (!resposta.trim()) return;
    await supabase.from("ajuda_tickets").update({
      resposta: resposta.trim(),
      status: "respondido",
    }).eq("id", ticketId);
    toast.success("Resposta enviada!");
    setRespondingId(null);
    setResposta("");
    queryClient.invalidateQueries({ queryKey: ["ajuda-tickets"] });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("ajuda_tickets").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["ajuda-tickets"] });
    toast.success("Ticket removido!");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <InviteButton />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <h1 className="font-cinzel text-2xl text-center text-foreground">
          🆘 <span className="text-primary">Ajuda</span>
          {isAdmin && pendingCount > 0 && (
            <Badge className="ml-2 bg-destructive text-destructive-foreground">{pendingCount} pendentes</Badge>
          )}
        </h1>

        {/* Submit form (non-admin users) */}
        {!isAdmin && (
          <Card className="bg-card/80 border-border">
            <CardContent className="py-4 space-y-3">
              <h3 className="font-cinzel text-sm text-primary">Precisa de ajuda?</h3>
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Descreva seu problema ou dúvida..."
                className="bg-input border-border"
                maxLength={1000}
              />
              {fotoPreview && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => { setFoto(null); setFotoPreview(null); }} className="absolute top-1 right-1 bg-destructive/80 rounded-full p-1">
                    <Trash2 className="w-3 h-3 text-destructive-foreground" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="border-border">
                  <Camera className="w-4 h-4 mr-1" /> Foto
                </Button>
                <Button onClick={handleSubmit} disabled={sending || !texto.trim()} className="ml-auto">
                  {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets list */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : tickets.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {isAdmin ? "Nenhum ticket de ajuda." : "Você ainda não enviou nenhuma solicitação."}
          </p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket: any) => (
              <Card key={ticket.id} className="bg-card/80 border-border">
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {ticket.status === "pendente" ? (
                        <Clock className="w-4 h-4 text-accent" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                      <Badge variant={ticket.status === "pendente" ? "secondary" : "default"} className="text-[10px]">
                        {ticket.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    {isAdmin && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(ticket.id)} className="h-6 w-6 p-0 text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{ticket.texto}</p>
                  {ticket.foto_url && (
                    <img src={ticket.foto_url} alt="Anexo" className="w-full max-h-48 object-cover rounded-lg" />
                  )}
                  {ticket.resposta && (
                    <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                      <p className="text-xs font-semibold text-primary mb-1">💬 Resposta:</p>
                      <p className="text-sm text-foreground">{ticket.resposta}</p>
                    </div>
                  )}
                  {/* Admin respond */}
                  {isAdmin && ticket.status === "pendente" && (
                    respondingId === ticket.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={resposta}
                          onChange={(e) => setResposta(e.target.value)}
                          placeholder="Sua resposta..."
                          className="bg-input border-border text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleRespond(ticket.id)} disabled={!resposta.trim()}>
                            <Send className="w-3 h-3 mr-1" /> Enviar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRespondingId(null)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setRespondingId(ticket.id)} className="border-primary/50 text-primary">
                        <MessageSquare className="w-3 h-3 mr-1" /> Responder
                      </Button>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Ajuda;
