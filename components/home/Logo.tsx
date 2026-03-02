import { Crown } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Crown className="w-12 h-12 md:w-16 md:h-16 text-primary animate-float" />
        <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
      </div>
      <h1 className="font-cinzel text-4xl md:text-6xl lg:text-7xl font-bold text-primary glow-gold tracking-wider">
        PLAYLIKE
      </h1>
      <p className="font-montserrat text-sm md:text-base text-muted-foreground tracking-widest uppercase">
        Onde a fama começa
      </p>
    </div>
  );
};

export default Logo;
