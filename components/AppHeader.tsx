import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Heart, Crown, User } from "lucide-react";
import GlobalNav from "./GlobalNav";
import NotificationsDropdown from "./NotificationsDropdown";

const AppHeader = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-2">
        <button onClick={() => navigate("/")} className="font-cinzel text-lg text-primary glow-gold-subtle shrink-0">
          PLAYLIKE
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs">
            <Heart className="w-3.5 h-3.5 fill-primary text-primary" />
            <span className="font-bold text-primary">{profile?.total_likes?.toLocaleString("pt-BR")}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {profile?.user_type === "jogador" ? (
              <Crown className="w-3.5 h-3.5 text-primary" />
            ) : (
              <User className="w-3.5 h-3.5 text-accent" />
            )}
          </div>
          <NotificationsDropdown />
          <Button variant="ghost" size="sm" onClick={signOut} className="h-7 px-2 text-muted-foreground hover:text-primary">
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {/* Nav on second line, always visible with scroll */}
      <div className="container mx-auto px-4 pb-1.5 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        <GlobalNav />
      </div>
    </header>
  );
};

export default AppHeader;
