import { Heart, Crown, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderHighlightProps {
  name: string;
  avatarUrl?: string;
  likes: number;
}

const LeaderHighlight = ({ name, avatarUrl, likes }: LeaderHighlightProps) => {
  const formattedLikes = likes.toLocaleString("pt-BR");

  return (
    <div className="relative flex flex-col items-center gap-4 p-6 md:p-8">
      {/* Crown on top */}
      <div className="absolute -top-2 md:-top-4">
        <Crown className="w-10 h-10 md:w-14 md:h-14 text-primary glow-gold animate-float" />
      </div>

      {/* Stars decoration */}
      <div className="absolute top-4 left-4 md:top-6 md:left-8">
        <Star className="w-4 h-4 md:w-6 md:h-6 text-primary/60 animate-shimmer" fill="currentColor" />
      </div>
      <div className="absolute top-4 right-4 md:top-6 md:right-8">
        <Star className="w-4 h-4 md:w-6 md:h-6 text-primary/60 animate-shimmer" fill="currentColor" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Avatar */}
      <div className="relative mt-8">
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl scale-110 animate-pulse" />
        <Avatar className="w-32 h-32 md:w-44 md:h-44 lg:w-52 lg:h-52 border-4 border-primary shadow-gold relative">
          <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
          <AvatarFallback className="bg-secondary text-foreground text-4xl md:text-6xl font-cinzel">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Name */}
      <h2 className="font-cinzel text-xl md:text-2xl lg:text-3xl font-bold text-foreground text-center">
        {name}
      </h2>

      {/* Likes counter */}
      <div className="flex items-center gap-2 bg-primary/20 rounded-full px-4 py-2 md:px-6 md:py-3 border border-primary/50 shadow-gold">
        <Heart className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="currentColor" />
        <span className="font-cinzel text-lg md:text-2xl font-bold text-primary">
          {formattedLikes}
        </span>
        <span className="text-sm md:text-base text-muted-foreground">
          likes
        </span>
      </div>

      {/* Label */}
      <span className="font-montserrat text-xs md:text-sm uppercase tracking-widest text-accent">
        ★ Líder Atual ★
      </span>
    </div>
  );
};

export default LeaderHighlight;
