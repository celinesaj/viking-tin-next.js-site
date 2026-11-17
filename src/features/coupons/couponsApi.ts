import { api } from '@/store/api';
import type {
  AvailableCouponsResponse,
  ValidateCouponParams,
  ValidateCouponResponse,
} from '@/types/coupons';

export const couponsApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    validateCoupon: builder.query<ValidateCouponResponse, ValidateCouponParams>({
      query: ({ code }) => ({
        url: `/api/coupons/validate?code=${encodeURIComponent(code.trim())}`,
        method: 'GET',
      }),
    }),

    getAvailableCoupons: builder.query<AvailableCouponsResponse, void>({
      query: () => ({
        url: '/api/coupons/available',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useLazyValidateCouponQuery,
  useGetAvailableCouponsQuery,
} = couponsApi;