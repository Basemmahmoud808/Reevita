export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          role: 'customer' | 'admin'
          is_blacklisted: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          role?: 'customer' | 'admin'
          is_blacklisted?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          role?: 'customer' | 'admin'
          is_blacklisted?: boolean
          notes?: string | null
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          name_ar: string
          description: string | null
          image_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          name_ar: string
          description?: string | null
          image_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          name_ar?: string
          description?: string | null
          image_url?: string | null
          display_order?: number
          is_active?: boolean
        }
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          slug: string
          name: string
          name_ar: string
          short_description: string | null
          short_description_ar: string | null
          description: string
          price: number
          compare_at_price: number | null
          benefits: string[]
          ingredients: string | null
          how_to_use: string | null
          size: string | null
          is_featured: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          slug: string
          name: string
          name_ar: string
          short_description?: string | null
          short_description_ar?: string | null
          description: string
          price: number
          compare_at_price?: number | null
          benefits?: string[]
          ingredients?: string | null
          how_to_use?: string | null
          size?: string | null
          is_featured?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          slug?: string
          name?: string
          name_ar?: string
          short_description?: string | null
          short_description_ar?: string | null
          description?: string
          price?: number
          compare_at_price?: number | null
          benefits?: string[]
          ingredients?: string | null
          how_to_use?: string | null
          size?: string | null
          is_featured?: boolean
          is_active?: boolean
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          product_id: string
          quantity_available: number
          quantity_reserved: number
          low_stock_threshold: number
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity_available?: number
          quantity_reserved?: number
          low_stock_threshold?: number
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity_available?: number
          quantity_reserved?: number
          low_stock_threshold?: number
          updated_at?: string
        }
      }
      governorates: {
        Row: {
          id: string
          code: string
          name_ar: string
          name_en: string
          zone: 'greater_cairo' | 'alexandria' | 'delta' | 'canal' | 'upper_egypt' | 'frontier'
          is_active: boolean
          created_at: string
        }
      }
      shipping_rates: {
        Row: {
          id: string
          governorate_id: string
          shipping_cost: number
          free_shipping_threshold: number
          estimated_days_min: number
          estimated_days_max: number
          is_active: boolean
          updated_at: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          customer_name: string
          customer_phone: string
          customer_email: string | null
          governorate_id: string
          shipping_address_snapshot: {
            governorate_id: string
            governorate_ar: string
            governorate_en: string
            city: string
            address_line: string
            landmark?: string
          }
          status: 'new' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'refused' | 'returned' | 'cancelled'
          payment_method: 'cod' | 'online'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          subtotal: number
          shipping_fee: number
          cod_fee: number
          discount_amount: number
          total: number
          currency: 'EGP'
          order_notes: string | null
          internal_notes: string | null
          shipping_carrier: string | null
          tracking_number: string | null
          ip_address: string | null
          created_at: string
          updated_at: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variant_id: string | null
          product_name: string
          unit_price: number
          quantity: number
          total_price: number
        }
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          from_status: string | null
          to_status: string
          changed_by: string | null
          reason: string | null
          created_at: string
        }
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          source?: string
          created_at?: string
        }
      }
    }
    Views: {
      product_availability: {
        Row: {
          product_id: string
          in_stock: boolean
          stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
        }
      }
    }
    Functions: {
      normalize_egyptian_phone: {
        Args: { p_phone: string }
        Returns: string
      }
      place_order: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_customer_email?: string | null
          p_governorate_id: string
          p_city: string
          p_address_line: string
          p_landmark?: string | null
          p_order_notes?: string | null
          p_items: Array<{ product_id: string; quantity: number }>
          p_ip_address?: string | null
        }
        Returns: {
          success: boolean
          order_id: string
          order_number: string
          status: string
          customer_name: string
          customer_phone: string
          subtotal: number
          shipping_fee: number
          cod_fee: number
          total: number
          currency: 'EGP'
          created_at: string
        }
      }
      track_order: {
        Args: {
          p_order_number: string
          p_phone: string
        }
        Returns: {
          found: boolean
          order_number?: string
          status?: string
          status_ar?: string
          shipping_carrier?: string
          tracking_number?: string | null
          destination_governorate?: string
          total?: number
          currency?: 'EGP'
          created_at?: string
          message_ar?: string
          message_en?: string
        }
      }
      admin_update_order_status: {
        Args: {
          p_order_id: string
          p_new_status: string
          p_reason?: string | null
          p_shipping_carrier?: string | null
          p_tracking_number?: string | null
        }
        Returns: {
          success: boolean
          order_id: string
          order_number: string
          from_status: string
          to_status: string
        }
      }
      admin_get_orders: {
        Args: {
          p_status?: string | null
          p_governorate_id?: string | null
          p_from_date?: string | null
          p_to_date?: string | null
          p_search?: string | null
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          total_count: number
          limit: number
          offset: number
          orders: Array<Record<string, unknown>>
        }
      }
      admin_get_metrics: {
        Args: Record<string, never>
        Returns: {
          total_orders: number
          total_sales_egp: number
          orders_by_status: Record<string, number>
          delivered_count: number
          refused_count: number
          refusal_rate_percentage: number
          low_stock_count: number
          low_stock_items: Array<{
            product_id: string
            name: string
            name_ar: string
            quantity_available: number
            low_stock_threshold: number
          }>
        }
      }
    }
  }
}
