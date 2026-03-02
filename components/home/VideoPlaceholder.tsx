import { Play, HelpCircle, Car } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface VideoPlaceholderProps {
  type: "rules" | "prize";
  title: string;
  videoUrl?: string | null;
}

const VideoPlaceholder = ({ type, title, videoUrl }: VideoPlaceholderProps) => {
  const [playing, setPlaying] = useState(false);
  const Icon = type === "rules" ? HelpCircle : Car;

  if (videoUrl && playing) {
    return (
      <Card className="relative overflow-hidden bg-card/80 border border-border">
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full aspect-video object-cover"
        />
      </Card>
    );
  }

  return (
    <Card
      className="relative overflow-hidden bg-card/80 border border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer"
      onClick={() => videoUrl && setPlaying(true)}
    >
      <div className="aspect-video flex flex-col items-center justify-center gap-3 p-4">
        {videoUrl ? (
          <>
            <video src={videoUrl} className="absolute inset-0 w-full h-full object-cover opacity-30" muted />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/30 flex items-center justify-center group-hover:bg-primary/40 transition-colors">
                <Play className="w-8 h-8 md:w-10 md:h-10 text-primary ml-1" />
              </div>
              <span className="font-montserrat text-sm md:text-base text-foreground">{title}</span>
              <span className="text-xs text-muted-foreground">Clique para assistir</span>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <Play className="w-8 h-8 md:w-10 md:h-10 text-primary ml-1" />
              </div>
              <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 group-hover:bg-primary/30 transition-colors" />
            </div>
            <div className="flex items-center gap-2 text-center">
              <Icon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <span className="font-montserrat text-sm md:text-base text-foreground">{title}</span>
            </div>
            <span className="text-xs text-muted-foreground">Em breve</span>
          </>
        )}
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
      </div>
    </Card>
  );
};

export default VideoPlaceholder;
