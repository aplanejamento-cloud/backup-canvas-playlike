import { FeedTab } from "@/types/feed";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Zap, Users, Flame, Bomb, Swords, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

const tabs: { value: FeedTab; label: string; icon: typeof Crown; description: string; explanation: string }[] = [
  { value: "na-tela", label: "Na Tela", icon: Crown, description: "Top 100", explanation: "Neste Feed só aparecem as publicações Top 100 da rede" },
  { value: "acontecendo", label: "Agora", icon: Zap, description: "Últimas 24h", explanation: "Neste Feed só aparecem as publicações feitas por todos nas últimas 24 horas" },
  { value: "cultura", label: "Cultura", icon: BookOpen, description: "📚 Boost", explanation: "Neste Feed só aparecem posts da seção Cultura com boost likes" },
  { value: "fan-club", label: "Fan Club", icon: Users, description: "Seguindo", explanation: "Neste Feed só aparecem posts das pessoas que você segue" },
  { value: "lacrou", label: "Lacrou", icon: Flame, description: "+1K likes", explanation: "Neste Feed só aparecem publicações que receberam +1K likes" },
  { value: "bomba", label: "Bomba", icon: Bomb, description: "≤ -1K", explanation: "Neste Feed só aparecem publicações com -1K bombas" },
  { value: "duelos", label: "Duelos", icon: Swords, description: "⚔️ VS", explanation: "Neste Feed só aparecem desafios ativos" },
];

const FeedTabs = ({ activeTab, onTabChange }: FeedTabsProps) => {
  const activeTabData = tabs.find(t => t.value === activeTab);

  return (
    <div className="space-y-2">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as FeedTab)}>
        <TabsList className="w-full h-auto bg-card/50 border border-border p-1 grid grid-cols-7 gap-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-1 text-xs",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                "data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium hidden sm:block">{tab.label}</span>
              <span className="text-[10px] opacity-70 hidden md:block">{tab.description}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {activeTabData && (
        <p className="text-xs text-muted-foreground text-center bg-card/30 border border-border/50 rounded-lg px-3 py-2">
          {activeTabData.explanation}
        </p>
      )}
    </div>
  );
};

export default FeedTabs;
