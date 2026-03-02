import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBlacklist() {
  const { data: words = [] } = useQuery({
    queryKey: ["blacklist"],
    queryFn: async () => {
      const { data } = await supabase.from("blacklist_palavras").select("palavra");
      return (data || []).map((w: any) => w.palavra.toLowerCase());
    },
    staleTime: 5 * 60 * 1000,
  });

  const checkContent = (text: string): string | null => {
    const lower = text.toLowerCase();
    for (const word of words) {
      if (lower.includes(word)) return word;
    }
    return null;
  };

  return { words, checkContent };
}
