import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';

export type DashboardOrderStatus =
  | 'pending'
  | 'approved'
  | 'away'
  | 'on_the_way'
  | 'delivered'
  | 'paid'
  | 'failed';

export type DashboardAdminOrderItem = {
  id: string;
  order_id: string;
  item_type: 'product' | 'bundle' | 'special_offer' | string;
  item_id: string;
  item_name: string;
  item_image_url: string | null;
  quantity: number;
  unit_price: string;
  offer_price: string | null;
  original_price: string | null;
  coupon_value: string | null;
  discount_type: string | null;
  offer_id: string | null;
  created_at: string | null;
};

export type DashboardAdminOrderUser = {
  name: string;
  email: string;
  phone: string | null;
};

export type DashboardAdminOrder = {
  order_id: string;
  order_number: string;
  /** Same as order_number when returned by the list endpoint */
  invoice_number?: string;
  subtotal: string;
  subtotal_after_coupon: string;
  delivery_fee: string;
  shipping_cost: string;
  tax: string;
  total: string;
  status: DashboardOrderStatus;
  shipping_address: string | null;
  billing_address: string | null;
  delivery_zone_id: string | number | null;
  tax_rate_id: string | null;
  coupon_id: string | null;
  /** When present on GET /checkout/admin/orders/:id (same idea as invoice). */
  applied_coupon_code?: string | null;
  coupon_code?: string | null;
  payment_method: string | null;
  payment_intent_id: string | null;
  created_at: string | null;
  user_id: string;
  user?: DashboardAdminOrderUser | null;
  items: DashboardAdminOrderItem[];
};

/** GET /checkout/admin/orders/:id/invoice — same shape as storefront invoice payload */
export type DashboardAdminOrderInvoice = DashboardAdminOrder & {
  coupon_discount?: string | null;
  applied_coupon_code?: string | null;
};

export type DashboardOrdersPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type DashboardOrdersResponse = {
  data: DashboardAdminOrder[];
  pagination: DashboardOrdersPagination;
};

/**
 * GET /checkout/admin/orders `status` query: comma-separated
 * pending | on_the_way | delivered | paid | failed. Omit for any status.
 */
export type DashboardOrdersQueryArgs = {
  page?: number;
  limit?: number;
  status?: string;
  user_id?: string;
  order_number?: string;
  client_email?: string;
  client_name?: string;
};

export const ordersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOrders: builder.query<DashboardOrdersResponse, DashboardOrdersQueryArgs>({
      query: ({
        page = 1,
        limit = 20,
        status,
        user_id,
        order_number,
        client_email,
        client_name,
      }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (status?.trim()) params.set('status', status.trim());
        if (user_id?.trim()) params.set('user_id', user_id.trim());
        if (order_number?.trim()) params.set('order_number', order_number.trim());
        if (client_email?.trim()) params.set('client_email', client_email.trim());
        if (client_name?.trim()) params.set('client_name', client_name.trim());

        return {
          url: `/checkout/admin/orders?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: [{ type: 'DashboardOrders' as const, id: 'LIST' }],
    }),
    getDashboardOrderById: builder.query<DashboardAdminOrder, string>({
      query: (id) => ({
        url: `/checkout/admin/orders/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'DashboardOrders' as const, id }],
    }),
    getDashboardOrderInvoice: builder.query<DashboardAdminOrderInvoice, string>({
      query: (id) => ({
        url: `/checkout/admin/orders/${id}/invoice`,
        method: 'GET',
      }),
    }),
    approveDashboardOrder: builder.mutation<unknown, string>({
      query: (id) => ({
        url: `/checkout/admin/orders/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'DashboardOrders' as const, id: 'LIST' },
        { type: 'DashboardOrders' as const, id },
      ],
    }),
    moveDashboardOrderAway: builder.mutation<unknown, string>({
      query: (id) => ({
        url: `/checkout/admin/orders/${id}/on-the-way`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'DashboardOrders' as const, id: 'LIST' },
        { type: 'DashboardOrders' as const, id },
      ],
    }),
    deliverDashboardOrder: builder.mutation<unknown, string>({
      query: (id) => ({
        url: `/checkout/admin/orders/${id}/deliver`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'DashboardOrders' as const, id: 'LIST' },
        { type: 'DashboardOrders' as const, id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardOrdersQuery,
  useLazyGetDashboardOrdersQuery,
  useLazyGetDashboardOrderByIdQuery,
  useLazyGetDashboardOrderInvoiceQuery,
  useApproveDashboardOrderMutation,
  useMoveDashboardOrderAwayMutation,
  useDeliverDashboardOrderMutation,
} = ordersApiSlice;
