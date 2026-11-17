import { api } from '@/store/api';

type GetHeroParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
};

export const heroBannerApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getHeroBanners: builder.query<any, GetHeroParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.is_active !== undefined) {
          searchParams.set('is_active', String(params.is_active));
        }

        const queryString = searchParams.toString();

        return `/hero-banners${queryString ? `?${queryString}` : ''}`;
      },
    }),

  }),
});

export const { useGetHeroBannersQuery } = heroBannerApi;