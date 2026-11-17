import { api } from '@/store/api';
import type { CheckoutPayload, CheckoutResponse } from '@/types/checkout';

export const checkoutApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    checkout: builder.mutation<CheckoutResponse, CheckoutPayload>({
      query: (body) => ({
        url: '/api/checkout',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useCheckoutMutation } = checkoutApi;