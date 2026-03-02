export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ajuda_tickets: {
        Row: {
          created_at: string
          foto_url: string | null
          id: string
          resposta: string | null
          status: string
          texto: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          foto_url?: string | null
          id?: string
          resposta?: string | null
          status?: string
          texto: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          foto_url?: string | null
          id?: string
          resposta?: string | null
          status?: string
          texto?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assets_marketing: {
        Row: {
          arquivo_url: string
          created_at: string
          id: string
          tipo: string
          titulo: string | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          id?: string
          tipo: string
          titulo?: string | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          id?: string
          tipo?: string
          titulo?: string | null
        }
        Relationships: []
      }
      blacklist_palavras: {
        Row: {
          categoria: string | null
          id: string
          palavra: string
        }
        Insert: {
          categoria?: string | null
          id?: string
          palavra: string
        }
        Update: {
          categoria?: string | null
          id?: string
          palavra?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          ativa: boolean
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          jogador_id: string
          juiz_id: string
          likes_enviados: number
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          jogador_id: string
          juiz_id: string
          likes_enviados?: number
        }
        Update: {
          ativa?: boolean
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          jogador_id?: string
          juiz_id?: string
          likes_enviados?: number
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          bombas: number
          created_at: string
          id: string
          juiz_id: string
          likes: number
          midia_type: string | null
          midia_url: string | null
          post_id: string
          texto: string | null
        }
        Insert: {
          bombas?: number
          created_at?: string
          id?: string
          juiz_id: string
          likes?: number
          midia_type?: string | null
          midia_url?: string | null
          post_id: string
          texto?: string | null
        }
        Update: {
          bombas?: number
          created_at?: string
          id?: string
          juiz_id?: string
          likes?: number
          midia_type?: string | null
          midia_url?: string | null
          post_id?: string
          texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_pix: {
        Row: {
          comprovante_url: string | null
          created_at: string
          id: string
          likes_adquiridos: number
          pix_copia: string | null
          status: string
          tipo: string
          usuario_id: string
          valor: number
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string
          id?: string
          likes_adquiridos: number
          pix_copia?: string | null
          status?: string
          tipo?: string
          usuario_id: string
          valor: number
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string
          id?: string
          likes_adquiridos?: number
          pix_copia?: string | null
          status?: string
          tipo?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          created_at: string
          data: string
          id: string
          likes_dia: number
          ranking_dia: number
          streak_dias: number
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          likes_dia?: number
          ranking_dia?: number
          streak_dias?: number
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          likes_dia?: number
          ranking_dia?: number
          streak_dias?: number
          user_id?: string
        }
        Relationships: []
      }
      desafios: {
        Row: {
          aprovado: boolean
          created_at: string
          id: string
          juiz_id: string
          likes_pago: number
          rejeitado: boolean
          texto: string | null
          video_url: string | null
        }
        Insert: {
          aprovado?: boolean
          created_at?: string
          id?: string
          juiz_id: string
          likes_pago?: number
          rejeitado?: boolean
          texto?: string | null
          video_url?: string | null
        }
        Update: {
          aprovado?: boolean
          created_at?: string
          id?: string
          juiz_id?: string
          likes_pago?: number
          rejeitado?: boolean
          texto?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      doacoes_premios: {
        Row: {
          aprovado: boolean
          bairro: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          descricao: string | null
          endereco: string | null
          estado: string | null
          id: string
          likes_recebidos: number
          midia_url: string
          numero: string | null
          quantidade: number
          tipo_prateleira: number
          titulo: string | null
          usuario_id: string
        }
        Insert: {
          aprovado?: boolean
          bairro?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          likes_recebidos?: number
          midia_url: string
          numero?: string | null
          quantidade?: number
          tipo_prateleira?: number
          titulo?: string | null
          usuario_id: string
        }
        Update: {
          aprovado?: boolean
          bairro?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          likes_recebidos?: number
          midia_url?: string
          numero?: string | null
          quantidade?: number
          tipo_prateleira?: number
          titulo?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      duel_votes: {
        Row: {
          created_at: string
          duel_id: string
          id: string
          vote_type: string
          vote_value: number
          voted_for: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          duel_id: string
          id?: string
          vote_type?: string
          vote_value?: number
          voted_for: string
          voter_id: string
        }
        Update: {
          created_at?: string
          duel_id?: string
          id?: string
          vote_type?: string
          vote_value?: number
          voted_for?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duel_votes_duel_id_fkey"
            columns: ["duel_id"]
            isOneToOne: false
            referencedRelation: "duels"
            referencedColumns: ["id"]
          },
        ]
      }
      duels: {
        Row: {
          challenged_id: string
          challenged_votes: number
          challenger_id: string
          challenger_votes: number
          created_at: string
          id: string
          resolved_at: string | null
          status: string
          winner_id: string | null
        }
        Insert: {
          challenged_id: string
          challenged_votes?: number
          challenger_id: string
          challenger_votes?: number
          created_at?: string
          id?: string
          resolved_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          challenged_id?: string
          challenged_votes?: number
          challenger_id?: string
          challenger_votes?: number
          created_at?: string
          id?: string
          resolved_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      game_state: {
        Row: {
          game_on: boolean
          id: number
          start_date: string | null
          updated_at: string
        }
        Insert: {
          game_on?: boolean
          id?: number
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          game_on?: boolean
          id?: number
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      home_config: {
        Row: {
          id: string
          prize_enabled: boolean
          prize_value: string
          promo_text: string
          promo_text_2: string
          secondary_prizes: Json
          sponsors: Json
          updated_at: string
          video_loop_url: string | null
          video_prize_url: string | null
          video_rules_url: string | null
        }
        Insert: {
          id?: string
          prize_enabled?: boolean
          prize_value?: string
          promo_text?: string
          promo_text_2?: string
          secondary_prizes?: Json
          sponsors?: Json
          updated_at?: string
          video_loop_url?: string | null
          video_prize_url?: string | null
          video_rules_url?: string | null
        }
        Update: {
          id?: string
          prize_enabled?: boolean
          prize_value?: string
          promo_text?: string
          promo_text_2?: string
          secondary_prizes?: Json
          sponsors?: Json
          updated_at?: string
          video_loop_url?: string | null
          video_prize_url?: string | null
          video_rules_url?: string | null
        }
        Relationships: []
      }
      juiz_posts_diarios: {
        Row: {
          data: string
          id: string
          juiz_id: string
          post_count: number
        }
        Insert: {
          data?: string
          id?: string
          juiz_id: string
          post_count?: number
        }
        Update: {
          data?: string
          id?: string
          juiz_id?: string
          post_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          chat_id: string | null
          created_at: string
          from_user_id: string | null
          id: string
          lido: boolean
          mensagem: string | null
          post_id: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          lido?: boolean
          mensagem?: string | null
          post_id?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          lido?: boolean
          mensagem?: string | null
          post_id?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      post_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          position: number
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          position?: number
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          position?: number
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          boost_likes: number
          categoria: string | null
          content: string
          created_at: string
          deletado: boolean
          denuncias_improprio: number | null
          dislikes_tema: number | null
          expires_at: string
          game_on: boolean
          id: string
          image_url: string | null
          likes_count: number
          music_url: string | null
          remix_count: number
          tema_id: string | null
          tema_validado: boolean | null
          tipo: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          boost_likes?: number
          categoria?: string | null
          content: string
          created_at?: string
          deletado?: boolean
          denuncias_improprio?: number | null
          dislikes_tema?: number | null
          expires_at?: string
          game_on?: boolean
          id?: string
          image_url?: string | null
          likes_count?: number
          music_url?: string | null
          remix_count?: number
          tema_id?: string | null
          tema_validado?: boolean | null
          tipo?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          boost_likes?: number
          categoria?: string | null
          content?: string
          created_at?: string
          deletado?: boolean
          denuncias_improprio?: number | null
          dislikes_tema?: number | null
          expires_at?: string
          game_on?: boolean
          id?: string
          image_url?: string | null
          likes_count?: number
          music_url?: string | null
          remix_count?: number
          tema_id?: string | null
          tema_validado?: boolean | null
          tipo?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      premios: {
        Row: {
          aprovado: boolean
          bairro: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          descricao: string | null
          endereco: string | null
          estado: string | null
          estoque: number
          id: string
          likes_custo: number
          midia_url: string | null
          numero: string | null
          quantidade: number
          tipo_prateleira: number
          titulo: string | null
        }
        Insert: {
          aprovado?: boolean
          bairro?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          estoque?: number
          id?: string
          likes_custo?: number
          midia_url?: string | null
          numero?: string | null
          quantidade?: number
          tipo_prateleira: number
          titulo?: string | null
        }
        Update: {
          aprovado?: boolean
          bairro?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          estoque?: number
          id?: string
          likes_custo?: number
          midia_url?: string | null
          numero?: string | null
          quantidade?: number
          tipo_prateleira?: number
          titulo?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          blocked_until: string | null
          created_at: string
          id: string
          is_blocked: boolean
          is_bot: boolean
          multiplicador_ativo: number | null
          multiplicador_end: string | null
          music_url: string | null
          name: string
          premium_active: boolean
          premium_end: string | null
          profile_text: string | null
          sex: string | null
          show_whatsapp: boolean
          tema_id: string | null
          total_likes: number
          ultima_doacao: string | null
          updated_at: string
          user_id: string
          user_type: string
          video_url: string | null
          visual_likes: number
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          is_bot?: boolean
          multiplicador_ativo?: number | null
          multiplicador_end?: string | null
          music_url?: string | null
          name: string
          premium_active?: boolean
          premium_end?: string | null
          profile_text?: string | null
          sex?: string | null
          show_whatsapp?: boolean
          tema_id?: string | null
          total_likes?: number
          ultima_doacao?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
          video_url?: string | null
          visual_likes?: number
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          is_bot?: boolean
          multiplicador_ativo?: number | null
          multiplicador_end?: string | null
          music_url?: string | null
          name?: string
          premium_active?: boolean
          premium_end?: string | null
          profile_text?: string | null
          sex?: string | null
          show_whatsapp?: boolean
          tema_id?: string | null
          total_likes?: number
          ultima_doacao?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          video_url?: string | null
          visual_likes?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_content: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          position?: number
        }
        Relationships: []
      }
      remixes: {
        Row: {
          created_at: string
          id: string
          post_original_id: string
          remix_post_id: string | null
          remixador_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_original_id: string
          remix_post_id?: string | null
          remixador_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_original_id?: string
          remix_post_id?: string | null
          remixador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remixes_post_original_id_fkey"
            columns: ["post_original_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remixes_remix_post_id_fkey"
            columns: ["remix_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      resgates: {
        Row: {
          codigo_ticket: string | null
          created_at: string
          endereco_completo: string | null
          id: string
          likes_gastos: number
          premio_id: string
          status: string
          usuario_id: string
        }
        Insert: {
          codigo_ticket?: string | null
          created_at?: string
          endereco_completo?: string | null
          id?: string
          likes_gastos: number
          premio_id: string
          status?: string
          usuario_id: string
        }
        Update: {
          codigo_ticket?: string | null
          created_at?: string
          endereco_completo?: string | null
          id?: string
          likes_gastos?: number
          premio_id?: string
          status?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resgates_premio_id_fkey"
            columns: ["premio_id"]
            isOneToOne: false
            referencedRelation: "premios"
            referencedColumns: ["id"]
          },
        ]
      }
      temas: {
        Row: {
          ativo: boolean
          created_at: string
          fator: number
          id: string
          midia_url: string | null
          titulo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          fator?: number
          id?: string
          midia_url?: string | null
          titulo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          fator?: number
          id?: string
          midia_url?: string | null
          titulo?: string
        }
        Relationships: []
      }
      user_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          position?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      user_referrals: {
        Row: {
          created_at: string
          friends_invited: number
          id: string
          likes_earned: number
          network: string
          used_first_time: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          friends_invited?: number
          id?: string
          likes_earned?: number
          network: string
          used_first_time?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          friends_invited?: number
          id?: string
          likes_earned?: number
          network?: string
          used_first_time?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_turbo_premium: { Args: never; Returns: undefined }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      increment_juiz_post_count: {
        Args: { p_juiz_id: string }
        Returns: number
      }
      is_game_on: { Args: never; Returns: boolean }
      notify_all_game_state: {
        Args: { p_game_on: boolean }
        Returns: undefined
      }
      send_mimo: {
        Args: { p_jogador_id: string; p_juiz_id: string; p_likes: number }
        Returns: string
      }
    }
    Enums: {
      interaction_type:
        | "like"
        | "dislike"
        | "love"
        | "haha"
        | "wow"
        | "sad"
        | "angry"
        | "bomb"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      interaction_type: [
        "like",
        "dislike",
        "love",
        "haha",
        "wow",
        "sad",
        "angry",
        "bomb",
      ],
    },
  },
} as const
