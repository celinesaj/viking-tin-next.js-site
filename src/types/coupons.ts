export type CouponDiscountType = 'percentage' | 'fixed';

export type ValidateCouponResponse = {
  valid: boolean;
  code?: string;
  message?: string;
  discount_type?: CouponDiscountType;
  discount_value?: string;
  min_order_amount?: number;
  max_discount_amount?: number;
};

export type ValidateCouponParams = {
  code: string;
};

export type AvailableCoupon = {
  code: string;
  description?: Record<string, unknown> | string | null;
  discount_type: CouponDiscountType;
  discount_value: string;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit_per_user?: number;   // ← add
  uses_remaining?: number;          // ← add
};

export type AvailableCouponsResponse = {
  has_available: boolean;
  coupons: AvailableCoupon[];
  message?: string;
};