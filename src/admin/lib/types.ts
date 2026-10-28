// Admin domain types. Mirrors the REAL public schema.

export type AdminOrderStatus = 'pending' | 'confirmed' | 'paid' | 'delivered' | 'cancelled';

export type AdminPaymentMethod = 'cash' | 'benefit' | 'bank_transfer' | 'card' | 'other';

export type AdminOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  name: string | null;
  color: string | null;
  capacity: string | null;
  price: number;
  qty: number;
};

export type AdminOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  cpr: string | null;
  address: string | null;
  notes: string | null;
  admin_notes: string | null;
  subtotal: number;
  total: number;
  paid_amount: number;
  payment_type: 'full' | 'installment';
  payment_method: string;
  down_payment: number;
  installments_count: number | null;
  status: AdminOrderStatus;
  contract_fields: Record<string, string> | null;
  lang: 'ar' | 'en';
  created_at: string | null;
};

export type AdminInstallment = {
  id: string;
  order_id: string;
  number: number;
  due_date: string | null;
  amount: number;
  paid: boolean;
  paid_at: string | null;
};

export type AdminReceipt = {
  id: string;
  receipt_number: string;
  order_id: string | null;
  installment_id: string | null;
  amount: number;
  method: AdminPaymentMethod;
  received_at: string | null;
  received_by: string | null;
  note: string | null;
};

export type AdminSettings = Record<string, string>;

export type AdminCategory = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
};

export type AdminProduct = {
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
  created_at: string | null;
};

export type AdminVariant = {
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
