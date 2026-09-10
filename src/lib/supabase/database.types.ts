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
      accounts: {
        Row: {
          business_id: string
          code: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          subtype: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
        }
        Insert: {
          business_id: string
          code: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          subtype?: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          code?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          subtype?: string
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      allocations: {
        Row: {
          allocation_date: string
          amount: number
          created_at: string
          id: string
          note: string | null
          type: Database["public"]["Enums"]["allocation_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          allocation_date?: string
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          type: Database["public"]["Enums"]["allocation_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          allocation_date?: string
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          type?: Database["public"]["Enums"]["allocation_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["business_member_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["business_member_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["business_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          accounting_basis: Database["public"]["Enums"]["accounting_basis"]
          business_type: Database["public"]["Enums"]["business_type"]
          created_at: string
          currency: string
          financial_year_start_month: number
          id: string
          industry: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          accounting_basis?: Database["public"]["Enums"]["accounting_basis"]
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          currency?: string
          financial_year_start_month?: number
          id?: string
          industry?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          accounting_basis?: Database["public"]["Enums"]["accounting_basis"]
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          currency?: string
          financial_year_start_month?: number
          id?: string
          industry?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_default: boolean
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_read: boolean
          message: string
          period_end: string | null
          period_start: string | null
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          period_end?: string | null
          period_start?: string | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          period_end?: string | null
          period_start?: string | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allocation_target: number
          created_at: string
          currency: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          allocation_target?: number
          created_at?: string
          currency?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          allocation_target?: number
          created_at?: string
          currency?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          id: string
          note: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          id?: string
          note?: string | null
          transaction_date?: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          id?: string
          note?: string | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_own_account: { Args: never; Returns: undefined }
      generate_weekly_report_notifications: { Args: never; Returns: undefined }
      is_business_member: {
        Args: { target_business_id: string }
        Returns: boolean
      }
      seed_starter_chart_of_accounts: {
        Args: { target_business_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
      accounting_basis: "CASH" | "ACCRUAL"
      allocation_type: "SAVING" | "INVESTMENT"
      business_member_role:
        | "OWNER"
        | "ACCOUNTANT"
        | "MANAGER"
        | "SALES"
        | "CASHIER"
      business_type:
        | "RETAIL"
        | "RESTAURANT"
        | "CONSULTING"
        | "FREELANCER"
        | "CONSTRUCTION"
        | "SERVICES"
        | "MANUFACTURING"
        | "OTHER"
      notification_type: "WEEKLY_REPORT" | "PASSWORD_RESET"
      transaction_type: "INCOME" | "EXPENSE"
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
      account_type: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"],
      accounting_basis: ["CASH", "ACCRUAL"],
      allocation_type: ["SAVING", "INVESTMENT"],
      business_member_role: [
        "OWNER",
        "ACCOUNTANT",
        "MANAGER",
        "SALES",
        "CASHIER",
      ],
      business_type: [
        "RETAIL",
        "RESTAURANT",
        "CONSULTING",
        "FREELANCER",
        "CONSTRUCTION",
        "SERVICES",
        "MANUFACTURING",
        "OTHER",
      ],
      notification_type: ["WEEKLY_REPORT", "PASSWORD_RESET"],
      transaction_type: ["INCOME", "EXPENSE"],
    },
  },
} as const
