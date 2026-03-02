import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useGameState } from "@/hooks/useGameState";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Convites from "./pages/Convites";
import Profile from "./pages/Profile";
import ProfileByName from "./pages/ProfileByName";
import Duels from "./pages/Duels";
import Top10 from "./pages/Top10";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Premios from "./pages/Premios";
import Doacoes from "./pages/Doacoes";
import ChatPage from "./pages/ChatPage";
import ChatsPage from "./pages/ChatsPage";
import Regras from "./pages/Regras";
import Ajuda from "./pages/Ajuda";
import ComprarLikes from "./pages/ComprarLikes";
import Downloads from "./pages/Downloads";
import DesafiosJuiz from "./pages/DesafiosJuiz";
import Editor from "./pages/Editor";
import Seguidores from "./pages/Seguidores";
import Patrocinador from "./pages/Patrocinador";
import AdminStats from "./pages/AdminStats";
import BotsControl from "./pages/BotsControl";
import AdminPixLogs from "./pages/AdminPixLogs";
import AdminPremiumUsers from "./pages/AdminPremiumUsers";
import AdminCulturaStats from "./pages/AdminCulturaStats";
import Eliminados from "./pages/Eliminados";
import DailyReportModal from "@/components/retention/DailyReportModal";
import JuizDoacaoPopup from "@/components/retention/JuizDoacaoPopup";

const queryClient = new QueryClient();

// Routes always accessible regardless of game state
const PUBLIC_PATHS = ["/", "/reset-password", "/patrocinador"];
const isPublicPath = (path: string) =>
  PUBLIC_PATHS.includes(path) ||
  path.startsWith("/@") ||
  path.startsWith("/profile");

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const { gameState, isLoading: gsLoading } = useGameState();

  if (isLoading || gsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse-gold font-cinzel text-2xl">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (gameState && !gameState.game_on) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};

const AuthProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse-gold font-cinzel text-2xl">Carregando...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        {/* Always public */}
        <Route path="/" element={<Index />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/@:username" element={<ProfileByName />} />
        <Route path="/patrocinador" element={<Patrocinador />} />
        <Route path="/eliminados" element={<Eliminados />} />

        {/* Auth-only but game-state-independent */}
        <Route path="/profile" element={<AuthProtectedRoute><Profile /></AuthProtectedRoute>} />
        <Route path="/profile/:userId" element={<AuthProtectedRoute><Profile /></AuthProtectedRoute>} />
        <Route path="/convites" element={<AuthProtectedRoute><Convites /></AuthProtectedRoute>} />
        <Route path="/regras" element={<AuthProtectedRoute><Regras /></AuthProtectedRoute>} />
        <Route path="/ajuda" element={<AuthProtectedRoute><Ajuda /></AuthProtectedRoute>} />
        <Route path="/stats" element={<AuthProtectedRoute><AdminStats /></AuthProtectedRoute>} />
        <Route path="/bots-control" element={<AuthProtectedRoute><BotsControl /></AuthProtectedRoute>} />
        <Route path="/admin/pix-logs" element={<AuthProtectedRoute><AdminPixLogs /></AuthProtectedRoute>} />
        <Route path="/admin/premium-users" element={<AuthProtectedRoute><AdminPremiumUsers /></AuthProtectedRoute>} />
        <Route path="/admin/cultura-stats" element={<AuthProtectedRoute><AdminCulturaStats /></AuthProtectedRoute>} />

        {/* Game-state protected */}
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/duels" element={<ProtectedRoute><Duels /></ProtectedRoute>} />
        <Route path="/top10" element={<ProtectedRoute><Top10 /></ProtectedRoute>} />
        <Route path="/premios" element={<ProtectedRoute><Premios /></ProtectedRoute>} />
        <Route path="/doacoes" element={<ProtectedRoute><Doacoes /></ProtectedRoute>} />

        {/* Chat routes */}
        <Route path="/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
        <Route path="/chat/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/comprar-likes" element={<ProtectedRoute><ComprarLikes /></ProtectedRoute>} />
        <Route path="/downloads" element={<AuthProtectedRoute><Downloads /></AuthProtectedRoute>} />
        <Route path="/seguidores" element={<ProtectedRoute><Seguidores /></ProtectedRoute>} />
        <Route path="/desafios-juiz" element={<ProtectedRoute><DesafiosJuiz /></ProtectedRoute>} />
        <Route path="/editor" element={<ProtectedRoute><Editor /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Daily report modal - shows at 22h+ */}
      {user && <DailyReportModal />}
      {user && <JuizDoacaoPopup />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
