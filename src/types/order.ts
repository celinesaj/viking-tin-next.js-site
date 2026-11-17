
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderItemType = 'product' | 'bundle' | 'special_offer';

export type CheckoutAddress = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  deliveryZoneId: string;
  city: string;
  street: string;
  moreInfo: string;
};

export type SavedAddress = {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  deliveryZoneId: string;
  city: string;
  street: string;
  moreInfo: string;
  isDefault: boolean;
};

export type CheckoutItem = {
  id: string;
  itemType: OrderItemType;
  itemId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
};

export type CheckoutSummaryData = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  shippingCost: number;
  tax: number;
  total: number;
};

export type CheckoutPaymentMethod = 'cash_on_delivery' | 'card';

export type CheckoutFormValues = {
  deliveryZoneId: string;
  paymentMethod: CheckoutPaymentMethod;
  orderNotes: string;
};

export type CreatedOrderSavedAddress = {
  id: string;
  title: string;
  address_line: string;
  street: string;
  more_info: string;
  zone_id: string;
  is_default: boolean;
};

export type CreateOrderResponse = {
  order_id?: string | number;
  order_number?: string;
  subtotal?: string | number;
  delivery_fee?: string | number;
  shipping_cost?: string | number;
  tax?: string | number;
  total?: string | number;
  coupon_code?: string | null;
  payment_method?: string;
  delivery_zone_id?: number;
  status?: OrderStatus | string;
  shipping_address?: string;
  billing_address?: string;
  address_id?: string | number | null;
  saved_address?: CreatedOrderSavedAddress | null;
  message?: string;
};