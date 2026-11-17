import { api } from '@/store/api';
import type { Bundle, BundlesResponse } from '@/types/bundles';
import {
  mapBundleFromApi,
  mapBundlesResponse,
  type BundleApiRow,
} from '@/features/bundles/bundleApiMaps';
export type BundlePriceSort = 'asc' | 'desc';
export type GetBundlesParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
  price_min?: number;
  price_max?: number;
  price_sort?: BundlePriceSort;
};

/** One line in the JSON `products` field (multipart). Uses snake_case to match POST /products-style DTOs. */
export type CreateBundleProductLine = {
  product_id: number;
  quantity: number;
};

export type CreateBundleRequest = {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  is_active: boolean;
  products: CreateBundleProductLine[];
  image?: File;
  gallery_images?: File[];
};

export type UpdateBundleRequest = { id: string } & CreateBundleRequest;

/** Prefer API `message` in toast after create/update; otherwise use `fallback`. */
export function bundleSuccessToastText(result: Bundle, fallback: string): string {
  const m = result.apiMessage?.trim();
  return m && m.length > 0 ? m : fallback;
}

/** Build PATCH body from a list row (e.g. toggle active without opening the drawer). */
export function buildBundleUpdateBodyFromRow(
  row: Bundle,
  overrides: Partial<{ is_active: boolean }> = {},
): CreateBundleRequest {
  const price = Number(row.price);
  const products = (row.products ?? []).map((line) => ({
    product_id: Number(line.product.id),
    quantity: Math.max(1, Math.floor(Number(line.quantity) || 1)),
  }));

  return {
    name: row.name ?? '',
    slug: row.slug?.trim() ? row.slug.trim() : undefined,
    description: row.description?.trim() ? row.description.trim() : undefined,
    price: Number.isFinite(price) ? price : 0,
    is_active: overrides.is_active ?? row.isActive,
    products,
  };
}

export function buildCreateBundleFormData(body: CreateBundleRequest): FormData {
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
  fd.append('products', JSON.stringify(body.products));
  if (body.image) {
    fd.append('image', body.image);
  }
  for (const file of body.gallery_images ?? []) {
    fd.append('gallery_images', file);
  }
  return fd;
}

export const bundlesApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getBundles: builder.query<BundlesResponse, GetBundlesParams | void>({
      query: (params) => {
        const p = params ?? {};

        return {
          url: '/bundles',
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
      transformResponse: mapBundlesResponse,
      providesTags: (result) =>
        result?.data?.length
          ? [
            ...result.data.map((row) => ({ type: 'Bundle' as const, id: row.id })),
            { type: 'Bundle' as const, id: 'LIST' },
          ]
          : [{ type: 'Bundle' as const, id: 'LIST' }],
    }),

    getBundleBySlug: builder.query<Bundle, string>({
      query: (slug) => `/bundles/slug/${slug}`,
      transformResponse: (raw: unknown) => mapBundleFromApi(raw as BundleApiRow),
      providesTags: (_result, _error, slug) => [{ type: 'Bundle' as const, id: slug }],
    }),

    createBundle: builder.mutation<Bundle, CreateBundleRequest>({
      query: (body) => ({
        url: '/bundles',
        method: 'POST',
        body: buildCreateBundleFormData(body),
      }),
      transformResponse: (raw: unknown) => mapBundleFromApi(raw as BundleApiRow),
      invalidatesTags: [{ type: 'Bundle', id: 'LIST' }],
    }),

    updateBundle: builder.mutation<Bundle, UpdateBundleRequest>({
      query: ({ id, ...body }) => ({
        url: `/bundles/${id}`,
        method: 'PATCH',
        body: buildCreateBundleFormData(body),
      }),
      transformResponse: (raw: unknown) => mapBundleFromApi(raw as BundleApiRow),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Bundle', id },
        { type: 'Bundle', id: 'LIST' },
      ],
    }),

    deleteBundle: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/bundles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Bundle', id },
        { type: 'Bundle', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetBundlesQuery,
  useLazyGetBundlesQuery,
  useGetBundleBySlugQuery,
  useCreateBundleMutation,
  useUpdateBundleMutation,
  useDeleteBundleMutation,
} = bundlesApi;
