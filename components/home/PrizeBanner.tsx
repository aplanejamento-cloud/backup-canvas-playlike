import { Trophy, Sparkles } from "lucide-react";

interface PrizeBannerProps {
  value?: number;
  displayValue?: string;
}

const PrizeBanner = ({ value, displayValue }: PrizeBannerProps) => {
  const formatted = displayValue || (value
    ? value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    : "R$50.000");

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-gradient-to-r from-secondary/30 via-card to-secondary/30 p-4 md:p-6 shadow-gold animate-pulse-gold">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
      <div className="relative flex items-center justify-center gap-3 md:gap-4">
        <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary animate-shimmer" />
        <div className="text-center">
          <p className="font-montserrat text-xs md:text-sm text-muted-foreground uppercase tracking-wider mb-1">
            O Prêmio está em
          </p>
          <p className="font-cinzel text-2xl md:text-4xl lg:text-5xl font-bold text-primary glow-gold">
            {formatted}
          </p>
        </div>
        <Trophy className="w-6 h-6 md:w-8 md:h-8 text-primary animate-shimmer" />
      </div>
    </div>
  );
};

export default PrizeBanner;
