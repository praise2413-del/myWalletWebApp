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
          business_type_other: string
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
          business_type_other?: string
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
          business_type_other?: string
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
      customers: {
        Row: {
          address: string
          business_id: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          notes: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string
          business_id: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          business_id?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          id: string
          reference: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          description: string
          entry_date: string
          id?: string
          reference?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          id?: string
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          business_id: string
          created_at: string
          credit: number
          debit: number
          id: string
          journal_entry_id: string
          line_order: number
        }
        Insert: {
          account_id: string
          business_id: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id: string
          line_order?: number
        }
        Update: {
          account_id?: string
          business_id?: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id?: string
          line_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
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
      products: {
        Row: {
          business_id: string
          cost_price: number
          created_at: string
          description: string
          expense_account_id: string
          id: string
          income_account_id: string
          is_active: boolean
          name: string
          quantity_on_hand: number
          sku: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          business_id: string
          cost_price?: number
          created_at?: string
          description?: string
          expense_account_id: string
          id?: string
          income_account_id: string
          is_active?: boolean
          name: string
          quantity_on_hand?: number
          sku?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          cost_price?: number
          created_at?: string
          description?: string
          expense_account_id?: string
          id?: string
          income_account_id?: string
          is_active?: boolean
          name?: string
          quantity_on_hand?: number
          sku?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_expense_account_id_fkey"
            columns: ["expense_account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "products_expense_account_id_fkey"
            columns: ["expense_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_income_account_id_fkey"
            columns: ["income_account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "products_income_account_id_fkey"
            columns: ["income_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
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
      purchase_lines: {
        Row: {
          business_id: string
          created_at: string
          id: string
          line_order: number
          line_total: number
          product_id: string
          purchase_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          line_order?: number
          line_total: number
          product_id: string
          purchase_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          line_order?: number
          line_total?: number
          product_id?: string
          purchase_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_lines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_lines_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_payments: {
        Row: {
          account_id: string
          amount: number
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          journal_entry_id: string | null
          payment_date: string
          purchase_id: string
        }
        Insert: {
          account_id: string
          amount: number
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          payment_date: string
          purchase_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          payment_date?: string
          purchase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "purchase_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          bill_date: string
          bill_number: string
          business_id: string
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          journal_entry_id: string | null
          notes: string
          supplier_id: string | null
        }
        Insert: {
          bill_date: string
          bill_number?: string
          business_id: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string
          supplier_id?: string | null
        }
        Update: {
          bill_date?: string
          bill_number?: string
          business_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_lines: {
        Row: {
          business_id: string
          created_at: string
          id: string
          line_order: number
          line_total: number
          product_id: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          line_order?: number
          line_total: number
          product_id: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          line_order?: number
          line_total?: number
          product_id?: string
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_lines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payments: {
        Row: {
          account_id: string
          amount: number
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          journal_entry_id: string | null
          payment_date: string
          sale_id: string
        }
        Insert: {
          account_id: string
          amount: number
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          payment_date: string
          sale_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          payment_date?: string
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "sale_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          journal_entry_id: string | null
          notes: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number?: string
          journal_entry_id?: string | null
          notes?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          journal_entry_id?: string | null
          notes?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string
          business_id: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          notes: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string
          business_id: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          business_id?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      account_balances: {
        Row: {
          account_id: string | null
          balance: number | null
          business_id: string | null
          code: string | null
          name: string | null
          total_credit: number | null
          total_debit: number | null
          type: Database["public"]["Enums"]["account_type"] | null
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
    }
    Functions: {
      _post_journal_lines: {
        Args: {
          p_business_id: string
          p_created_by: string
          p_description: string
          p_entry_date: string
          p_lines: Json
          p_reference: string
        }
        Returns: string
      }
      create_journal_entry: {
        Args: {
          p_business_id: string
          p_description: string
          p_entry_date: string
          p_lines: Json
          p_reference: string
        }
        Returns: string
      }
      create_purchase_bill: {
        Args: {
          p_bill_date: string
          p_bill_number: string
          p_business_id: string
          p_due_date: string
          p_lines: Json
          p_notes: string
          p_supplier_id: string
        }
        Returns: string
      }
      create_sale_invoice: {
        Args: {
          p_business_id: string
          p_customer_id: string
          p_due_date: string
          p_invoice_date: string
          p_invoice_number: string
          p_lines: Json
          p_notes: string
        }
        Returns: string
      }
      delete_own_account: { Args: never; Returns: undefined }
      generate_weekly_report_notifications: { Args: never; Returns: undefined }
      is_business_member: {
        Args: { target_business_id: string }
        Returns: boolean
      }
      record_purchase_payment: {
        Args: {
          p_account_id: string
          p_amount: number
          p_payment_date: string
          p_purchase_id: string
        }
        Returns: string
      }
      record_sale_payment: {
        Args: {
          p_account_id: string
          p_amount: number
          p_payment_date: string
          p_sale_id: string
        }
        Returns: string
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
