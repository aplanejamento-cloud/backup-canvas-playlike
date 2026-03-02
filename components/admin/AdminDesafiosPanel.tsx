import { useDesafios, Desafio } from "@/hooks/useDesafios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, CheckCircle, XCircle, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const AdminDesafiosPanel = () => {
  const { pendentes, loadingPendentes, aprovarDesafio, rejeitarDesafio } = useDesafios();
  const [open, setOpen] = useState(false);

  return (
    <Card className="bg-card/80 border-border">
      <CardContent className="py-4 space-y-3">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
          <h3 className="font-cinzel text-sm text-primary flex items-center gap-2">
            <Gavel className="w-4 h-4" /> Desafios Pendentes
            {pendentes.length > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                {pendentes.length}
              </span>
            )}
          </h3>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {open && (
          <div className="space-y-3 pt-2">
            {loadingPendentes ? (
              [...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
            ) : pendentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum desafio pendente ✅</p>
            ) : (
              pendentes.map((d: Desafio) => (
                <div key={d.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 border border-accent">
                      <AvatarImage src={d.juiz_profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-secondary text-xs">{d.juiz_profile?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{d.juiz_profile?.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Heart className="w-3 h-3" /> Pagou {d.likes_pago} likes
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{d.texto}</p>
                  {d.video_url && (
                    <video src={d.video_url} controls className="w-full rounded-lg max-h-40 object-cover" />
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" onClick={() => aprovarDesafio(d.id)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => rejeitarDesafio(d)}>
                      <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDesafiosPanel;
