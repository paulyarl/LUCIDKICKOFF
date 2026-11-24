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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      approval_requests: {
        Row: {
          child_id: string
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          parent_id: string
          request_type: string
          status: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          parent_id: string
          request_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          parent_id?: string
          request_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      artwork_categories: {
        Row: {
          artwork_id: string
          category_id: string
          created_at: string
          id: string
        }
        Insert: {
          artwork_id: string
          category_id: string
          created_at?: string
          id?: string
        }
        Update: {
          artwork_id?: string
          category_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_categories_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_categories_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "trending_artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_categories_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "user_recent_artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      artworks: {
        Row: {
          created_at: string
          description: string | null
          height: number | null
          id: string
          image_url: string
          is_featured: boolean | null
          is_public: boolean | null
          like_count: number | null
          thumbnail_url: string
          title: string
          updated_at: string
          user_id: string
          view_count: number | null
          width: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          height?: number | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          is_public?: boolean | null
          like_count?: number | null
          thumbnail_url: string
          title: string
          updated_at?: string
          user_id: string
          view_count?: number | null
          width?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          height?: number | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          like_count?: number | null
          thumbnail_url?: string
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
          width?: number | null
        }
        Relationships: []
      }
      carousels: {
        Row: {
          cover_path: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          rating_avg: number
          rating_count: number
          slug: string
          tags: string[]
          title: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          rating_avg?: number
          rating_count?: number
          slug: string
          tags?: string[]
          title: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          rating_avg?: number
          rating_count?: number
          slug?: string
          tags?: string[]
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      child_link_otps: {
        Row: {
          child_id: string
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          updated_at: string
          used: boolean | null
        }
        Insert: {
          child_id: string
          created_at?: string
          expires_at: string
          id?: string
          otp_hash: string
          updated_at?: string
          used?: boolean | null
        }
        Update: {
          child_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          updated_at?: string
          used?: boolean | null
        }
        Relationships: []
      }
      child_pack_assignments: {
        Row: {
          assigned_by: string | null
          child_id: string
          created_at: string
          id: string
          pack_id: string
        }
        Insert: {
          assigned_by?: string | null
          child_id: string
          created_at?: string
          id?: string
          pack_id: string
        }
        Update: {
          assigned_by?: string | null
          child_id?: string
          created_at?: string
          id?: string
          pack_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_pack_assignments_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      child_template_assignments: {
        Row: {
          assigned_by: string | null
          child_id: string
          created_at: string
          id: string
          storage_ref: string
        }
        Insert: {
          assigned_by?: string | null
          child_id: string
          created_at?: string
          id?: string
          storage_ref: string
        }
        Update: {
          assigned_by?: string | null
          child_id?: string
          created_at?: string
          id?: string
          storage_ref?: string
        }
        Relationships: []
      }
      entitlements_catalog: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          label: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      family_relationships: {
        Row: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          parent_id: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          parent_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          artwork_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artwork_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artwork_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "trending_artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "user_recent_artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_steps: {
        Row: {
          created_at: string
          guide: Json | null
          hints: Json | null
          id: string
          lesson_id: string
          order_index: number
          rubric: Json | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guide?: Json | null
          hints?: Json | null
          id: string
          lesson_id: string
          order_index: number
          rubric?: Json | null
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guide?: Json | null
          hints?: Json | null
          id?: string
          lesson_id?: string
          order_index?: number
          rubric?: Json | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_steps_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          artwork_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          artwork_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          artwork_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "trending_artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "user_recent_artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_items: {
        Row: {
          created_at: string
          id: string
          kind: string
          metadata: Json | null
          pack_id: string
          position: number
          ref_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          metadata?: Json | null
          pack_id: string
          position?: number
          ref_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json | null
          pack_id?: string
          position?: number
          ref_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_items_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_purchases: {
        Row: {
          id: string
          pack_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          pack_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          pack_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_purchases_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      packs: {
        Row: {
          cover_path: string | null
          created_at: string
          description_i18n: Json | null
          id: string
          is_free: boolean
          rating_avg: number
          rating_count: number
          slug: string
          tags: string[]
          title: string
          title_i18n: Json | null
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          description_i18n?: Json | null
          id?: string
          is_free?: boolean
          rating_avg?: number
          rating_count?: number
          slug: string
          tags?: string[]
          title: string
          title_i18n?: Json | null
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          description_i18n?: Json | null
          id?: string
          is_free?: boolean
          rating_avg?: number
          rating_count?: number
          slug?: string
          tags?: string[]
          title?: string
          title_i18n?: Json | null
        }
        Relationships: []
      }
      parent_pins: {
        Row: {
          created_at: string
          failed_attempts: number | null
          last_used_at: string | null
          locked_until: string | null
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number | null
          last_used_at?: string | null
          locked_until?: string | null
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number | null
          last_used_at?: string | null
          locked_until?: string | null
          pin_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthdate: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: unknown
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: unknown
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          id: string
          image_path: string
          is_free: boolean
          rating_avg: number
          rating_count: number
          required_entitlement: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path: string
          is_free?: boolean
          rating_avg?: number
          rating_count?: number
          required_entitlement?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          is_free?: boolean
          rating_avg?: number
          rating_count?: number
          required_entitlement?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      tutorial_steps: {
        Row: {
          created_at: string
          id: string
          order_index: number
          step: Json
          tutorial_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          order_index: number
          step: Json
          tutorial_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          step?: Json
          tutorial_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_steps_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorials: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      upload_logs: {
        Row: {
          block_reason: string | null
          created_at: string
          file_size: number
          file_type: string
          id: string
          ip_address: unknown
          user_id: string | null
          was_blocked: boolean
        }
        Insert: {
          block_reason?: string | null
          created_at?: string
          file_size: number
          file_type: string
          id?: string
          ip_address: unknown
          user_id?: string | null
          was_blocked: boolean
        }
        Update: {
          block_reason?: string | null
          created_at?: string
          file_size?: number
          file_type?: string
          id?: string
          ip_address?: unknown
          user_id?: string | null
          was_blocked?: boolean
        }
        Relationships: []
      }
      upload_restrictions: {
        Row: {
          block_reason: string | null
          created_at: string
          expires_at: string | null
          id: string
          ip_address: unknown
          is_blocked: boolean | null
          updated_at: string
        }
        Insert: {
          block_reason?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address: unknown
          is_blocked?: boolean | null
          updated_at?: string
        }
        Update: {
          block_reason?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_blocked?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: string
          artwork_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          artwork_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          artwork_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "trending_artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "user_recent_artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          pages_read: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          pages_read?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          pages_read?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_entitlements: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          lesson_id: string
          passed_steps: number
          stars: number
          step_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          lesson_id: string
          passed_steps?: number
          stars?: number
          step_index?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          lesson_id?: string
          passed_steps?: number
          stars?: number
          step_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ratings: {
        Row: {
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tutorial_progress: {
        Row: {
          passed_steps: number
          stars: number
          step_index: number
          tutorial_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          passed_steps?: number
          stars?: number
          step_index?: number
          tutorial_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          passed_steps?: number
          stars?: number
          step_index?: number
          tutorial_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tutorial_progress_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      trending_artworks: {
        Row: {
          created_at: string | null
          description: string | null
          height: number | null
          id: string | null
          image_url: string | null
          is_featured: boolean | null
          is_public: boolean | null
          like_count: number | null
          like_count_7d: number | null
          thumbnail_url: string | null
          title: string | null
          trending_score: number | null
          updated_at: string | null
          user_avatar_url: string | null
          user_id: string | null
          username: string | null
          view_count: number | null
          view_count_7d: number | null
          width: number | null
        }
        Relationships: []
      }
      user_recent_artworks: {
        Row: {
          created_at: string | null
          description: string | null
          height: number | null
          id: string | null
          image_url: string | null
          is_featured: boolean | null
          is_public: boolean | null
          last_visited_at: string | null
          like_count: number | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          user_avatar_url: string | null
          user_id: string | null
          username: string | null
          view_count: number | null
          visit_count: number | null
          width: number | null
        }
        Relationships: []
      }
      weekly_progress: {
        Row: {
          last_activity: string | null
          last_updated: string | null
          total_minutes: number | null
          total_pages: number | null
          total_sessions: number | null
          user_id: string | null
          week_start: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_parent_auth: { Args: never; Returns: boolean }
      check_rate_limit: {
        Args: {
          action_type: string
          max_attempts: number
          time_window: string
          user_id_param: string
        }
        Returns: boolean
      }
      get_user_role: { Args: never; Returns: string }
      handle_file_upload: {
        Args: {
          file_hash: string
          file_name: string
          file_size: number
          file_type: string
          max_size_mb?: number
          user_id_param?: string
          user_ip: unknown
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_artwork_owner: { Args: { artwork_id: string }; Returns: boolean }
      is_ip_blocked: { Args: { ip: unknown }; Returns: boolean }
      is_parent_of: { Args: { child_id_param: string }; Returns: boolean }
      log_upload_attempt: {
        Args: {
          block_reason?: string
          file_size: number
          file_type: string
          ip_param: unknown
          user_id_param: string
          was_blocked?: boolean
        }
        Returns: undefined
      }
      recompute_carousel_rating: { Args: { c_id: string }; Returns: undefined }
      recompute_pack_rating: { Args: { p_id: string }; Returns: undefined }
      recompute_template_rating: { Args: { t_id: string }; Returns: undefined }
      user_has_any_entitlement: { Args: never; Returns: boolean }
      user_has_entitlement: { Args: { ent: string }; Returns: boolean }
      validate_upload: {
        Args: {
          allowed_types?: string[]
          file_size: number
          file_type: string
          max_size_mb?: number
        }
        Returns: Json
      }
    }
    Enums: {
      entity_type: "pack" | "template" | "carousel"
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
  public: {
    Enums: {
      entity_type: ["pack", "template", "carousel"],
    },
  },
} as const
