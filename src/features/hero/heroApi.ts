import { api } from '@/store/api';
import type { HeroBannersResponse } from '@/types/hero';
import {
  mapHeroBannersListResponse,
  type HeroBannersPaginatedApiResponse,
} from '@/features/hero/heroBannerApiMaps';

export const heroApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getHeroBanners: builder.query<HeroBannersResponse, void>({
      query: () => ({
        url: '/hero-banners',
        params: {
          page: 1,
          limit: 50,
          is_active: true,
        },
      }),
      transformResponse: (response: HeroBannersPaginatedApiResponse) =>
        mapHeroBannersListResponse(response),
      providesTags: [{ type: 'HeroBanner', id: 'LIST' }],
    }),
  }),
});

export const { useGetHeroBannersQuery } = heroApi;
