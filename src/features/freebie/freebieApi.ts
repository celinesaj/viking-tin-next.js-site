// features/freebie/freebieApi.ts

import { api } from '@/store/api';
import { FreebieConfig, FreebieEligibility, FreebieProduct } from '@/types/freebie';

function mapProduct(raw: any): FreebieProduct {
  return {
    id: String(raw.id),
    name: raw.name,
    slug: raw.slug,
    price: Number(raw.price),
    imageUrl: raw.cover_image_url || raw.cover_gif_url || '/images/placeholder.png',
    description: raw.description || '',
  };
}

export const freebieApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFreebieConfig: builder.query<FreebieConfig, void>({
      query: () => '/api/freebies/max-items',
      transformResponse: (response: any) => ({
        maxFreeItems: response.max_free_items,
        isActive: response.is_active,
      }),
    }),

    getFreebieEligibility: builder.query<FreebieEligibility, void>({
      query: () => '/api/freebies/catalog',
      transformResponse: (response: any) => ({
        eligible: response.eligible,
        maxFreeItems: response.max_free_items,
        products: (response.products || []).map(mapProduct),
      }),
      providesTags: ['Eligibility'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetFreebieConfigQuery,
  useGetFreebieEligibilityQuery,
} = freebieApi;