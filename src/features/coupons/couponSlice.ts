import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppliedCoupon = {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount?: number;
} | null;

type CouponState = {
  appliedCoupon: AppliedCoupon;
};

const initialState: CouponState = {
  appliedCoupon: null,
};

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    setAppliedCoupon: (state, action: PayloadAction<AppliedCoupon>) => {
      state.appliedCoupon = action.payload;
    },
    clearAppliedCoupon: (state) => {
      state.appliedCoupon = null;
    },
  },
});

export const {
  setAppliedCoupon,
  clearAppliedCoupon,
} = couponSlice.actions;

export default couponSlice.reducer;