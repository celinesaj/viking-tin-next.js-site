import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { api } from '@/store/api';
import { readEmptySafeJsonResponse } from '@/lib/extractServerMessage';
import type { Product, ProductsResponse, ProductWhyChoose, ProductWhyChooseRow } from '@/types/products';
import {
  mapProductFromApi,
  mapProductsResponse,
  type ProductApiRow,
} from '@/features/products/productApiMaps';

/** POST /products — multipart/form-data */
export type CreateProductRequest = {
  brand_id: number;
  flavor_id: number;
  strength_id: number;
  name: string;
  slug?: string;
  nicotine_mg: number;
  price: number;
  compare_price?: number;

  offer_price?: number;
  offer_percentage?: number;
  offer_discount_amount?: number;

  stock: number;
  description?: string;
  pouch_count?: number;
  weight_grams?: number;
  manufacturer?: string;
  meta_title?: string;
  meta_description?: string;
  hook?: string;
  is_active: boolean;
  is_best_selling: boolean;
  media?: File[];
  /** Static cover: JPEG, PNG, WebP (not GIF — use cover_gif). */
  cover_image?: File;
  /** Motion cover: animated GIF or MP4/WebM/MOV (field name kept for API). */
  cover_gif?: File;
};

function buildCreateProductFormData(body: CreateProductRequest): FormData {
  const fd = new FormData();

  fd.append('brand_id', String(body.brand_id));
  fd.append('flavor_id', String(body.flavor_id));
  fd.append('strength_id', String(body.strength_id));
  fd.append('name', body.name);

  if (body.slug !== undefined && body.slug.trim() !== '') {
    fd.append('slug', body.slug.trim());
  }

  fd.append('nicotine_mg', String(body.nicotine_mg));
  fd.append('price', String(body.price));

  if (body.compare_price !== undefined) {
    fd.append('compare_price', String(body.compare_price));
  }

  if (body.offer_price !== undefined) {
    fd.append('offer_price', String(body.offer_price));
  }

  if (body.offer_percentage !== undefined) {
    fd.append('offer_percentage', String(body.offer_percentage));
  }

  if (body.offer_discount_amount !== undefined) {
    fd.append('offer_discount_amount', String(body.offer_discount_amount));
  }

  fd.append('stock', String(body.stock));

  if (body.description !== undefined && body.description.trim() !== '') {
    fd.append('description', body.description.trim());
  }

  if (body.pouch_count !== undefined) {
    fd.append('pouch_count', String(body.pouch_count));
  }

  if (body.weight_grams !== undefined) {
    fd.append('weight_grams', String(body.weight_grams));
  }

  if (body.manufacturer !== undefined && body.manufacturer.trim() !== '') {
    fd.append('manufacturer', body.manufacturer.trim());
  }
  if (body.meta_title !== undefined && body.meta_title.trim() !== '') {
    fd.append('meta_title', body.meta_title.trim());
  }
  if (body.meta_description !== undefined && body.meta_description.trim() !== '') {
    fd.append('meta_description', body.meta_description.trim());
  }
  if (body.hook !== undefined && body.hook.trim() !== '') {
    fd.append('hook', body.hook.trim());
  }

  fd.append('is_active', body.is_active ? 'true' : 'false');
  fd.append('is_best_selling', body.is_best_selling ? 'true' : 'false');

  for (const file of body.media ?? []) {
    fd.append('media', file);
  }
  if (body.cover_image) {
    fd.append('cover_image', body.cover_image);
  }
  if (body.cover_gif) {
    fd.append('cover_gif', body.cover_gif);
  }
  return fd;
}

/** Build PATCH multipart body from a list row */
export function buildProductMultipartBodyFromRow(
  row: Product,
  overrides: Partial<Pick<CreateProductRequest, 'is_active' | 'is_best_selling'>> = {},
): CreateProductRequest {
  const nicotine = Number(row.nicotineMg);
  const price = Number(row.price);

  const compareRaw =
    row.comparePrice != null && String(row.comparePrice).trim() !== ''
      ? Number(row.comparePrice)
      : undefined;

  const offerPriceRaw =
    row.offer_price != null && String(row.offer_price).trim() !== ''
      ? Number(row.offer_price)
      : undefined;

  const offerPercentageRaw =
    row.offer_percentage != null && String(row.offer_percentage).trim() !== ''
      ? Number(row.offer_percentage)
      : undefined;

  const offerDiscountAmountRaw =
    row.offer_discount_amount != null &&
    String(row.offer_discount_amount).trim() !== ''
      ? Number(row.offer_discount_amount)
      : undefined;

  return {
    brand_id: Number(row.brandId),
    flavor_id: Number(row.flavorId),
    strength_id: Number(row.strengthId),
    name: row.name,
    slug: row.slug?.trim() ? row.slug.trim() : undefined,
    nicotine_mg: Number.isFinite(nicotine) ? nicotine : 0,
    price: Number.isFinite(price) ? price : 0,
    compare_price:
      compareRaw !== undefined && Number.isFinite(compareRaw)
        ? compareRaw
        : undefined,
    offer_price:
      offerPriceRaw !== undefined && Number.isFinite(offerPriceRaw)
        ? offerPriceRaw
        : undefined,
    offer_percentage:
      offerPercentageRaw !== undefined && Number.isFinite(offerPercentageRaw)
        ? offerPercentageRaw
        : undefined,
    offer_discount_amount:
      offerDiscountAmountRaw !== undefined &&
      Number.isFinite(offerDiscountAmountRaw)
        ? offerDiscountAmountRaw
        : undefined,
    stock: row.stock,
    description: row.description?.trim() ? row.description.trim() : undefined,
    pouch_count: row.pouchCount,
    weight_grams: row.weightGrams,
    manufacturer: row.manufacturer?.trim() ? row.manufacturer.trim() : undefined,
    meta_title: row.metaTitle?.trim() ? row.metaTitle.trim() : undefined,
    meta_description: row.metaDescription?.trim() ? row.metaDescription.trim() : undefined,
    hook: row.hook?.trim() ? row.hook.trim() : undefined,
    is_active: overrides.is_active ?? row.isActive,
    is_best_selling: overrides.is_best_selling ?? (row.isBestSelling ?? false),
  };
}

