import AppHeader from "@/components/AppHeader";
import InviteButton from "@/components/InviteButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAssets } from "@/hooks/useAssetsMarketing";
import { Download, Music, Video, Image as ImageIcon, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const TIPO_ICONS: Record<string, typeof Music> = {
  audio: Music,
  video: Video,
  imagem: ImageIcon,
  logo: ImageIcon,
  documento: FileText,
};

const Downloads = () => {
  const { data: assets = [], isLoading } = useAssets();

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      // Ensure proper file extension
      const ext = url.split('.').pop()?.split('?')[0] || "";
      const fileName = name ? (name.includes('.') ? name : `${name}.${ext}`) : `download.${ext}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: force download via blob with no-cors
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = name || "download";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        window.open(url, "_blank");
      }
    }
  };

  const grouped = assets.reduce((acc, a) => {
    const t = a.tipo || "outro";
    if (!acc[t]) acc[t] = [];
    acc[t].push(a);
    return acc;
  }, {} as Record<string, typeof assets>);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <InviteButton />
      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        <h1 className="font-cinzel text-2xl text-primary text-center">📥 Downloads</h1>
        <p className="text-sm text-muted-foreground text-center">
          Baixe materiais de divulgação do PlayLike
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : assets.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum material disponível ainda.</p>
        ) : (
          Object.entries(grouped).map(([tipo, items]) => {
            const Icon = TIPO_ICONS[tipo] || FileText;
            return (
              <div key={tipo} className="space-y-2">
                <h3 className="font-cinzel text-sm text-primary flex items-center gap-2 capitalize">
                  <Icon className="w-4 h-4" /> {tipo}
                </h3>
                {items.map((asset) => (
                  <Card key={asset.id} className="border-border">
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{asset.titulo || asset.tipo}</p>
                        <p className="text-xs text-muted-foreground capitalize">{asset.tipo}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(asset.arquivo_url, asset.titulo || "download")}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default Downloads;
