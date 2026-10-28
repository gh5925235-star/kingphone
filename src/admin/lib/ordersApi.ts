import { supabase } from '@/lib/supabase';
import type {
  AdminOrder, AdminOrderStatus, AdminOrderItem, AdminInstallment, AdminReceipt,
  AdminCategory, AdminProduct, AdminVariant, AdminPaymentMethod,
} from '@/admin/lib/types';

// ---------- Orders ----------

export type OrderRow = Record<string, unknown>;

export function asOrder(row: OrderRow): AdminOrder {
  return {
    id: String(row.id ?? ''),
    order_number: String(row.order_number ?? ''),
    customer_name: String(row.customer_name ?? ''),
    phone: String(row.phone ?? ''),
    email: (row.email as string) ?? null,
    cpr: (row.cpr as string) ?? null,
    address: (row.address as string) ?? null,
    notes: (row.notes as string) ?? null,
    admin_notes: (row.admin_notes as string) ?? null,
    subtotal: Number(row.subtotal ?? 0),
    total: Number(row.total ?? 0),
    paid_amount: Number(row.paid_amount ?? 0),
    payment_type: row.payment_type === 'installment' ? 'installment' : 'full',
    payment_method: String(row.payment_method ?? ''),
    down_payment: Number(row.down_payment ?? 0),
    installments_count: (row.installments_count as number) ?? null,
    status: (row.status as AdminOrderStatus) ?? 'pending',
    contract_fields: (row.contract_fields as Record<string, string>) ?? null,
    lang: row.lang === 'en' ? 'en' : 'ar',
    created_at: (row.created_at as string) ?? null,
  };
}

export function asOrderItem(row: OrderRow): AdminOrderItem {
  return {
    id: String(row.id ?? ''),
    order_id: String(row.order_id ?? ''),
    product_id: (row.product_id as string) ?? null,
    variant_id: (row.variant_id as string) ?? null,
    name: (row.name as string) ?? null,
    color: (row.color as string) ?? null,
    capacity: (row.capacity as string) ?? null,
    price: Number(row.price ?? 0),
    qty: Number(row.qty ?? 0),
  };
}

export async function fetchOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => asOrder(r as OrderRow));
}

export async function fetchOrder(id: string): Promise<{ order: AdminOrder; items: AdminOrderItem[] }> {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Order not found');
  const order = asOrder(data as OrderRow);
  const items = await fetchOrderItems(id);
  return { order, items };
}

export async function fetchOrderItems(orderId: string): Promise<AdminOrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  if (error) throw error;
  return (data ?? []).map((r) => asOrderItem(r as OrderRow));
}

export type OrderUpdate = Partial<{
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
  contract_fields: Record<string, string>;
  lang: 'ar' | 'en';
}>;

export async function updateOrder(id: string, patch: OrderUpdate): Promise<void> {
  const { error } = await supabase.from('orders').update(patch).eq('id', id);
  if (error) throw error;
}

export type OrderItemInput = {
  product_id: string | null;
  variant_id: string | null;
  name: string;
  color: string;
  capacity: string;
  price: number;
  qty: number;
};

export type NewOrderInput = {
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
  lang: 'ar' | 'en';
  items: OrderItemInput[];
};

export async function createOrder(input: NewOrderInput): Promise<AdminOrder> {
  const { items, ...orderFields } = input;
  const { data, error } = await supabase.from('orders').insert(orderFields).select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Failed to create order');
  const order = asOrder(data as OrderRow);

  if (items.length > 0) {
    const rows = items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      name: it.name,
      color: it.color,
      capacity: it.capacity,
      price: it.price,
      qty: it.qty,
    }));
    const { error: itemErr } = await supabase.from('order_items').insert(rows);
    if (itemErr) throw itemErr;
  }

  return order;
}

export async function updateOrderStatus(id: string, status: AdminOrderStatus): Promise<void> {
  await updateOrder(id, { status });
}

