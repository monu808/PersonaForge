export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      live_events: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number
          end_time: string | null
          host_name: string
          host_replica_id: string | null
          host_user_id: string
          id: string
          max_participants: number | null
          participants: string[] | null
          room_url: string | null
          start_time: string
          status: string
          title: string
          type: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration: number
          end_time?: string | null
          host_name: string
          host_replica_id?: string | null
          host_user_id: string
          id: string
          max_participants?: number | null
          participants?: string[] | null
          room_url?: string | null
          start_time: string
          status: string
          title: string
          type: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number
          end_time?: string | null
          host_name?: string
          host_replica_id?: string | null
          host_user_id?: string
          id?: string
          max_participants?: number | null
          participants?: string[] | null
          room_url?: string | null
          start_time?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          visibility?: string
        }
        Relationships: []
      }
      persona_content: {
        Row: {
          content: string
          content_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          persona_id: string | null
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          persona_id?: string | null
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          persona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_content_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      persona_services: {
        Row: {
          auto_delivery: boolean | null
          created_at: string | null
          creator_wallet: string
          delivery_content: string | null
          delivery_url: string | null
          description: string
          duration_minutes: number | null
          file_type: string | null
          id: string
          is_active: boolean | null
          persona_id: string
          price_algo: number
          price_usd: number
          service_name: string
          service_type: string
          uploaded_file: string | null
        }
        Insert: {
          auto_delivery?: boolean | null
          created_at?: string | null
          creator_wallet: string
          delivery_content?: string | null
          delivery_url?: string | null
          description: string
          duration_minutes?: number | null
          file_type?: string | null
          id: string
          is_active?: boolean | null
          persona_id: string
          price_algo: number
          price_usd: number
          service_name: string
          service_type: string
          uploaded_file?: string | null
        }
        Update: {
          auto_delivery?: boolean | null
          created_at?: string | null
          creator_wallet?: string
          delivery_content?: string | null
          delivery_url?: string | null
          description?: string
          duration_minutes?: number | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          persona_id?: string
          price_algo?: number
          price_usd?: number
          service_name?: string
          service_type?: string
          uploaded_file?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_services_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          attributes: Json | null
          created_at: string | null
          creator_wallet_address: string | null
          description: string | null
          id: string
          name: string
          nft_asset_id: number | null
          replica_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string | null
          creator_wallet_address?: string | null
          description?: string | null
          id?: string
          name: string
          nft_asset_id?: number | null
          replica_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string | null
          creator_wallet_address?: string | null
          description?: string | null
          id?: string
          name?: string
          nft_asset_id?: number | null
          replica_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      phone_verification: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          last_attempt: string | null
          locked_until: string | null
          phone: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          locked_until?: string | null
          phone: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          locked_until?: string | null
          phone?: string
        }
        Relationships: []
      }
      podcasts: {
        Row: {
          audio_url: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          host1_voice_id: string
          host1_voice_name: string | null
          host2_voice_id: string
          host2_voice_name: string | null
          id: string
          metadata: Json | null
          script: string
          status: string | null
          title: string
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          host1_voice_id: string
          host1_voice_name?: string | null
          host2_voice_id: string
          host2_voice_name?: string | null
          id?: string
          metadata?: Json | null
          script: string
          status?: string | null
          title: string
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          host1_voice_id?: string
          host1_voice_name?: string | null
          host2_voice_id?: string
          host2_voice_name?: string | null
          id?: string
          metadata?: Json | null
          script?: string
          status?: string | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_deliveries: {
        Row: {
          content_text: string | null
          content_url: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_status: string
          delivery_type: string
          download_count: number | null
          expires_at: string | null
          id: string
          max_downloads: number | null
          purchase_id: string
          service_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_text?: string | null
          content_url?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string
          delivery_type: string
          download_count?: number | null
          expires_at?: string | null
          id?: string
          max_downloads?: number | null
          purchase_id: string
          service_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_text?: string | null
          content_url?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string
          delivery_type?: string
          download_count?: number | null
          expires_at?: string | null
          id?: string
          max_downloads?: number | null
          purchase_id?: string
          service_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_deliveries_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "service_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_deliveries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "persona_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_purchases: {
        Row: {
          amount_algo: number
          amount_usd: number
          buyer_id: string | null
          buyer_wallet: string
          completion_date: string | null
          created_at: string | null
          id: string
          notes: string | null
          purchase_date: string | null
          seller_wallet: string
          service_id: string
          status: string
          transaction_id: string
        }
        Insert: {
          amount_algo: number
          amount_usd: number
          buyer_id?: string | null
          buyer_wallet: string
          completion_date?: string | null
          created_at?: string | null
          id: string
          notes?: string | null
          purchase_date?: string | null
          seller_wallet: string
          service_id: string
          status: string
          transaction_id: string
        }
        Update: {
          amount_algo?: number
          amount_usd?: number
          buyer_id?: string | null
          buyer_wallet?: string
          completion_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string | null
          seller_wallet?: string
          service_id?: string
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_purchases_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "persona_services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_persona_access: {
        Row: {
          access_expires_at: string | null
          access_granted_at: string | null
          access_type: string
          created_at: string | null
          id: string
          max_usage: number | null
          persona_id: string
          purchase_id: string
          service_id: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          access_type?: string
          created_at?: string | null
          id?: string
          max_usage?: number | null
          persona_id: string
          purchase_id: string
          service_id: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          access_type?: string
          created_at?: string | null
          id?: string
          max_usage?: number | null
          persona_id?: string
          purchase_id?: string
          service_id?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_persona_access_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_persona_access_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "service_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_persona_access_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "persona_services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          phone_verified: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          phone_verified?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          profile_visibility: string | null
          tavus_replica_id: string | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          profile_visibility?: string | null
          tavus_replica_id?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          profile_visibility?: string | null
          tavus_replica_id?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          canceled_at: string | null
          checkout_session_id: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          last_payment_date: string | null
          payment_failed: boolean | null
          plan_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          checkout_session_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_date?: string | null
          payment_failed?: boolean | null
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          checkout_session_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_payment_date?: string | null
          payment_failed?: boolean | null
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          live_conversation_minutes_used: number | null
          personas_created: number | null
          text_to_speech_used: number | null
          updated_at: string | null
          user_id: string
          voice_clones_created: number | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          live_conversation_minutes_used?: number | null
          personas_created?: number | null
          text_to_speech_used?: number | null
          updated_at?: string | null
          user_id: string
          voice_clones_created?: number | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          live_conversation_minutes_used?: number | null
          personas_created?: number | null
          text_to_speech_used?: number | null
          updated_at?: string | null
          user_id?: string
          voice_clones_created?: number | null
        }
        Relationships: []
      }
      user_voices: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_cloned: boolean | null
          metadata: Json | null
          name: string
          platform: string
          updated_at: string | null
          user_id: string
          voice_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_cloned?: boolean | null
          metadata?: Json | null
          name: string
          platform?: string
          updated_at?: string | null
          user_id: string
          voice_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_cloned?: boolean | null
          metadata?: Json | null
          name?: string
          platform?: string
          updated_at?: string | null
          user_id?: string
          voice_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_login: string | null
          location: string | null
          role: string | null
          social_links: Json | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          location?: string | null
          role?: string | null
          social_links?: Json | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          location?: string | null
          role?: string | null
          social_links?: Json | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_monthly_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
