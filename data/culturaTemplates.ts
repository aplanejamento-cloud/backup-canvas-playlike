export interface CulturaTemplate {
  id: string;
  categoria: string;
  titulo: string;
  texto: string;
  boost: number;
  tags: string[];
  emoji: string;
}

export const CULTURA_CATEGORIAS = [
  { id: "jogos", label: "⚽ Jogos", emoji: "⚽" },
  { id: "ebook", label: "📚 eBooks", emoji: "📚" },
  { id: "fitness", label: "💪 Fitness", emoji: "💪" },
  { id: "moda", label: "👗 Moda", emoji: "👗" },
  { id: "memes", label: "😂 Memes", emoji: "😂" },
  { id: "filme", label: "🎬 Filmes", emoji: "🎬" },
  { id: "musica", label: "🎵 Música", emoji: "🎵" },
  { id: "crypto", label: "💰 Crypto", emoji: "💰" },
] as const;

export const CULTURA_TEMPLATES: CulturaTemplate[] = [
  // Jogos
  { id: "j1", categoria: "jogos", titulo: "Corinthians x SPFC", emoji: "⚽", texto: "⚽ CLÁSSICO PAULISTA! Quem leva? 🔥\n\nTimão ou Tricolor?\nComenta seu palpite! 👇\n\n#Timão #SPFC #Clássico", boost: 35, tags: ["#Timão", "#Clássico"] },
  { id: "j2", categoria: "jogos", titulo: "Palmeiras Libertadores", emoji: "🏆", texto: "🏆 VERDÃO NA LIBERTA! Vai ser campeão de novo?\n\nPalmeiras não tem Mundial? TEM SIM! 🐷💚\n\n#Palmeiras #Libertadores", boost: 30, tags: ["#Palmeiras", "#Libertadores"] },
  { id: "j3", categoria: "jogos", titulo: "Flamengo x Vasco", emoji: "🔴⚫", texto: "🔴⚫ CLÁSSICO DOS MILHÕES!\n\nFla ou Vasco? Quem é maior?\nVota aí! 🔥👇\n\n#Flamengo #Vasco", boost: 35, tags: ["#Flamengo", "#Vasco"] },

  // eBooks
  { id: "e1", categoria: "ebook", titulo: "Receitas Fit Guarujá", emoji: "📚", texto: "📚 Omelete Fit em 5min = VIDA! 🔥\n\n3 receitas práticas pra quem treina\nPDF GRÁTIS no link da bio!\n\n#Guarujá #Fit #Receitas", boost: 25, tags: ["#Guarujá", "#Fit"] },
  { id: "e2", categoria: "ebook", titulo: "Mindset Empreendedor", emoji: "🧠", texto: "🧠 5 hábitos que mudaram minha vida!\n\n1. Acordar 5h\n2. Ler 30min/dia\n3. Exercício DIÁRIO\n\nQual é o seu? 👇\n\n#Mindset #Empreendedor", boost: 20, tags: ["#Mindset", "#Empreendedor"] },

  // Fitness
  { id: "f1", categoria: "fitness", titulo: "Treino HIIT 15min", emoji: "💪", texto: "💪 TREINO HIIT 15 MINUTOS!\n\n🔥 30s Burpee\n🔥 30s Mountain Climber\n🔥 30s Polichinelo\n⏸️ 30s Descanso x5\n\nBora treinar! 🏋️\n\n#HIIT #Treino #Fitness", boost: 25, tags: ["#HIIT", "#Fitness"] },
  { id: "f2", categoria: "fitness", titulo: "Shape Verão 2026", emoji: "☀️", texto: "☀️ SHAPE VERÃO 2026!\n\nDieta + Treino + Constância = RESULTADO\n\nComece HOJE, não segunda! 💪\n\n#ShapeVerão #Dieta #Treino", boost: 20, tags: ["#ShapeVerão", "#Treino"] },

  // Moda
  { id: "m1", categoria: "moda", titulo: "Looks Shein 2026", emoji: "👗", texto: "👗 TOP 3 LOOKS SHEIN 2026!\n\n1. Vestido midi floral 🌸\n2. Conjunto cropped + wide leg\n3. Blazer oversized\n\nQual é o seu? 💕\n\n#Shein #Moda #Looks2026", boost: 20, tags: ["#Shein", "#Moda"] },
  { id: "m2", categoria: "moda", titulo: "Tendências Streetwear", emoji: "🧢", texto: "🧢 STREETWEAR BR 2026!\n\nCamisetão + Bermuda Cargo + Jordan\nO básico que nunca sai de moda 🔥\n\n#Streetwear #ModaMasculina", boost: 20, tags: ["#Streetwear", "#Moda"] },

  // Memes
  { id: "me1", categoria: "memes", titulo: "Segunda-feira be like", emoji: "😂", texto: "😂 SEGUNDA-FEIRA:\n\n'Vou dormir cedo'\n*3h da manhã no TikTok*\n\nQuem se identifica? 🤡👇\n\n#Memes #SegundaFeira #Humor", boost: 25, tags: ["#Memes", "#Humor"] },
  { id: "me2", categoria: "memes", titulo: "Salário chegou", emoji: "💸", texto: "💸 SALÁRIO CHEGOU!\n\nDia 5: 'Vou economizar'\nDia 6: *pedido iFood*\nDia 10: 'Cadê meu dinheiro?'\n\n🤡🤡🤡\n\n#Memes #Salário #Humor", boost: 25, tags: ["#Memes", "#Salário"] },
  { id: "me3", categoria: "memes", titulo: "Dieta começou", emoji: "🍔", texto: "🍔 DIETA:\n\nSegunda: Salada ✅\nTerça: Frango grelhado ✅\nQuarta: 'Só um pedacinho de bolo'\nQuinta: Pizza família inteira 🍕\n\nRelatável? 😅\n\n#Memes #Dieta", boost: 20, tags: ["#Memes", "#Dieta"] },

  // Filmes
  { id: "fi1", categoria: "filme", titulo: "Top 5 Netflix 2026", emoji: "🎬", texto: "🎬 TOP 5 NETFLIX FEVEREIRO 2026!\n\n1. 🔥 Novo thriller coreano\n2. 💕 Romance brasileiro\n3. 😱 Terror psicológico\n\nJá assistiu? Comenta! 👇\n\n#Netflix #Filmes #Séries", boost: 25, tags: ["#Netflix", "#Filmes"] },
  { id: "fi2", categoria: "filme", titulo: "Marvel fase nova", emoji: "🦸", texto: "🦸 MARVEL 2026!\n\nNovos filmes vindo aí...\nQuem tá hyped? 🔥\n\nComenta seu herói favorito! 💪\n\n#Marvel #Filmes #Herois", boost: 20, tags: ["#Marvel", "#Filmes"] },

  // Música
  { id: "mu1", categoria: "musica", titulo: "Funk ou Sertanejo?", emoji: "🎵", texto: "🎵 DEBATE: Funk ou Sertanejo?\n\n🎤 Funk: energia da favela\n🤠 Sertanejo: sofrência raiz\n\nQual é o MELHOR? Vota! 👇\n\n#Funk #Sertanejo #Música", boost: 30, tags: ["#Funk", "#Sertanejo"] },
  { id: "mu2", categoria: "musica", titulo: "Playlist Treino", emoji: "🎧", texto: "🎧 PLAYLIST TREINO 2026!\n\n1. Rap motivacional\n2. Eletrônica pesada\n3. Rock clássico\n\nManda sua música de treino! 🏋️\n\n#Playlist #Treino #Música", boost: 20, tags: ["#Playlist", "#Música"] },

  // Crypto
  { id: "c1", categoria: "crypto", titulo: "Bitcoin 2026", emoji: "₿", texto: "₿ BITCOIN EM 2026!\n\nVai bater 200k USD? 🚀\n\nHODL ou SELL?\n\nComenta sua estratégia! 📈\n\n#Bitcoin #Crypto #BTC", boost: 20, tags: ["#Bitcoin", "#Crypto"] },
  { id: "c2", categoria: "crypto", titulo: "PIX vs Crypto", emoji: "💰", texto: "💰 PIX vs CRYPTO:\n\nPIX: instantâneo, grátis, BR\nCrypto: global, descentralizado\n\nQual o futuro? 🤔\n\n#PIX #Crypto #Finanças", boost: 20, tags: ["#PIX", "#Crypto"] },

  // Novos templates
  { id: "e3", categoria: "ebook", titulo: "Meu eBook PDF!", emoji: "📚", texto: "📚 MEU eBOOK GRÁTIS!\n\nBaixe agora o PDF completo 📖\nConhecimento é poder! 💡\n\nComenta 'EU QUERO' 👇\n\n#eBook #PDF #Conhecimento", boost: 25, tags: ["#eBook", "#PDF"] },
  { id: "mu3", categoria: "musica", titulo: "Anitta - Spotify", emoji: "🎵", texto: "🎵 ANITTA NO SPOTIFY!\n\nhttps://open.spotify.com/artist/7FNnA9vBm6EKceENgCGRMb\n\nRainha do pop brasileiro! 👑🇧🇷\nQual sua música favorita?\n\n#Anitta #Spotify #PopBR", boost: 30, tags: ["#Anitta", "#Spotify"] },
  { id: "fi3", categoria: "filme", titulo: "Vingadores - YouTube", emoji: "🎬", texto: "🎬 VINGADORES TRAILER OFICIAL!\n\nhttps://youtube.com/watch?v=TcMBFSGVi1c\n\nMarvel sempre entregando! 🦸‍♂️\nQual seu Vingador favorito?\n\n#Vingadores #Marvel #YouTube", boost: 25, tags: ["#Marvel", "#Vingadores"] },
  { id: "mu4", categoria: "musica", titulo: "MC Ryan SP", emoji: "🎤", texto: "🎤 MC RYAN SP - VIDEOCLIPE NOVO!\n\nhttps://youtube.com/results?search_query=mc+ryan+sp\n\nFunk de SP dominando! 🔥\nComenta seu funk favorito 👇\n\n#MCRyanSP #Funk #SP", boost: 30, tags: ["#Funk", "#MCRyanSP"] },
  { id: "fi4", categoria: "filme", titulo: "G1 Notícias", emoji: "📰", texto: "📰 NOTÍCIAS DO DIA - G1!\n\nhttps://g1.globo.com\n\nFique por dentro de tudo! 🌍\nQual notícia te surpreendeu?\n\n#G1 #Notícias #Brasil", boost: 20, tags: ["#G1", "#Notícias"] },
];