export async function deleteOrder(id: string): Promise<void> {
  const { error: itemErr } = await supabase.from('order_items').delete().eq('order_id', id);
  if (itemErr) throw itemErr;
  const { error: instErr } = await supabase.from('installments').delete().eq('order_id', id);
  if (instErr) throw instErr;
  const { error: rcErr } = await supabase.from('receipts').delete().eq('order_id', id);
  if (rcErr) throw rcErr;
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

export async function replaceOrderItems(orderId: string, items: OrderItemInput[]): Promise<void> {
  const { error: delErr } = await supabase.from('order_items').delete().eq('order_id', orderId);
  if (delErr) throw delErr;
  if (items.length === 0) return;
  const rows = items.map((it) => ({
    order_id: orderId,
    product_id: it.product_id,
    variant_id: it.variant_id,
    name: it.name,
    color: it.color,
    capacity: it.capacity,
    price: it.price,
    qty: it.qty,
  }));
  const { error: insErr } = await supabase.from('order_items').insert(rows);
  if (insErr) throw insErr;
}

// ---------- Installments ----------

export async function fetchInstallments(orderId: string): Promise<AdminInstallment[]> {
  const { data, error } = await supabase
    .from('installments')
    .select('*')
    .eq('order_id', orderId)
    .order('number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as AdminInstallment[];
}

export async function regenerateSchedule(orderId: string, months: number, downPayment: number, total: number, firstDueDate?: string): Promise<void> {
  const { error: delErr } = await supabase.from('installments').delete().eq('order_id', orderId).eq('paid', false);
  if (delErr) throw delErr;
  const remaining = Math.max(0, total - downPayment);
  if (months <= 0) return;
  const per = Math.round((remaining / months) * 1000) / 1000;
  const start = firstDueDate ? new Date(firstDueDate) : new Date();
  const rows: { order_id: string; number: number; due_date: string; amount: number; paid: boolean }[] = [];
  for (let i = 1; i <= months; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const amount = i === months ? Math.round((remaining - per * (months - 1)) * 1000) / 1000 : per;
    rows.push({ order_id: orderId, number: i, due_date: d.toISOString(), amount, paid: false });
  }
  const { error: insErr } = await supabase.from('installments').insert(rows);
  if (insErr) throw insErr;
}

// ---------- Receipts ----------

export async function fetchReceipts(orderId: string): Promise<AdminReceipt[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('order_id', orderId)
    .order('received_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminReceipt[];
}

export async function nextOrderNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('next_order_number');
  if (error) throw error;
  return String(data ?? '');
}

export async function nextReceiptNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('next_receipt_number');
  if (error) throw error;
  return String(data ?? '');
}

// ---------- Categories ----------

export async function fetchCategories(): Promise<AdminCategory[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as AdminCategory[];
}

export async function upsertCategory(c: Partial<AdminCategory> & { slug: string; name_ar: string; name_en: string; sort_order: number }): Promise<void> {
  if (c.id) {
    const { error } = await supabase.from('categories').update(c).eq('id', c.id);
    if (error) throw error;
  } else {
    const { id, ...rest } = c;
    const { error } = await supabase.from('categories').insert(rest);
    if (error) throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Products ----------

export async function fetchProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminProduct[];
}

export async function fetchProduct(id: string): Promise<AdminProduct> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Product not found');
  return data as unknown as AdminProduct;
}

export async function upsertProduct(p: Partial<AdminProduct> & { slug: string; name_ar: string; name_en: string; base_price: number; brand: string }): Promise<AdminProduct> {
  if (p.id) {
    const { data, error } = await supabase.from('products').update(p).eq('id', p.id).select('*').maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Product not found');
    return data as unknown as AdminProduct;
  }
  const { id, ...rest } = p;
  const { data, error } = await supabase.from('products').insert(rest).select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Failed to create product');
  return data as unknown as AdminProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error: vErr } = await supabase.from('product_variants').delete().eq('product_id', id);
  if (vErr) throw vErr;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Variants ----------

export async function fetchVariants(productId: string): Promise<AdminVariant[]> {
  const { data, error } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('capacity', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as AdminVariant[];
}

export async function fetchAllVariants(): Promise<(AdminVariant & { slug?: string })[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .order('capacity', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as (AdminVariant & { slug?: string })[];
}

export async function upsertVariant(v: Partial<AdminVariant> & { product_id: string; color_ar: string; color_en: string; color_hex: string; capacity: string; price: number; stock: number }): Promise<void> {
  if (v.id) {
    const { error } = await supabase.from('product_variants').update(v).eq('id', v.id);
    if (error) throw error;
  } else {
    const { id, ...rest } = v;
    const { error } = await supabase.from('product_variants').insert(rest);
    if (error) throw error;
  }
}

export async function deleteVariant(id: string): Promise<void> {
  const { error } = await supabase.from('product_variants').delete().eq('id', id);
  if (error) throw error;
}
