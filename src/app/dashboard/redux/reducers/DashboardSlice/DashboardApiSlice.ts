import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';

type DashboardKpiMetric = {
  current: string | number;
  previous: string | number;
  change_percent: number;
};

type DashboardTopProduct = {
  product_id: string;
  name: string;
  cover_image_url: string | null;
  quantity_sold: number;
};

type DashboardTopBundle = {
  bundle_id: string;
  name: string;
  image_url: string | null;
  quantity_sold: number;
};

type DashboardTopSpecialOffer = {
  special_offer_id: string;
  name: string;
  image_url: string | null;
  quantity_sold: number;
};

export type DashboardSalesTrendPoint = {
  month: string;
  label: string;
  revenue: string;
};

type DashboardComparisonPoint = {
  label: string;
  value: number;
};

export type DashboardProductSalesPeriod = {
  from: string | null;
  to: string | null;
  start: string;
  end: string;
};

export type DashboardProductSalesRow = {
  product_id: string;
  name: string;
  cover_image_url: string | null | Record<string, unknown>;
  quantity_sold: number;
  completed_order_count: number;
  line_revenue: string;
};

export type DashboardProductSalesResponse = {
  completed_statuses: string[];
  period: DashboardProductSalesPeriod;
  products: DashboardProductSalesRow[];
};

export type DashboardBundleSalesRow = {
  bundle_id: string;
  name: string;
  image_url: string | Record<string, unknown> | null;
  quantity_sold: number;
  completed_order_count: number;
  line_revenue: string;
};

export type DashboardBundleSalesResponse = {
  completed_statuses: string[];
  period: DashboardProductSalesPeriod;
  bundles: DashboardBundleSalesRow[];
};

export type DashboardSpecialOfferSalesRow = {
  special_offer_id: string;
  name: string;
  image_url: string | Record<string, unknown> | null;
  quantity_sold: number;
  completed_order_count: number;
  line_revenue: string;
};

export type DashboardSpecialOfferSalesResponse = {
  completed_statuses: string[];
  period: DashboardProductSalesPeriod;
  special_offers: DashboardSpecialOfferSalesRow[];
};

