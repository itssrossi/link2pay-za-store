export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      invoice_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          quantity: number
          title: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          quantity?: number
          title: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          quantity?: number
          title?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_reminders: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          sent_at: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          sent_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          auto_reminder_enabled: boolean | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          delivery_address: string | null
          delivery_date: string | null
          delivery_fee: number | null
          delivery_method: string | null
          delivery_notes: string | null
          id: string
          invoice_number: string
          payment_enabled: boolean | null
          payment_instructions: string | null
          reminder_sent_at: string | null
          show_payfast: boolean | null
          show_snapscan: boolean | null
          status: string | null
          subtotal: number
          total_amount: number
          updated_at: string
          user_id: string
          vat_amount: number | null
          vat_enabled: boolean | null
          whatsapp_paid_sent: boolean | null
        }
        Insert: {
          auto_reminder_enabled?: boolean | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_fee?: number | null
          delivery_method?: string | null
          delivery_notes?: string | null
          id?: string
          invoice_number: string
          payment_enabled?: boolean | null
          payment_instructions?: string | null
          reminder_sent_at?: string | null
          show_payfast?: boolean | null
          show_snapscan?: boolean | null
          status?: string | null
          subtotal: number
          total_amount: number
          updated_at?: string
          user_id: string
          vat_amount?: number | null
          vat_enabled?: boolean | null
          whatsapp_paid_sent?: boolean | null
        }
        Update: {
          auto_reminder_enabled?: boolean | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_fee?: number | null
          delivery_method?: string | null
          delivery_notes?: string | null
          id?: string
          invoice_number?: string
          payment_enabled?: boolean | null
          payment_instructions?: string | null
          reminder_sent_at?: string | null
          show_payfast?: boolean | null
          show_snapscan?: boolean | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number | null
          vat_enabled?: boolean | null
          whatsapp_paid_sent?: boolean | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string | null
          id: string
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_whatsapp_number: string | null
          updated_at: string | null
          whatsapp_api_token: string | null
          whatsapp_phone_id: string | null
          zoko_api_key: string | null
          zoko_base_url: string | null
          zoko_business_phone: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_whatsapp_number?: string | null
          updated_at?: string | null
          whatsapp_api_token?: string | null
          whatsapp_phone_id?: string | null
          zoko_api_key?: string | null
          zoko_base_url?: string | null
          zoko_business_phone?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_whatsapp_number?: string | null
          updated_at?: string | null
          whatsapp_api_token?: string | null
          whatsapp_phone_id?: string | null
          zoko_api_key?: string | null
          zoko_base_url?: string | null
          zoko_business_phone?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          delivery_method: string | null
          description: string | null
          id: string
          image_url: string | null
          inventory_enabled: boolean | null
          is_active: boolean
          price: number
          product_id: string | null
          stock_quantity: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          delivery_method?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          inventory_enabled?: boolean | null
          is_active?: boolean
          price: number
          product_id?: string | null
          stock_quantity?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          delivery_method?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          inventory_enabled?: boolean | null
          is_active?: boolean
          price?: number
          product_id?: string | null
          stock_quantity?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accent_color: string | null
          background_color: string | null
          billing_failures: number | null
          billing_start_date: string | null
          business_name: string | null
          cancelled_at: string | null
          capitec_paylink: string | null
          created_at: string
          customization_version: number | null
          default_currency: string | null
          delivery_method: string | null
          delivery_note: string | null
          discount_applied: boolean | null
          eft_details: string | null
          full_name: string | null
          has_active_subscription: boolean | null
          header_banner_url: string | null
          hero_cta_link: string | null
          hero_cta_text: string | null
          hero_headline: string | null
          hero_image_url: string | null
          hero_subheading: string | null
          id: string
          last_customized_at: string | null
          logo_url: string | null
          onboarding_completed: boolean | null
          payfast_link: string | null
          payment_method: string | null
          paystack_customer_code: string | null
          primary_color: string | null
          show_capitec: boolean | null
          snapscan_link: string | null
          store_address: string | null
          store_bio: string | null
          store_font: string | null
          store_handle: string | null
          store_layout: string | null
          store_location: string | null
          store_visibility: boolean | null
          subscription_price: number | null
          theme_preset: string | null
          trial_ends_at: string | null
          trial_used: boolean | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          billing_failures?: number | null
          billing_start_date?: string | null
          business_name?: string | null
          cancelled_at?: string | null
          capitec_paylink?: string | null
          created_at?: string
          customization_version?: number | null
          default_currency?: string | null
          delivery_method?: string | null
          delivery_note?: string | null
          discount_applied?: boolean | null
          eft_details?: string | null
          full_name?: string | null
          has_active_subscription?: boolean | null
          header_banner_url?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_headline?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          id: string
          last_customized_at?: string | null
          logo_url?: string | null
          onboarding_completed?: boolean | null
          payfast_link?: string | null
          payment_method?: string | null
          paystack_customer_code?: string | null
          primary_color?: string | null
          show_capitec?: boolean | null
          snapscan_link?: string | null
          store_address?: string | null
          store_bio?: string | null
          store_font?: string | null
          store_handle?: string | null
          store_layout?: string | null
          store_location?: string | null
          store_visibility?: boolean | null
          subscription_price?: number | null
          theme_preset?: string | null
          trial_ends_at?: string | null
          trial_used?: boolean | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          billing_failures?: number | null
          billing_start_date?: string | null
          business_name?: string | null
          cancelled_at?: string | null
          capitec_paylink?: string | null
          created_at?: string
          customization_version?: number | null
          default_currency?: string | null
          delivery_method?: string | null
          delivery_note?: string | null
          discount_applied?: boolean | null
          eft_details?: string | null
          full_name?: string | null
          has_active_subscription?: boolean | null
          header_banner_url?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_headline?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          id?: string
          last_customized_at?: string | null
          logo_url?: string | null
          onboarding_completed?: boolean | null
          payfast_link?: string | null
          payment_method?: string | null
          paystack_customer_code?: string | null
          primary_color?: string | null
          show_capitec?: boolean | null
          snapscan_link?: string | null
          store_address?: string | null
          store_bio?: string | null
          store_font?: string | null
          store_handle?: string | null
          store_layout?: string | null
          store_location?: string | null
          store_visibility?: boolean | null
          subscription_price?: number | null
          theme_preset?: string | null
          trial_ends_at?: string | null
          trial_used?: boolean | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          discount_amount: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_amount: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_amount?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Relationships: []
      }
      store_sections: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean | null
          section_content: string | null
          section_order: number | null
          section_settings: Json | null
          section_title: string | null
          section_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          section_content?: string | null
          section_order?: number | null
          section_settings?: Json | null
          section_title?: string | null
          section_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          section_content?: string | null
          section_order?: number | null
          section_settings?: Json | null
          section_title?: string | null
          section_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          payfast_payment_id: string | null
          reference: string | null
          status: string
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          payfast_payment_id?: string | null
          reference?: string | null
          status?: string
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          payfast_payment_id?: string | null
          reference?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          next_billing_date: string | null
          paystack_plan_code: string | null
          paystack_subscription_code: string | null
          promo_applied: boolean | null
          start_date: string | null
          status: string
          trial_end_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          next_billing_date?: string | null
          paystack_plan_code?: string | null
          paystack_subscription_code?: string | null
          promo_applied?: boolean | null
          start_date?: string | null
          status?: string
          trial_end_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          next_billing_date?: string | null
          paystack_plan_code?: string | null
          paystack_subscription_code?: string | null
          promo_applied?: boolean | null
          start_date?: string | null
          status?: string
          trial_end_date?: string | null
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
      delete_user_completely: {
        Args: { p_uid: string }
        Returns: undefined
      }
      generate_product_id: {
        Args: Record<PropertyKey, never>
        Returns: string
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
    Enums: {},
  },
} as const
