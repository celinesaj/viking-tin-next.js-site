import { api } from '@/store/api';
import type { Offer, OffersResponse } from '@/types/offers';

export type GetOffersParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
};

export type CreateOfferRequest = {
  name: string;
  slug?: string;
  description?: string;
  scope: string;
  discount_type: string;
  discount_value: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  products: Array<{ product_id: number }>;
  image?: File;
};

export type UpdateOfferRequest = {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  scope?: string;
  discount_type?: string;
  discount_value?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  products?: Array<{ product_id: number }>;
  image?: File;
};

function buildOfferFormData(body: Omit<CreateOfferRequest, never> | Omit<UpdateOfferRequest, 'id'>): FormData {
  const fd = new FormData();
  if ('name' in body && body.name !== undefined) fd.append('name', body.name);

  if (body.slug?.trim()) fd.append('slug', body.slug.trim());
  if (body.description?.trim()) fd.append('description', body.description.trim());

  if (body.scope !== undefined) fd.append('scope', body.scope);
  if (body.discount_type !== undefined) fd.append('discount_type', body.discount_type);
  if (body.discount_value !== undefined) fd.append('discount_value', String(body.discount_value));

  if (body.start_date?.trim()) fd.append('start_date', body.start_date.trim());
  if (body.end_date?.trim()) fd.append('end_date', body.end_date.trim());

  if (body.is_active !== undefined) fd.append('is_active', body.is_active ? 'true' : 'false');

  if (body.products !== undefined) {
    fd.append('products', JSON.stringify(body.products));
  }

  if (body.image) fd.append('image', body.image);

  return fd;
}

export const offersApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getOffers: builder.query<OffersResponse, GetOffersParams | void>({
      query: (params) => {
        const p = params ?? {};
        return {
          url: '/offers',
          method: 'GET',
          params: {
            page: p.page ?? 1,
            limit: p.limit ?? 10,
            ...(p.is_active !== undefined ? { is_active: p.is_active } : {}),
          },
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((row) => ({ type: 'Offer' as const, id: row.id })),
              { type: 'Offer' as const, id: 'LIST' },
            ]
          : [{ type: 'Offer' as const, id: 'LIST' }],
    }),

    createOffer: builder.mutation<Offer, CreateOfferRequest>({
      query: (body) => ({
        url: '/offers',
        method: 'POST',
        body: buildOfferFormData(body),
      }),
      invalidatesTags: [{ type: 'Offer', id: 'LIST' }],
    }),

    updateOffer: builder.mutation<Offer, UpdateOfferRequest>({
      query: ({ id, ...body }) => ({
        url: `/offers/${id}`,
        method: 'PATCH',
        body: buildOfferFormData(body),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Offer', id },
        { type: 'Offer', id: 'LIST' },
      ],
    }),

    deleteOffer: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/offers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Offer', id },
        { type: 'Offer', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetOffersQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
} = offersApi;
