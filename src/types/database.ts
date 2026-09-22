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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      discovery_tags: {
        Row: {
          category: string
          created_at: string
          id: string
          label: string
          reason: string
          selected: boolean
          selected_at: string | null
          walk_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          label: string
          reason: string
          selected?: boolean
          selected_at?: string | null
          walk_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          label?: string
          reason?: string
          selected?: boolean
          selected_at?: string | null
          walk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_tags_walk_id_fkey"
            columns: ["walk_id"]
            isOneToOne: false
            referencedRelation: "walks"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_sets: {
        Row: {
          ai_provider: string | null
          created_at: string
          id: string
          search_provider: string | null
          search_query: string | null
          walk_id: string
        }
        Insert: {
          ai_provider?: string | null
          created_at?: string
          id?: string
          search_provider?: string | null
          search_query?: string | null
          walk_id: string
        }
        Update: {
          ai_provider?: string | null
          created_at?: string
          id?: string
          search_provider?: string | null
          search_query?: string | null
          walk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_sets_walk_id_fkey"
            columns: ["walk_id"]
            isOneToOne: true
            referencedRelation: "walks"
            referencedColumns: ["id"]
          },
        ]
      }
      recommended_place_tags: {
        Row: {
          discovery_tag_id: string
          recommended_place_id: string
        }
        Insert: {
          discovery_tag_id: string
          recommended_place_id: string
        }
        Update: {
          discovery_tag_id?: string
          recommended_place_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommended_place_tags_discovery_tag_id_fkey"
            columns: ["discovery_tag_id"]
            isOneToOne: false
            referencedRelation: "discovery_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommended_place_tags_recommended_place_id_fkey"
            columns: ["recommended_place_id"]
            isOneToOne: false
            referencedRelation: "recommended_places"
            referencedColumns: ["id"]
          },
        ]
      }
      recommended_places: {
        Row: {
          area: string | null
          created_at: string
          description: string
          google_maps_query: string
          id: string
          image_url: string | null
          name: string
          recommendation_set_id: string
          sort_order: number
          source_domain: string | null
          source_url: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string
          description: string
          google_maps_query: string
          id?: string
          image_url?: string | null
          name: string
          recommendation_set_id: string
          sort_order: number
          source_domain?: string | null
          source_url?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string
          description?: string
          google_maps_query?: string
          id?: string
          image_url?: string | null
          name?: string
          recommendation_set_id?: string
          sort_order?: number
          source_domain?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommended_places_recommendation_set_id_fkey"
            columns: ["recommendation_set_id"]
            isOneToOne: false
            referencedRelation: "recommendation_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_places: {
        Row: {
          area: string | null
          created_at: string
          description: string
          google_maps_query: string
          id: string
          image_url: string | null
          matched_tags: Json
          name: string
          source_recommended_place_id: string | null
          user_id: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          description: string
          google_maps_query: string
          id?: string
          image_url?: string | null
          matched_tags?: Json
          name: string
          source_recommended_place_id?: string | null
          user_id: string
        }
        Update: {
          area?: string | null
          created_at?: string
          description?: string
          google_maps_query?: string
          id?: string
          image_url?: string | null
          matched_tags?: Json
          name?: string
          source_recommended_place_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      walk_photos: {
        Row: {
          created_at: string
          height: number | null
          id: string
          public_url: string | null
          sort_order: number
          storage_path: string
          walk_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          public_url?: string | null
          sort_order: number
          storage_path: string
          walk_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          public_url?: string | null
          sort_order?: number
          storage_path?: string
          walk_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "walk_photos_walk_id_fkey"
            columns: ["walk_id"]
            isOneToOne: false
            referencedRelation: "walks"
            referencedColumns: ["id"]
          },
        ]
      }
      walks: {
        Row: {
          completed_at: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          location: string | null
          status: Database["public"]["Enums"]["walk_status"]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          location?: string | null
          status?: Database["public"]["Enums"]["walk_status"]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          location?: string | null
          status?: Database["public"]["Enums"]["walk_status"]
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_discovery_tags: {
        Args: { p_selected_tag_ids: string[]; p_walk_id: string }
        Returns: undefined
      }
      save_discovery_analysis: {
        Args: { p_tags: Json; p_title: string; p_walk_id: string }
        Returns: undefined
      }
      save_recommended_place: {
        Args: { p_recommended_place_id: string }
        Returns: Json
      }
      save_walk_recommendations: {
        Args: {
          p_ai_provider: string
          p_places: Json
          p_search_provider: string
          p_search_query: string
          p_walk_id: string
        }
        Returns: undefined
      }
      unsave_place: { Args: { p_saved_place_id: string }; Returns: undefined }
    }
    Enums: {
      walk_status:
        | "DRAFT"
        | "ANALYZING"
        | "TAG_SELECTION"
        | "RECOMMENDING"
        | "COMPLETED"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      walk_status: [
        "DRAFT",
        "ANALYZING",
        "TAG_SELECTION",
        "RECOMMENDING",
        "COMPLETED",
      ],
    },
  },
} as const
