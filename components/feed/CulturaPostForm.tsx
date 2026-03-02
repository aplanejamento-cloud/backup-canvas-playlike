import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateCulturaPost } from "@/hooks/useCulturaPosts";
import { CULTURA_CATEGORIAS, CULTURA_TEMPLATES } from "@/data/culturaTemplates";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CulturaPostForm = () => {
  const [selectedCat, setSelectedCat] = useState<string>("jogos");
  const [expanded, setExpanded] = useState(false);
  const createCultura = useCreateCulturaPost();

  const templates = CULTURA_TEMPLATES.filter((t) => t.categoria === selectedCat);

  const handlePost = async (templateId: string) => {
    const template = CULTURA_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    try {
      await createCultura.mutateAsync({
        content: template.texto,
        categoria: template.categoria,
        boost: template.boost,
      });
      toast.success(`📚 Post cultura publicado! +${template.boost} boost likes! ✨`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao publicar");
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full bg-card border border-primary/30 rounded-xl p-3 flex items-center gap-3 hover:border-primary/60 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-semibold text-foreground">📚 Postar Cultura</p>
          <p className="text-xs text-muted-foreground">Templates prontos +20-35 boost likes!</p>
        </div>
        <Sparkles className="w-5 h-5 text-primary" />
      </button>
    );
  }

  return (
    <Card className="border-primary/30 bg-card/80">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-cinzel text-sm text-primary flex items-center gap-1">
            <BookOpen className="w-4 h-4" /> Postar Cultura
          </h3>
          <button onClick={() => setExpanded(false)} className="text-xs text-muted-foreground hover:text-foreground">
            Fechar
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {CULTURA_CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                selectedCat === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {templates.map((t) => (
            <div
              key={t.id}
              className="p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {t.emoji} {t.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">
                    {t.texto.split("\n").slice(0, 2).join(" ")}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-primary font-bold">+{t.boost} likes</span>
                    <span className="text-xs text-muted-foreground">{t.tags.join(" ")}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handlePost(t.id)}
                  disabled={createCultura.isPending}
                  className="flex-shrink-0"
                >
                  {createCultura.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Postar"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CulturaPostForm;
