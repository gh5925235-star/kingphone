import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lnrzvsrztnlcyrkplyik.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxucnp2c3J6dG5sY3lya3BseWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MzU3NzgsImV4cCI6MjEwODUxMTc3OH0.s3XbjG0t5PMKqWyopFf18QhVWku7LR1_g501ZSxy6i4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Domain types mirror the public schema (read-only catalog for anonymous visitors).

export type Category = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  brand: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  base_price: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  installment_enabled: boolean;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  color_ar: string;
  color_en: string;
  color_hex: string;
  capacity: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
};

export type Settings = Record<string, string>;

export type CreateOrderItem = {
  variant_id: string;
  qty: number;
  product_id?: string;
  name_ar?: string;
  name_en?: string;
  color_ar?: string;
  color_en?: string;
  capacity?: string;
};

export type CreateOrderCustomer = {
  name: string;
  phone: string;
  email?: string;
  cpr?: string;
  address?: string;
  notes?: string;
  lang: 'ar' | 'en';
};

export type CreateOrderResult = {
  id: string;
  order_number: string;
  total: number;
};