export type UpdateProductRequest = { id: string } & CreateProductRequest;

export type DeleteProductMediaArgs = { productId: string; mediaId: string };

export type GetProductsParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
  /** Backend query name (OpenAPI typo): 1 = true, 0 = false */
  isBestSeling?: 0 | 1;
  flavor_slug?: string;
  brand_slug?: string;
  strength_slug?: string;
  price_sort?: 'asc' | 'desc';
};

/** When no global `NEXT_PUBLIC_API_PATH_PREFIX`, try `/api/products/...` after bare `/products/...` (Nest global prefix). */
function expandCoverDeleteAttempts(paths: string[]): string[] {
  const hasGlobalPrefix = Boolean(process.env.NEXT_PUBLIC_API_PATH_PREFIX?.trim());
  if (hasGlobalPrefix) return [...paths];
  const extra: string[] = [];
  for (const p of paths) {
    if (p.startsWith('/products/')) {
      extra.push(`/api${p}`);
    }
  }
  return [...paths, ...extra];
}

function coverImageDeletePaths(productId: string): string[] {
  const pid = encodeURIComponent(productId);
  return expandCoverDeleteAttempts([
    `/products/${pid}/cover-image`,
    `/products/${pid}/cover_image`,
  ]);
}

function coverGifDeletePaths(productId: string): string[] {
  const pid = encodeURIComponent(productId);
  return expandCoverDeleteAttempts([
    `/products/${pid}/cover-gif`,
    `/products/${pid}/cover_gif`,
  ]);
}

type ProductWhyChooseApiRow = {
  id: string;
  productId?: string;
  product_id?: string;
  reason: string;
  sortOrder?: number;
  sort_order?: number;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
};

function mapProductWhyChooseFromApi(raw: ProductWhyChooseApiRow): ProductWhyChooseRow {
  const productId = raw.productId ?? raw.product_id ?? '';
  const sortOrder = raw.sortOrder ?? raw.sort_order ?? 0;
  const isActive = raw.isActive ?? raw.is_active ?? true;
  const createdAt = raw.createdAt ?? raw.created_at ?? '';
  return {
    id: String(raw.id),
    productId: String(productId),
    reason: String(raw.reason ?? ''),
    sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    isActive: Boolean(isActive),
    createdAt: String(createdAt),
  };
}

export type AddProductWhyChooseBody = {
  reason: string;
  sort_order: number;
  is_active: boolean;
};

export type UpdateProductWhyChooseArgs = {
  productId: string;
  whyChooseId: string;
  body: AddProductWhyChooseBody;
};

