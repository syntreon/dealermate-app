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
      app_settings: {
        Row: {
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          id: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          id: string
          client_id: string
          call_type: string
          call_start_time: string
          call_end_time: string
          call_duration_seconds: number
          call_duration_mins: number | null
          call_summary: string | null
          caller_full_name: string | null
          caller_phone_number: string | null
          to_phone_number: string | null
          transcript: string
          recording_url: string | null
          hangup_reason: string | null
          assistant_id: string | null
          transfer_flag: boolean
          created_at: string
          twillio_call_cost_usd: number
          vapi_call_cost_usd: number
          vapi_llm_cost_usd: number
          openai_api_cost_usd: number
          openai_api_tokens_input: number
          openai_api_tokens_output: number
          sms_cost_usd: number
          tool_cost_usd: number
          total_call_cost_usd: number
          total_cost_cad: number | null
        }
        Insert: {
          id?: string
          client_id: string
          call_type: string
          call_start_time: string
          call_end_time: string
          call_duration_seconds: number
          call_duration_mins?: number | null
          call_summary?: string | null
          caller_full_name?: string | null
          caller_phone_number?: string | null
          to_phone_number?: string | null
          transcript: string
          recording_url?: string | null
          hangup_reason?: string | null
          assistant_id?: string | null
          transfer_flag?: boolean
          created_at?: string
          twillio_call_cost_usd?: number
          vapi_call_cost_usd?: number
          vapi_llm_cost_usd?: number
          openai_api_cost_usd?: number
          openai_api_tokens_input?: number
          openai_api_tokens_output?: number
          sms_cost_usd?: number
          tool_cost_usd?: number
          total_call_cost_usd?: number
          total_cost_cad?: number | null
        }
        Update: {
          id?: string
          client_id?: string
          call_type?: string
          call_start_time?: string
          call_end_time?: string
          call_duration_seconds?: number
          call_duration_mins?: number | null
          call_summary?: string | null
          caller_full_name?: string | null
          caller_phone_number?: string | null
          to_phone_number?: string | null
          transcript?: string
          recording_url?: string | null
          hangup_reason?: string | null
          assistant_id?: string | null
          transfer_flag?: boolean
          created_at?: string
          twillio_call_cost_usd?: number
          vapi_call_cost_usd?: number
          vapi_llm_cost_usd?: number
          openai_api_cost_usd?: number
          openai_api_tokens_input?: number
          openai_api_tokens_output?: number
          sms_cost_usd?: number
          tool_cost_usd?: number
          total_call_cost_usd?: number
          total_cost_cad?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          name: string
          slug: string
          phone_number: string | null
          contact_person: string | null
          contact_email: string | null
          billing_address: string | null
          subscription_plan: string
          monthly_billing_amount_cad: number
          status: string
          type: string
          joined_at: string
          last_active_at: string | null
          config_json: Json
          average_monthly_ai_cost_usd: number
          average_monthly_misc_cost_usd: number
          finders_fee_cad: number
          partner_split_percentage: number
        }
        Insert: {
          id?: string
          name: string
          slug?: string
          phone_number?: string | null
          contact_person?: string | null
          contact_email?: string | null
          billing_address?: string | null
          subscription_plan: string
          monthly_billing_amount_cad: number
          status?: string
          type: string
          joined_at?: string
          last_active_at?: string | null
          config_json?: Json
          average_monthly_ai_cost_usd?: number
          average_monthly_misc_cost_usd?: number
          finders_fee_cad?: number
          partner_split_percentage?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          phone_number?: string | null
          contact_person?: string | null
          contact_email?: string | null
          billing_address?: string | null
          subscription_plan?: string
          monthly_billing_amount_cad?: number
          status?: string
          type?: string
          joined_at?: string
          last_active_at?: string | null
          config_json?: Json
          average_monthly_ai_cost_usd?: number
          average_monthly_misc_cost_usd?: number
          finders_fee_cad?: number
          partner_split_percentage?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          client_id: string
          call_id: string
          full_name: string | null
          first_name: string | null
          last_name: string | null
          phone_number: string | null
          from_phone_number: string | null
          email: string | null
          lead_status: string
          callback_timing_captured: boolean | null
          callback_timing_value: string | null
          appointment_confirmed_at: string | null
          sent_to_client_at: string | null
          created_at: string
          custom_lead_data: Json | null
        }
        Insert: {
          id?: string
          client_id: string
          call_id: string
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          from_phone_number?: string | null
          email?: string | null
          lead_status: string
          callback_timing_captured?: boolean | null
          callback_timing_value?: string | null
          appointment_confirmed_at?: string | null
          sent_to_client_at?: string | null
          created_at?: string
          custom_lead_data?: Json | null
        }
        Update: {
          id?: string
          client_id?: string
          call_id?: string
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          from_phone_number?: string | null
          email?: string | null
          lead_status?: string
          callback_timing_captured?: boolean | null
          callback_timing_value?: string | null
          appointment_confirmed_at?: string | null
          sent_to_client_at?: string | null
          created_at?: string
          custom_lead_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          full_name: string
          role: string
          client_id: string | null
          last_login_at: string | null
          preferences: Json | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          full_name: string
          role: string
          client_id?: string | null
          last_login_at?: string | null
          preferences?: Json | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          full_name?: string
          role?: string
          client_id?: string | null
          last_login_at?: string | null
          preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_status: {
        Row: {
          id: string
          client_id: string | null
          status: string
          message: string | null
          last_updated: string
          updated_by: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          status: string
          message?: string | null
          last_updated?: string
          updated_by: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          status?: string
          message?: string | null
          last_updated?: string
          updated_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_status_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_status_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      system_messages: {
        Row: {
          id: string
          client_id: string | null
          type: string
          message: string
          timestamp: string
          expires_at: string | null
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          type: string
          message: string
          timestamp?: string
          expires_at?: string | null
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          type?: string
          message?: string
          timestamp?: string
          expires_at?: string | null
          created_by?: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_messages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          client_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          client_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          client_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_with_auth: {
        Args: {
          user_email: string
          user_password: string
          user_name: string
          user_phone: string
          user_is_admin?: boolean
        }
        Returns: string
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
