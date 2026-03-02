import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Home, User, Flame, Swords, Trophy, Gift, MessageSquare, BookOpen, HelpCircle, DollarSign, Download, Gavel, Paintbrush, Crown, BarChart3, Bot, Star, Skull } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useGameState } from "@/hooks/useGameState";

const GlobalNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { gameState } = useGameState();
  const { isAdmin } = useIsAdmin();
  const gameOn = gameState?.game_on ?? false;
  const navRef = useRef<HTMLDivElement>(null);

  const allItems = [
    { path: "/", label: "Home", icon: Home, requiresGame: false, requiresAuth: false },
    { path: "/patrocinador", label: "Patrocínio", icon: Crown, requiresGame: false, requiresAuth: false },
    { path: "/profile", label: "Perfil", icon: User, requiresGame: false, requiresAuth: true },
    { path: "/feed", label: "Feeds", icon: Flame, requiresGame: true, requiresAuth: true },
    { path: "/duels", label: "Duelos", icon: Swords, requiresGame: true, requiresAuth: true },
    { path: "/top10", label: "Top10", icon: Trophy, requiresGame: true, requiresAuth: true },
    { path: "/premios", label: "Prêmios", icon: Gift, requiresGame: true, requiresAuth: true },
    { path: "/desafios-juiz", label: "Desafios", icon: Gavel, requiresGame: true, requiresAuth: true },
    { path: "/editor", label: "Editor", icon: Paintbrush, requiresGame: true, requiresAuth: true },
    { path: "/seguidores", label: "Seguidores", icon: User, requiresGame: true, requiresAuth: true },
    { path: "/convites", label: "Convites", icon: Star, requiresGame: false, requiresAuth: true },
    { path: "/chats", label: "Chats", icon: MessageSquare, requiresGame: true, requiresAuth: true },
    { path: "/regras", label: "Regras", icon: BookOpen, requiresGame: false, requiresAuth: true },
    { path: "/ajuda", label: "Ajuda", icon: HelpCircle, requiresGame: false, requiresAuth: true },
    { path: "/comprar-likes", label: "Loja", icon: DollarSign, requiresGame: true, requiresAuth: true },
    { path: "/downloads", label: "Downloads", icon: Download, requiresGame: false, requiresAuth: true },
    { path: "/eliminados", label: "Eliminados", icon: Skull, requiresGame: false, requiresAuth: false },
    { path: "/stats", label: "Stats", icon: BarChart3, requiresGame: false, requiresAuth: true, requiresAdmin: true },
    { path: "/bots-control", label: "Bots", icon: Bot, requiresGame: false, requiresAuth: true, requiresAdmin: true },
  ];

  const visibleItems = allItems.filter((item) => {
    if (item.requiresAuth && !user) return false;
    if (item.requiresGame && !gameOn) return false;
    if ((item as any).requiresAdmin && !isAdmin) return false;
    return true;
  });

  useEffect(() => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [location.pathname]);

  return (
    <nav ref={navRef} className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-0.5" style={{ scrollbarWidth: 'thin' }}>
      {visibleItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            data-active={isActive}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors min-h-[56px]",
              isActive
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default GlobalNav;
