export type OrderHistoryStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderHistoryItemType = 'product' | 'bundle' | 'special_offer';

export type OrderHistoryItem = {
  id: string;
  order_id: string;
  item_type: OrderHistoryItemType;
  item_id: string;
  quantity: number;
  unit_price: string;
  offer_price: string | null;
  original_price: string | null;
  coupon_value: string | null;
  discount_type: 'percentage' | 'fixed' | null;
  offer_id: string | null;
  created_at: string | null;
};

export type OrderHistoryOrder = {
  order_id: string;
  order_number: string;
  invoice_number: string;
  subtotal: string;
  subtotal_after_coupon: string;
  delivery_fee: string;
  shipping_cost: string;
  tax: string;
  total: string;
  status: OrderHistoryStatus | string;
  shipping_address: string;
  billing_address: string;
  delivery_zone_id: number;
  tax_rate_id: string | null;
  coupon_id: string | null;
  payment_method: string;
  payment_intent_id: string | null;
  created_at: string | null;
  items: OrderHistoryItem[];
};

export type OrdersPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type OrdersResponse = {
  data: OrderHistoryOrder[];
  pagination: OrdersPagination;
};

export type OrderInvoiceResponse = OrderHistoryOrder;

export type OrdersApiError = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};