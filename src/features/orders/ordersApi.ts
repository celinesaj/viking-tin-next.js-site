import { api } from '@/store/api';
import type {
  OrderInvoiceResponse,
  OrdersResponse,
} from '@/types/orders';

export type GetOrdersParams = {
  page?: number;
  limit?: number;
  status?: string;
};

export const ordersApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getMyOrders: builder.query<OrdersResponse, GetOrdersParams | void>({
      query: (params) => {
        const query = new URLSearchParams();

        query.set('page', String(params?.page ?? 1));
        query.set('limit', String(params?.limit ?? 20));

        if (params?.status && params.status !== 'all') {
          query.set('status', params.status);
        }

        return {
          url: `/api/account/orders?${query.toString()}`,
          method: 'GET',
        };
      },
    }),

    getOrderInvoice: builder.query<OrderInvoiceResponse, string>({
      query: (orderId) => ({
        url: `/api/account/orders/${orderId}/invoice`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGetMyOrdersQuery,
  useGetOrderInvoiceQuery,
} = ordersApi;