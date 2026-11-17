import { api } from '@/store/api';
import type { Flavor, FlavorsResponse } from '@/types/flavour';
import {
  mapFlavorFromApi,
  mapFlavorsResponse,
  type FlavorApiRow,
} from '@/features/flavours/flavorApiMaps';

export type GetFlavorsParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
};

/** POST /flavors — multipart (OpenAPI): image required */
type CreateFlavorRequest = {
  name: string;
  slug: string;
  /** Omitted from dashboard UI; append only when provided (legacy / optional API). */
  category?: string;
  is_active: boolean;
  image: File;
};

type UpdateFlavorRequest = {
  id: string;
  name?: string;
  slug?: string;
  category?: string;
  is_active?: boolean;
  image?: File;
};

function buildCreateFlavorFormData(body: CreateFlavorRequest): FormData {
  const fd = new FormData();
  fd.append('name', body.name);
  fd.append('slug', body.slug);
  const cat = body.category?.trim();
  if (cat) fd.append('category', cat);
  fd.append('is_active', body.is_active ? 'true' : 'false');
  fd.append('image', body.image);
  return fd;
}

function buildPatchFlavorFormData(patch: Omit<UpdateFlavorRequest, 'id'>): FormData {
  const fd = new FormData();
  if (patch.name !== undefined) fd.append('name', patch.name);
  if (patch.slug !== undefined) fd.append('slug', patch.slug);
  if (patch.category !== undefined) fd.append('category', patch.category);
  if (patch.is_active !== undefined) {
    fd.append('is_active', patch.is_active ? 'true' : 'false');
  }
  if (patch.image) fd.append('image', patch.image);
  return fd;
}

export const flavorsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFlavors: builder.query<FlavorsResponse, GetFlavorsParams | void>({
      query: (params) => {
        const p = params ?? {};
        return {
          url: '/flavors',
          method: 'GET',
          params: {
            page: p.page ?? 1,
            limit: p.limit ?? 20,
            ...(p.is_active !== undefined ? { is_active: p.is_active } : {}),
          },
        };
      },
      transformResponse: mapFlavorsResponse,
      providesTags: (result) =>
        result?.data?.length
          ? [
            ...result.data.map((row) => ({ type: 'Flavor' as const, id: row.id })),
            { type: 'Flavor' as const, id: 'LIST' },
          ]
          : [{ type: 'Flavor' as const, id: 'LIST' }],
    }),

    getFlavorBySlug: builder.query<Flavor, string>({
      query: (slug) => `/flavors/slug/${slug}`,
      transformResponse: (raw: unknown) => mapFlavorFromApi(raw as FlavorApiRow),
    }),

    createFlavor: builder.mutation<Flavor, CreateFlavorRequest>({
      query: (body) => ({
        url: '/flavors',
        method: 'POST',
        body: buildCreateFlavorFormData(body),
      }),
      transformResponse: (raw: unknown) => mapFlavorFromApi(raw as FlavorApiRow),
      invalidatesTags: [{ type: 'Flavor', id: 'LIST' }],
    }),

    updateFlavor: builder.mutation<Flavor, UpdateFlavorRequest>({
      query: ({ id, ...patch }) => ({
        url: `/flavors/${id}`,
        method: 'PATCH',
        body: buildPatchFlavorFormData(patch),
      }),
      transformResponse: (raw: unknown) => mapFlavorFromApi(raw as FlavorApiRow),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Flavor', id },
        { type: 'Flavor', id: 'LIST' },
      ],
    }),

    deleteFlavor: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/flavors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Flavor', id },
        { type: 'Flavor', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetFlavorsQuery,
  useLazyGetFlavorsQuery,
  useGetFlavorBySlugQuery,
  useCreateFlavorMutation,
  useUpdateFlavorMutation,
  useDeleteFlavorMutation,
} = flavorsApi;
