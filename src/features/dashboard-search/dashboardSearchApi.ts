import { api } from '@/store/api';
import type { DashboardSearchResponse } from '@/types/dashboardSearch';

export type GetDashboardSearchArgs = {
  q: string;
  limit?: number;
};

export const dashboardSearchApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSearch: builder.query<DashboardSearchResponse, GetDashboardSearchArgs>({
      query: ({ q, limit = 10 }) => ({
        url: '/dashboard/search',
        method: 'GET',
        params: {
          q,
          ...(limit != null ? { limit: String(Math.min(50, Math.max(1, limit))) } : {}),
        },
      }),
      transformResponse: (raw: DashboardSearchResponse): DashboardSearchResponse => ({
        products: raw.products ?? [],
        flavors: raw.flavors ?? [],
        brands: raw.brands ?? [],
        strength_levels: raw.strength_levels ?? [],
        offers: raw.offers ?? [],
        special_offers: raw.special_offers ?? [],
        users: raw.users ?? [],
        orders: raw.orders ?? [],
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useGetDashboardSearchQuery, useLazyGetDashboardSearchQuery } = dashboardSearchApi;
