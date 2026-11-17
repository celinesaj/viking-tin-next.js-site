import { api } from '@/store/api';
import type {
  SpecialOffer,
  SpecialOffersResponse,
} from '@/types/special-offers';

export type SpecialOfferPriceSort = 'asc' | 'desc';

type GetSpecialOffersParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
  price_min?: number;
  price_max?: number;
  price_sort?: SpecialOfferPriceSort;
};

export const specialOffersApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getSpecialOffers: builder.query<
      SpecialOffersResponse,
      GetSpecialOffersParams | void
    >({
      query: (params) => {
        const p = params ?? {};

        return {
          url: '/special-offers',
          method: 'GET',
          params: {
            page: p.page ?? 1,
            limit: p.limit ?? 10,
            ...(p.is_active !== undefined ? { is_active: p.is_active } : {}),
            ...(p.price_min !== undefined ? { price_min: p.price_min } : {}),
            ...(p.price_max !== undefined ? { price_max: p.price_max } : {}),
            ...(p.price_sort ? { price_sort: p.price_sort } : {}),
          },
        };
      },
    }),

    getSpecialOfferBySlug: builder.query<SpecialOffer, string>({
      query: (slug) => ({
        url: `/special-offers/slug/${slug}`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGetSpecialOffersQuery,
  useGetSpecialOfferBySlugQuery,
} = specialOffersApi;