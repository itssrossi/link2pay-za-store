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
          delivery_method: string | null
          id: string
          invoice_number: string
          payment_enabled: boolean | null
          payment_instructions: string | null
          reminder_sent_at: string | null
          status: string | null
          subtotal: number
          total_amount: number
          updated_at: string
          user_id: string
          vat_amount: number | null
          vat_enabled: boolean | null
        }
        Insert: {
          auto_reminder_enabled?: boolean | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          delivery_method?: string | null
          id?: string
          invoice_number: string
          payment_enabled?: boolean | null
          payment_instructions?: string | null
          reminder_sent_at?: string | null
          status?: string | null
          subtotal: number
          total_amount: number
          updated_at?: string
          user_id: string
          vat_amount?: number | null
          vat_enabled?: boolean | null
        }
        Update: {
          auto_reminder_enabled?: boolean | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          delivery_method?: string | null
          id?: string
          invoice_number?: string
          payment_enabled?: boolean | null
          payment_instructions?: string | null
          reminder_sent_at?: string | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
          vat_amount?: number | null
          vat_enabled?: boolean | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          whatsapp_api_token: string | null
          whatsapp_phone_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          whatsapp_api_token?: string | null
          whatsapp_phone_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          whatsapp_api_token?: string | null
          whatsapp_phone_id?: string | null
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
          business_name: string | null
          created_at: string
          customization_version: number | null
          default_currency: string | null
          delivery_method: string | null
          delivery_note: string | null
          eft_details: string | null
          header_banner_url: string | null
          hero_cta_link: string | null
          hero_cta_text: string | null
          hero_headline: string | null
          hero_image_url: string | null
          hero_subheading: string | null
          id: string
          last_customized_at: string | null
          logo_url: string | null
          payfast_link: string | null
          payment_method: string | null
          primary_color: string | null
          snapscan_link: string | null
          store_bio: string | null
          store_font: string | null
          store_handle: string | null
          store_layout: string | null
          store_location: string | null
          store_visibility: boolean | null
          theme_preset: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          business_name?: string | null
          created_at?: string
          customization_version?: number | null
          default_currency?: string | null
          delivery_method?: string | null
          delivery_note?: string | null
          eft_details?: string | null
          header_banner_url?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_headline?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          id: string
          last_customized_at?: string | null
          logo_url?: string | null
          payfast_link?: string | null
          payment_method?: string | null
          primary_color?: string | null
          snapscan_link?: string | null
          store_bio?: string | null
          store_font?: string | null
          store_handle?: string | null
          store_layout?: string | null
          store_location?: string | null
          store_visibility?: boolean | null
          theme_preset?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          business_name?: string | null
          created_at?: string
          customization_version?: number | null
          default_currency?: string | null
          delivery_method?: string | null
          delivery_note?: string | null
          eft_details?: string | null
          header_banner_url?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_headline?: string | null
          hero_image_url?: string | null
          hero_subheading?: string | null
          id?: string
          last_customized_at?: string | null
          logo_url?: string | null
          payfast_link?: string | null
          payment_method?: string | null
          primary_color?: string | null
          snapscan_link?: string | null
          store_bio?: string | null
          store_font?: string | null
          store_handle?: string | null
          store_layout?: string | null
          store_location?: string | null
          store_visibility?: boolean | null
          theme_preset?: string | null
          updated_at?: string
          whatsapp_number?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
