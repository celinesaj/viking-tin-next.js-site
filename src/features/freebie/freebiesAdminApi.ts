import { api } from '@/store/api';
import { mapProductFromApi, type ProductApiRow } from '@/features/products/productApiMaps';
import type { Product } from '@/types/products';

export type AdminFreebieProductRow = {
  id: string;
  productId: string;
  product: Product;
  sortOrder: number;
  createdAt: string;
};

export type AdminFreebieEligibilityRow = {
  id: string;
  userId: string;
  isEligible: boolean;
  usedAt: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminFreebieEligibilityListPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminFreebieEligibilityListResponse = {
  data: AdminFreebieEligibilityRow[];
  pagination: AdminFreebieEligibilityListPagination;
};

export type GetAdminFreebieEligibilityParams = {
  page?: number;
  limit?: number;
};

type FreebieProductApiRow = {
  id?: string | number;
  productId?: string | number;
  product_id?: string | number;
  product?: ProductApiRow;
  sortOrder?: number;
  sort_order?: number;
  createdAt?: string | null;
  created_at?: string | null;
};

function mapAdminFreebieProductRow(raw: FreebieProductApiRow): AdminFreebieProductRow {
  const product = (raw.product ?? { name: '' }) as ProductApiRow;
  return {
    id: String(raw.id ?? ''),
    productId: String(raw.productId ?? raw.product_id ?? ''),
    product: mapProductFromApi(product),
    sortOrder: Number(raw.sortOrder ?? raw.sort_order ?? 0),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
  };
}

function mapEligibilityRow(raw: Record<string, unknown>): AdminFreebieEligibilityRow {
  const reason = raw.reason;
  const usedAt = raw.usedAt ?? raw.used_at;
  return {
    id: String(raw.id ?? ''),
    userId: String(raw.userId ?? raw.user_id ?? ''),
    isEligible: Boolean(raw.isEligible ?? raw.is_eligible ?? false),
    usedAt: typeof usedAt === 'string' || usedAt === null ? usedAt : null,
    reason: typeof reason === 'string' || reason === null ? reason : null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
  };
}

function normalizeEligibilityListResponse(raw: unknown): AdminFreebieEligibilityListResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  }
  const o = raw as Record<string, unknown>;
  const dataArr = Array.isArray(o.data)
    ? o.data
    : Array.isArray(o.rows)
      ? o.rows
      : [];
  const pag = o.pagination;
  if (pag && typeof pag === 'object') {
    const p = pag as Record<string, unknown>;
    const totalPages = Math.max(
      1,
      Number(p.totalPages ?? p.total_pages) || 1,
    );
    return {
      data: (dataArr as Record<string, unknown>[]).map((row) =>
        mapEligibilityRow(row),
      ),
      pagination: {
        page: Number(p.page) || 1,
        limit: Number(p.limit) || 10,
        total: Number(p.total) || 0,
        totalPages,
      },
    };
  }
  return {
    data: (dataArr as Record<string, unknown>[]).map((row) => mapEligibilityRow(row)),
    pagination: {
      page: 1,
      limit: dataArr.length || 10,
      total: dataArr.length,
      totalPages: 1,
    },
  };
}

export type AddAdminFreebieProductBody = {
  product_id: string;
  sort_order: number;
};

export type GrantAdminFreebieEligibilityBody = {
  user_id: string;
  reason?: string;
};

export type AdminFreebieConfig = {
  id: string;
  maxFreeItems: number;
  isActive: boolean;
  updatedAt: string | null;
};

/** Body for PATCH /freebies/admin/config (snake_case per API). */
export type PatchAdminFreebieConfigBody = {
  max_free_items: number;
  is_active: boolean;
};

