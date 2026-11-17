export type CheckoutItemType = 'product' | 'bundle' | 'special_offer';

// types/checkout.ts
export type CheckoutDiscountType = 'percentage' | 'fixed' | 'price';

export type CheckoutPaymentMethod = 'card' | 'cash' | 'cash_on_delivery';

export type CheckoutItemPayload = {
  item_type: CheckoutItemType;
  item_id: number;
  quantity: number;
  price: number;
  offer_price?: number;
  compare_price?: number;
  original_price?: number;
  coupon_value?: number;
  discount_type?: CheckoutDiscountType;
  is_free?: boolean;   // 🔸 NEW
};

export type CheckoutPayload = {
  address_id?: number | null;
  delivery_zone_id: number;
  shipping_address: string;
  subtotal: number;
  delivery_fee: number;
  shipping_cost: number;
  tax: number;
  total: number;
  items: CheckoutItemPayload[];
  coupon_code?: string;
  payment_method: CheckoutPaymentMethod;
  tax_rate_id?: number | null;
  billing_address?: string;
};

export type CheckoutOrderItemResponse = {
  id?: number | string;
  item_type?: CheckoutItemType;
  item_id?: number | string;
  quantity?: number;
  price?: number | string;
  offer_price?: number | string;
  compare_price?: number | string;
  original_price?: number | string;
  coupon_value?: number | string;
  discount_type?: CheckoutDiscountType;
};

export type CheckoutResponse = {
  success?: boolean;
  message?: string;
  order_id?: number | string;
  order_number?: string;
  status?: string;
  subtotal?: number | string;
  delivery_fee?: number | string;
  shipping_cost?: number | string;
  tax?: number | string;
  total?: number | string;
  coupon_code?: string | null;
  payment_method?: string;
  billing_address?: string;
  shipping_address?: string;
  items?: CheckoutOrderItemResponse[];
};

export type CheckoutApiError = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};