export const productsApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getProducts: builder.query<ProductsResponse, GetProductsParams | void>({
      query: (params) => {
        const p = params ?? {};

        return {
          url: '/products',
          method: 'GET',
          params: {
            page: p.page ?? 1,
            limit: p.limit ?? 20,
            ...(p.is_active !== undefined ? { is_active: p.is_active } : {}),
            ...(p.isBestSeling !== undefined
              ? { isBestSeling: p.isBestSeling }
              : {}),
            ...(p.flavor_slug?.trim()
              ? { flavor_slug: p.flavor_slug.trim() }
              : {}),
            ...(p.brand_slug?.trim() ? { brand_slug: p.brand_slug.trim() } : {}),
            ...(p.strength_slug?.trim()
              ? { strength_slug: p.strength_slug.trim() }
              : {}),
            ...(p.price_sort ? { price_sort: p.price_sort } : {}),
          },
        };
      },
      transformResponse: mapProductsResponse,
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((row) => ({ type: 'Product' as const, id: row.id })),
              { type: 'Product' as const, id: 'LIST' },
            ]
          : [{ type: 'Product' as const, id: 'LIST' }],
    }),

    getProductBySlug: builder.query<Product, string>({
      query: (slug) => `/products/slug/${slug}`,
      transformResponse: (raw: unknown) => mapProductFromApi(raw as ProductApiRow),
      keepUnusedDataFor: 600,
      providesTags: (_result, _error, slug) => [
        { type: 'Product' as const, id: `slug-${slug}` },
      ],
    }),

    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body: buildCreateProductFormData(body),
      }),
      transformResponse: (raw: unknown) => mapProductFromApi(raw as ProductApiRow),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    updateProduct: builder.mutation<Product, UpdateProductRequest>({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: buildCreateProductFormData(body),
      }),
      transformResponse: (raw: unknown) => mapProductFromApi(raw as ProductApiRow),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    deleteProductMedia: builder.mutation<{ message?: string }, DeleteProductMediaArgs>({
      query: ({ productId, mediaId }) => ({
        url: `/products/${encodeURIComponent(String(productId).trim())}/media/${encodeURIComponent(String(mediaId).trim())}`,
        method: 'DELETE',
        responseHandler: readEmptySafeJsonResponse,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: 'Product', id: productId },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    deleteProductCoverImage: builder.mutation<Product, string>({
      async queryFn(id, _api, _extraOptions, baseQuery) {
        const pid = String(id).trim();
        if (!pid) {
          return {
            error: {
              status: 400,
              data: 'Missing product id',
            } as FetchBaseQueryError,
          };
        }
        const paths = coverImageDeletePaths(pid);
        let lastError: FetchBaseQueryError | undefined;
        for (const url of paths) {
          const res = await baseQuery({
            url,
            method: 'DELETE',
          });
          if (!res.error) {
            return { data: mapProductFromApi(res.data as ProductApiRow) };
          }
          lastError = res.error;
          if (res.error.status !== 404) break;
        }
        return { error: lastError ?? ({ status: 404, data: 'Not Found' } as FetchBaseQueryError) };
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    deleteProductCoverGif: builder.mutation<Product, string>({
      async queryFn(id, _api, _extraOptions, baseQuery) {
        const pid = String(id).trim();
        if (!pid) {
          return {
            error: {
              status: 400,
              data: 'Missing product id',
            } as FetchBaseQueryError,
          };
        }
        const paths = coverGifDeletePaths(pid);
        let lastError: FetchBaseQueryError | undefined;
        for (const url of paths) {
          const res = await baseQuery({
            url,
            method: 'DELETE',
          });
          if (!res.error) {
            return { data: mapProductFromApi(res.data as ProductApiRow) };
          }
          lastError = res.error;
          if (res.error.status !== 404) break;
        }
        return { error: lastError ?? ({ status: 404, data: 'Not Found' } as FetchBaseQueryError) };
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    deleteProduct: builder.mutation<{ message?: string } | null, string>({
      query: (id) => ({
        url: `/products/${encodeURIComponent(String(id).trim())}`,
        method: 'DELETE',
        responseHandler: readEmptySafeJsonResponse,
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    getProductWhyChoose: builder.query<ProductWhyChooseRow[], string>({
      query: (productId) => `/products/${encodeURIComponent(productId)}/why-choose`,
      transformResponse: (raw: unknown) => {
        if (!Array.isArray(raw)) return [];
        return raw.map((row) =>
          mapProductWhyChooseFromApi(row as ProductWhyChooseApiRow),
        );
      },
      providesTags: (_result, _error, productId) => [
        { type: 'ProductWhyChoose' as const, id: productId },
      ],
    }),

    addProductWhyChoose: builder.mutation<
      ProductWhyChooseRow,
      { productId: string; body: AddProductWhyChooseBody }
    >({
      query: ({ productId, body }) => ({
        url: `/products/${encodeURIComponent(productId)}/why-choose`,
        method: 'POST',
        body,
      }),
      transformResponse: (raw: unknown) =>
        mapProductWhyChooseFromApi(raw as ProductWhyChooseApiRow),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: 'ProductWhyChoose' as const, id: productId },
      ],
    }),

    updateProductWhyChoose: builder.mutation<
      ProductWhyChooseRow,
      UpdateProductWhyChooseArgs
    >({
      query: ({ productId, whyChooseId, body }) => ({
        url: `/products/${encodeURIComponent(productId)}/why-choose/${encodeURIComponent(whyChooseId)}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (raw: unknown) =>
        mapProductWhyChooseFromApi(raw as ProductWhyChooseApiRow),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: 'ProductWhyChoose' as const, id: productId },
      ],
    }),

    deleteProductWhyChoose: builder.mutation<
      { message?: string } | void,
      { productId: string; whyChooseId: string }
    >({
      query: ({ productId, whyChooseId }) => ({
        url: `/products/${encodeURIComponent(productId)}/why-choose/${encodeURIComponent(whyChooseId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: 'ProductWhyChoose' as const, id: productId },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useGetProductBySlugQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMediaMutation,
  useDeleteProductCoverImageMutation,
  useDeleteProductCoverGifMutation,
  useDeleteProductMutation,
  useGetProductWhyChooseQuery,
  useAddProductWhyChooseMutation,
  useUpdateProductWhyChooseMutation,
  useDeleteProductWhyChooseMutation,
} = productsApi;