function mapAdminFreebieConfig(raw: Record<string, unknown>): AdminFreebieConfig {
  const maxRaw = raw.maxFreeItems ?? raw.max_free_items;
  const activeRaw = raw.isActive ?? raw.is_active;
  const updated = raw.updatedAt ?? raw.updated_at;
  const maxNum = Number(maxRaw);
  return {
    id: String(raw.id ?? ''),
    maxFreeItems: Number.isFinite(maxNum) ? maxNum : 0,
    isActive: Boolean(activeRaw ?? false),
    updatedAt: typeof updated === 'string' ? updated : null,
  };
}

export const freebiesAdminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminFreebieConfig: builder.query<AdminFreebieConfig, void>({
      query: () => ({
        url: '/freebies/admin/config',
        method: 'GET',
      }),
      transformResponse: (raw: unknown) =>
        mapAdminFreebieConfig(
          raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {},
        ),
      providesTags: [{ type: 'FreebieAdminConfig', id: 'CONFIG' }],
    }),

    patchAdminFreebieConfig: builder.mutation<void, PatchAdminFreebieConfigBody>({
      query: (body) => ({
        url: '/freebies/admin/config',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'FreebieAdminConfig', id: 'CONFIG' }],
    }),

    getAdminFreebieProducts: builder.query<AdminFreebieProductRow[], void>({
      query: () => ({
        url: '/freebies/admin/products',
        method: 'GET',
      }),
      transformResponse: (response: FreebieProductApiRow[]) =>
        Array.isArray(response) ? response.map(mapAdminFreebieProductRow) : [],
      providesTags: [{ type: 'FreebieAdminProducts', id: 'LIST' }],
    }),

    addAdminFreebieProduct: builder.mutation<AdminFreebieProductRow, AddAdminFreebieProductBody>({
      query: (body) => ({
        url: '/freebies/admin/products',
        method: 'POST',
        body,
      }),
      transformResponse: (raw: FreebieProductApiRow) => mapAdminFreebieProductRow(raw),
      invalidatesTags: [{ type: 'FreebieAdminProducts', id: 'LIST' }],
    }),

    deleteAdminFreebieProduct: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/freebies/admin/products/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'FreebieAdminProducts', id: 'LIST' }],
    }),

    grantAdminFreebieEligibility: builder.mutation<
      AdminFreebieEligibilityRow,
      GrantAdminFreebieEligibilityBody
    >({
      query: (body) => ({
        url: '/freebies/admin/eligibility',
        method: 'POST',
        body,
      }),
      transformResponse: (raw: Record<string, unknown>) => mapEligibilityRow(raw),
      invalidatesTags: [{ type: 'FreebieAdminEligibility', id: 'LIST' }],
    }),

    revokeAdminFreebieEligibility: builder.mutation<void, { userId: string }>({
      query: ({ userId }) => ({
        url: `/freebies/admin/eligibility/${encodeURIComponent(userId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'FreebieAdminEligibility', id: 'LIST' }],
    }),

    getAdminFreebieEligibility: builder.query<
      AdminFreebieEligibilityListResponse,
      GetAdminFreebieEligibilityParams | void
    >({
      query: (params) => {
        const p = params ?? {};
        return {
          url: '/freebies/admin/eligibility',
          method: 'GET',
          params: {
            page: String(p.page ?? 1),
            limit: String(p.limit ?? 10),
          },
        };
      },
      transformResponse: (raw: unknown) => normalizeEligibilityListResponse(raw),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((row) => ({
                type: 'FreebieAdminEligibility' as const,
                id: row.userId,
              })),
              { type: 'FreebieAdminEligibility' as const, id: 'LIST' },
            ]
          : [{ type: 'FreebieAdminEligibility' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminFreebieConfigQuery,
  usePatchAdminFreebieConfigMutation,
  useGetAdminFreebieProductsQuery,
  useAddAdminFreebieProductMutation,
  useDeleteAdminFreebieProductMutation,
  useGrantAdminFreebieEligibilityMutation,
  useRevokeAdminFreebieEligibilityMutation,
  useGetAdminFreebieEligibilityQuery,
} = freebiesAdminApi;