export type DashboardOverviewResponse = {
  period: {
    granularity: string;
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  summary: {
    revenue: DashboardKpiMetric;
    orders: DashboardKpiMetric;
    customers: DashboardKpiMetric;
    top_product: DashboardTopProduct | null;
    top_bundle: DashboardTopBundle | null;
    top_special_offer: DashboardTopSpecialOffer | null;
  };
  sales_trend: DashboardSalesTrendPoint[];
  charts?: {
    revenue_trend?: {
      title: string;
      points: DashboardSalesTrendPoint[];
    };
    orders_comparison?: {
      title: string;
      points: DashboardComparisonPoint[];
    };
    customers_comparison?: {
      title: string;
      points: DashboardComparisonPoint[];
    };
  };
};

export type DashboardProductSalesArgs = {
  /** UTC YYYY-MM-DD; must be sent together with `to`. Omit both for all-time. */
  from?: string;
  to?: string;
};

export type DashboardProductBuyersSummary = {
  order_count: number;
  quantity_sold: number;
};

export type DashboardProductBuyerRow = {
  name: string | Record<string, unknown> | null;
  email: string;
  order_count: number;
  quantity_sold: number;
};

export type DashboardProductBuyersResponse = {
  product_id: string;
  product_name: string;
  period: DashboardProductSalesPeriod;
  completed_statuses: string[];
  summary: DashboardProductBuyersSummary;
  buyers: DashboardProductBuyerRow[];
};

export type DashboardProductBuyersArgs = {
  productId: string;
  /** UTC YYYY-MM-DD; must be sent together with `to`. Omit both for current UTC month. */
  from?: string;
  to?: string;
};

export type DashboardProductYearOrderUser = {
  id: string;
  name: string | Record<string, unknown> | null;
  email: string;
};

export type DashboardProductYearOrderRow = {
  order_id: string;
  /** When present, preferred for linking to the orders admin search */
  order_number?: string | null;
  created_at: string;
  status: string;
  user: DashboardProductYearOrderUser;
  quantity_for_product: number;
  unit_price: string;
  payment_method: string | Record<string, unknown>;
};

export type DashboardProductYearMonthBucket = {
  month: string;
  month_number: number;
  label: string;
  period: DashboardProductSalesPeriod;
  order_count: number;
  quantity_sold: number;
  line_revenue: string;
  orders: DashboardProductYearOrderRow[];
};

export type DashboardProductOrdersYearResponse = {
  product_id: string;
  product_name: string;
  year: number;
  period: DashboardProductSalesPeriod;
  completed_statuses: string[];
  months: DashboardProductYearMonthBucket[];
};

export type DashboardProductOrdersYearArgs = {
  productId: string;
  /** UTC calendar year (2000–2100). Omit query param for current UTC year. */
  year?: number;
};

export type DashboardBundleYearOrderRow = {
  order_id: string;
  order_number?: string | null;
  created_at: string;
  status: string;
  user: DashboardProductYearOrderUser;
  quantity_for_bundle: number;
  unit_price: string;
  payment_method: string | Record<string, unknown>;
};

export type DashboardBundleYearMonthBucket = {
  month: string;
  month_number: number;
  label: string;
  period: DashboardProductSalesPeriod;
  order_count: number;
  quantity_sold: number;
  line_revenue: string;
  orders: DashboardBundleYearOrderRow[];
};

export type DashboardBundleOrdersYearResponse = {
  bundle_id: string;
  bundle_name: string;
  year: number;
  period: DashboardProductSalesPeriod;
  completed_statuses: string[];
  months: DashboardBundleYearMonthBucket[];
};

export type DashboardBundleOrdersYearArgs = {
  bundleId: string;
  year?: number;
};

export type DashboardSpecialOfferYearOrderRow = {
  order_id: string;
  order_number?: string | null;
  created_at: string;
  status: string;
  user: DashboardProductYearOrderUser;
  quantity_for_special_offer: number;
  unit_price: string;
  payment_method: string | Record<string, unknown>;
};

export type DashboardSpecialOfferYearMonthBucket = {
  month: string;
  month_number: number;
  label: string;
  period: DashboardProductSalesPeriod;
  order_count: number;
  quantity_sold: number;
  line_revenue: string;
  orders: DashboardSpecialOfferYearOrderRow[];
};

export type DashboardSpecialOfferOrdersYearResponse = {
  special_offer_id: string;
  special_offer_name: string;
  year: number;
  period: DashboardProductSalesPeriod;
  completed_statuses: string[];
  months: DashboardSpecialOfferYearMonthBucket[];
};

export type DashboardSpecialOfferOrdersYearArgs = {
  specialOfferId: string;
  year?: number;
};

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<DashboardOverviewResponse, void>({
      query: () => ({
        url: '/admin/dashboard',
        method: 'GET',
      }),
      providesTags: [{ type: 'DashboardOverview' as const, id: 'ONE' }],
    }),
    getDashboardProductSales: builder.query<
      DashboardProductSalesResponse,
      DashboardProductSalesArgs | void
    >({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg?.from && arg?.to) {
          params.set('from', arg.from);
          params.set('to', arg.to);
        }
        const qs = params.toString();
        return {
          url: `/admin/dashboard/products/sales${qs ? `?${qs}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: [{ type: 'DashboardProductSales' as const, id: 'LIST' }],
    }),
    getDashboardBundleSales: builder.query<
      DashboardBundleSalesResponse,
      DashboardProductSalesArgs | void
    >({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg?.from && arg?.to) {
          params.set('from', arg.from);
          params.set('to', arg.to);
        }
        const qs = params.toString();
        return {
          url: `/admin/dashboard/bundles/sales${qs ? `?${qs}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: [{ type: 'DashboardBundleSales' as const, id: 'LIST' }],
    }),
    getDashboardSpecialOfferSales: builder.query<
      DashboardSpecialOfferSalesResponse,
      DashboardProductSalesArgs | void
    >({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg?.from && arg?.to) {
          params.set('from', arg.from);
          params.set('to', arg.to);
        }
        const qs = params.toString();
        return {
          url: `/admin/dashboard/special-offers/sales${qs ? `?${qs}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: [{ type: 'DashboardSpecialOfferSales' as const, id: 'LIST' }],
    }),
    getDashboardProductBuyers: builder.query<
      DashboardProductBuyersResponse,
      DashboardProductBuyersArgs
    >({
      query: ({ productId, from, to }) => {
        const params = new URLSearchParams();
        if (from && to) {
          params.set('from', from);
          params.set('to', to);
        }
        const qs = params.toString();
        return {
          url: `/admin/dashboard/products/${encodeURIComponent(productId)}/this-month${qs ? `?${qs}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: (_res, _err, arg) => [
        { type: 'DashboardProductBuyers' as const, id: arg.productId },
      ],
    }),
    getDashboardProductOrdersYear: builder.query<
      DashboardProductOrdersYearResponse,
      DashboardProductOrdersYearArgs
    >({
      query: ({ productId, year }) => {
        const params = new URLSearchParams();
        if (year !== undefined && year !== null) {
          params.set('year', String(year));
        }
        const qs = params.toString();
        return {
          url: `/admin/dashboard/products/${encodeURIComponent(productId)}/orders/year${qs ? `?${qs}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: (_res, _err, arg) => [
        {
          type: 'DashboardProductOrdersYear' as const,
          id: `${arg.productId}:${arg.year ?? 'current'}`,
        },
      ],
    }),
    getDashboardBundleOrdersYear: builder.query<
      DashboardBundleOrdersYearResponse,
      DashboardBundleOrdersYearArgs
    >({
      query: ({ bundleId, year }) => {
        const params = new URLSearchParams();
        if (year !== undefined && year !== null) {
          params.set('year', String(year));
        }
        const qs = params.toString();
        return {
          url: `/admin/dashboard/bundles/${encodeURIComponent(bundleId)}/orders/year${qs ? `?${qs}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: (_res, _err, arg) => [
        {
          type: 'DashboardBundleOrdersYear' as const,
          id: `${arg.bundleId}:${arg.year ?? 'current'}`,
        },
      ],
    }),
    getDashboardSpecialOfferOrdersYear: builder.query<
      DashboardSpecialOfferOrdersYearResponse,
      DashboardSpecialOfferOrdersYearArgs
    >({
      query: ({ specialOfferId, year }) => {
        const params = new URLSearchParams();
        if (year !== undefined && year !== null) {
          params.set('year', String(year));
        }
        const qs = params.toString();
        return {
          url: `/admin/dashboard/special-offers/${encodeURIComponent(specialOfferId)}/orders/year${qs ? `?${qs}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: (_res, _err, arg) => [
        {
          type: 'DashboardSpecialOfferOrdersYear' as const,
          id: `${arg.specialOfferId}:${arg.year ?? 'current'}`,
        },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardOverviewQuery,
  useGetDashboardProductSalesQuery,
  useGetDashboardBundleSalesQuery,
  useGetDashboardSpecialOfferSalesQuery,
  useGetDashboardProductBuyersQuery,
  useGetDashboardProductOrdersYearQuery,
  useGetDashboardBundleOrdersYearQuery,
  useGetDashboardSpecialOfferOrdersYearQuery,
} = dashboardApiSlice;
