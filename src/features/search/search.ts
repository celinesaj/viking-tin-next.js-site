import { api } from '@/store/api';
import type { SearchApiResponse } from '@/types/search';

export const searchApi = api.injectEndpoints({
  endpoints: (builder) => ({
    searchSite: builder.query<SearchApiResponse, { q: string; limit?: number }>({
      query: ({ q, limit = 20 }) => ({
        url: '/search',
        params: { q, limit },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useSearchSiteQuery,
  useLazySearchSiteQuery,
} = searchApi;