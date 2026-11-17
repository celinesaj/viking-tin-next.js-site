import { api } from '@/store/api';
import type { SpecialOffer, SpecialOffersResponse } from '@/types/specialOffers';
import {
  mapSpecialOfferFromApi,
  mapSpecialOffersResponse,
  type SpecialOfferApiRow,
} from '@/features/specialOffers/specialOfferApiMaps';

export type GetSpecialOffersParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
};

export type CreateSpecialOfferProductLine = {
  product_id: number;
  quantity: number;
  origin_price: number;
};

export type CreateSpecialOfferRequest = {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  is_active: boolean;
  products: CreateSpecialOfferProductLine[];
  start_date?: string;
  end_date?: string;
  image?: File;
  gallery_images?: File[];
};

export type UpdateSpecialOfferRequest = { id: string } & CreateSpecialOfferRequest;

export function specialOfferSuccessToastText(result: SpecialOffer, fallback: string): string {
  const m = result.apiMessage?.trim();
  return m && m.length > 0 ? m : fallback;
}

export function buildSpecialOfferUpdateBodyFromRow(
  row: SpecialOffer,
  overrides: Partial<{ is_active: boolean }> = {},
): CreateSpecialOfferRequest {
  const price = Number(row.price);
  const products = (row.products ?? []).map((line) => ({
    product_id: Number(line.product.id),
    quantity: Math.max(1, Math.floor(Number(line.quantity) || 1)),
    origin_price: Math.max(0, Number(line.product.price ?? 0) || 0),
  }));

  return {
    name: row.name ?? '',
    slug: row.slug?.trim() ? row.slug.trim() : undefined,
    description: row.description?.trim() ? row.description.trim() : undefined,
    price: Number.isFinite(price) ? price : 0,
    is_active: overrides.is_active ?? row.isActive,
    products,
    start_date: row.startDate ?? undefined,
    end_date: row.endDate ?? undefined,
  };
}

export function buildCreateSpecialOfferFormData(body: CreateSpecialOfferRequest): FormData {
  const fd = new FormData();
  fd.append('name', body.name);
  if (body.slug !== undefined && body.slug.trim() !== '') {
    fd.append('slug', body.slug.trim());
  }
  if (body.description !== undefined && body.description.trim() !== '') {
    fd.append('description', body.description.trim());
  }
  fd.append('price', String(body.price));
  fd.append('is_active', body.is_active ? 'true' : 'false');
  if (body.start_date !== undefined && body.start_date.trim() !== '') {
    fd.append('start_date', body.start_date.trim());
  }
  if (body.end_date !== undefined && body.end_date.trim() !== '') {
    fd.append('end_date', body.end_date.trim());
  }
  fd.append('products', JSON.stringify(body.products));
  if (body.image) {
    fd.append('image', body.image);
  }
  for (const file of body.gallery_images ?? []) {
    fd.append('gallery_images', file);
  }
  return fd;
}

export const specialOffersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSpecialOffers: builder.query<SpecialOffersResponse, GetSpecialOffersParams | void>({
      query: (params) => {
        const p = params ?? {};
        return {
          url: '/special-offers',
          method: 'GET',
          params: {
            page: p.page ?? 1,
            limit: p.limit ?? 10,
            ...(p.is_active !== undefined ? { is_active: p.is_active } : {}),
          },
        };
      },
      transformResponse: mapSpecialOffersResponse,
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((row) => ({ type: 'SpecialOffer' as const, id: row.id })),
              { type: 'SpecialOffer' as const, id: 'LIST' },
            ]
          : [{ type: 'SpecialOffer' as const, id: 'LIST' }],
    }),

    createSpecialOffer: builder.mutation<SpecialOffer, CreateSpecialOfferRequest>({
      query: (body) => ({
        url: '/special-offers',
        method: 'POST',
        body: buildCreateSpecialOfferFormData(body),
      }),
      transformResponse: (raw: unknown) => mapSpecialOfferFromApi(raw as SpecialOfferApiRow),
      invalidatesTags: [{ type: 'SpecialOffer', id: 'LIST' }],
    }),

    updateSpecialOffer: builder.mutation<SpecialOffer, UpdateSpecialOfferRequest>({
      query: ({ id, ...body }) => ({
        url: `/special-offers/${id}`,
        method: 'PATCH',
        body: buildCreateSpecialOfferFormData(body),
      }),
      transformResponse: (raw: unknown) => mapSpecialOfferFromApi(raw as SpecialOfferApiRow),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'SpecialOffer', id },
        { type: 'SpecialOffer', id: 'LIST' },
      ],
    }),

    deleteSpecialOffer: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/special-offers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'SpecialOffer', id },
        { type: 'SpecialOffer', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetSpecialOffersQuery,
  useLazyGetSpecialOffersQuery,
  useCreateSpecialOfferMutation,
  useUpdateSpecialOfferMutation,
  useDeleteSpecialOfferMutation,
} = specialOffersApi;
