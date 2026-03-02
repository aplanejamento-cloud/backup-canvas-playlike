import { SecondaryPrize } from "@/hooks/useHomeConfig";
import { Gift } from "lucide-react";

interface SecondaryPrizesProps {
  prizes: SecondaryPrize[];
}

const SecondaryPrizes = ({ prizes }: SecondaryPrizesProps) => {
  if (prizes.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-center">
        <Gift className="h-5 w-5 text-primary" />
        <h3 className="font-cinzel text-sm md:text-base text-primary glow-gold-subtle">
          E OS TOP 10 JOGADORES estão concorrendo a mais estes prêmios!!!
        </h3>
        <Gift className="h-5 w-5 text-primary" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
        {prizes.map((prize) => (
          <div
            key={prize.id}
            className="flex-shrink-0 w-48 h-48 md:w-56 md:h-56 rounded-xl overflow-hidden border-2 border-primary/30 shadow-gold snap-center"
          >
            {prize.type === "video" ? (
              <video
                src={prize.url}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={prize.url}
                alt="Prêmio"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecondaryPrizes;
