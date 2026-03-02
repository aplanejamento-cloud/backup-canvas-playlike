import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Crown } from "lucide-react";

const InviteButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="sticky top-[88px] z-40 bg-background/95 backdrop-blur-sm py-2 px-4">
      <div className="container mx-auto max-w-2xl">
        <button
          onClick={() => navigate("/convites")}
          className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-cinzel text-sm font-bold shadow-gold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Crown className="w-4 h-4 flex-shrink-0" />
          Convidar amigos e ganhar likes
        </button>
      </div>
    </div>
  );
};

export default InviteButton;
