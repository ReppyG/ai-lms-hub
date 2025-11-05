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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          prompt: string
          result: Json | null
          scheduled_for: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["agent_task_status"]
          task_type: Database["public"]["Enums"]["agent_task_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          prompt: string
          result?: Json | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_task_status"]
          task_type: Database["public"]["Enums"]["agent_task_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          prompt?: string
          result?: Json | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_task_status"]
          task_type?: Database["public"]["Enums"]["agent_task_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_workflows: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          last_run_at: string | null
          name: string
          schedule_cron: string | null
          steps: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name: string
          schedule_cron?: string | null
          steps?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name?: string
          schedule_cron?: string | null
          steps?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assignment_completions: {
        Row: {
          assignment_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      canvas_credentials: {
        Row: {
          api_token: string
          canvas_url: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_token: string
          canvas_url: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_token?: string
          canvas_url?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_bookmarks: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message_id: string | null
          note: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message_id?: string | null
          note?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message_id?: string | null
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_bookmarks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_bookmarks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          image_data: string
          model: string | null
          prompt: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_data: string
          model?: string | null
          prompt: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_data?: string
          model?: string | null
          prompt?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          assignment_id: string | null
          audio_url: string | null
          content: string | null
          created_at: string
          duration: number | null
          id: string
          title: string
          transcription: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          audio_url?: string | null
          content?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          title: string
          transcription?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          audio_url?: string | null
          content?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          title?: string
          transcription?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_tasks: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          parameters: Json | null
          schedule_cron: string
          task_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          parameters?: Json | null
          schedule_cron: string
          task_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          parameters?: Json | null
          schedule_cron?: string
          task_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          ai_tools_used: string[] | null
          assignment_name: string | null
          course_name: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          topics_covered: string[] | null
          user_id: string
        }
        Insert: {
          ai_tools_used?: string[] | null
          assignment_name?: string | null
          course_name?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          topics_covered?: string[] | null
          user_id: string
        }
        Update: {
          ai_tools_used?: string[] | null
          assignment_name?: string | null
          course_name?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          topics_covered?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          action_type: string
          cost: number | null
          created_at: string
          id: string
          metadata: Json | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          cost?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          cost?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          custom_instructions: string | null
          enable_memory: boolean | null
          enable_proactive_suggestions: boolean | null
          id: string
          max_tokens: number | null
          preferred_model: string | null
          preferred_voice: string | null
          temperature: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_instructions?: string | null
          enable_memory?: boolean | null
          enable_proactive_suggestions?: boolean | null
          id?: string
          max_tokens?: number | null
          preferred_model?: string | null
          preferred_voice?: string | null
          temperature?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_instructions?: string | null
          enable_memory?: boolean | null
          enable_proactive_suggestions?: boolean | null
          id?: string
          max_tokens?: number | null
          preferred_model?: string | null
          preferred_voice?: string | null
          temperature?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          result: Json | null
          started_at: string
          status: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          result?: Json | null
          started_at?: string
          status?: string
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          result?: Json | null
          started_at?: string
          status?: string
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "ai_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_unique_user_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      agent_task_status: "pending" | "running" | "completed" | "failed"
      agent_task_type:
        | "study_plan"
        | "summarize_notes"
        | "generate_quiz"
        | "solve_problem"
        | "create_flashcards"
        | "analyze_assignments"
        | "analyze"
        | "summarize"
        | "outline"
      user_role: "free" | "premium" | "admin"
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
      agent_task_status: ["pending", "running", "completed", "failed"],
      agent_task_type: [
        "study_plan",
        "summarize_notes",
        "generate_quiz",
        "solve_problem",
        "create_flashcards",
        "analyze_assignments",
        "analyze",
        "summarize",
        "outline",
      ],
      user_role: ["free", "premium", "admin"],
    },
  },
} as const
