import { api } from '@/store/api';
import type { ProductReviewAdmin, ProductReviewsAdminResponse } from '@/types/product-reviews-admin';

export type GetProductReviewsAdminParams = {
  page?: number;
  limit?: number;
};

function mapUser(raw: unknown): ProductReviewAdmin['user'] {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  const id = u.id != null ? String(u.id) : '';
  const email = typeof u.email === 'string' ? u.email : '';
  const firstName =
    typeof u.first_name === 'string'
      ? u.first_name
      : typeof u.firstName === 'string'
        ? u.firstName
        : '';
  const lastName =
    typeof u.last_name === 'string'
      ? u.last_name
      : typeof u.lastName === 'string'
        ? u.lastName
        : '';
  const name =
    typeof u.name === 'string' && u.name.trim()
      ? u.name.trim()
      : [firstName, lastName].filter(Boolean).join(' ').trim() || email || '—';
  return { id, email, firstName, lastName, name };
}

export function mapProductReviewAdminFromApi(raw: unknown): ProductReviewAdmin {
  const r =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const ratingRaw = r.rating;
  const rating =
    typeof ratingRaw === 'number'
      ? ratingRaw
      : typeof ratingRaw === 'string'
        ? Number(ratingRaw)
        : 0;

  return {
    id: r.id != null ? String(r.id) : '',
    userId: r.user_id != null ? String(r.user_id) : r.userId != null ? String(r.userId) : '',
    user: mapUser(r.user),
    rating: Number.isFinite(rating) ? rating : 0,
    title: typeof r.title === 'string' ? r.title : String(r.title ?? ''),
    comment: typeof r.comment === 'string' ? r.comment : String(r.comment ?? ''),
    isApproved: Boolean(r.is_approved ?? r.isApproved),
    itemType: typeof r.item_type === 'string' ? r.item_type : String(r.item_type ?? ''),
    itemId: r.item_id != null ? String(r.item_id) : r.itemId != null ? String(r.itemId) : '',
    itemName:
      typeof r.item_name === 'string'
        ? r.item_name
        : r.itemName != null
          ? String(r.itemName)
          : '',
    createdAt:
      r.created_at != null
        ? String(r.created_at)
        : r.createdAt != null
          ? String(r.createdAt)
          : null,
    updatedAt:
      r.updated_at != null
        ? String(r.updated_at)
        : r.updatedAt != null
          ? String(r.updatedAt)
          : null,
  };
}

function normalizeListResponse(raw: unknown): ProductReviewsAdminResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  }
  const o = raw as Record<string, unknown>;
  const dataArr = Array.isArray(o.data) ? o.data : [];
  const pag = o.pagination;
  if (pag && typeof pag === 'object') {
    const p = pag as Record<string, unknown>;
    const totalPages = Math.max(
      1,
      Number(p.totalPages ?? p.total_pages) || 1,
    );
    return {
      data: dataArr.map(mapProductReviewAdminFromApi),
      pagination: {
        page: Number(p.page) || 1,
        limit: Number(p.limit) || 10,
        total: Number(p.total) || 0,
        totalPages,
      },
    };
  }
  return {
    data: dataArr.map(mapProductReviewAdminFromApi),
    pagination: {
      page: 1,
      limit: dataArr.length || 10,
      total: dataArr.length,
      totalPages: 1,
    },
  };
}

export const productReviewsAdminApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getProductReviewsAdmin: builder.query<
      ProductReviewsAdminResponse,
      GetProductReviewsAdminParams | void
    >({
      query: (params) => {
        const p = params ?? {};
        return {
          url: '/product-reviews/admin',
          method: 'GET',
          params: {
            page: p.page ?? 1,
            limit: p.limit ?? 10,
          },
        };
      },
      transformResponse: (raw: unknown) => normalizeListResponse(raw),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((row) => ({
                type: 'ProductReviewAdmin' as const,
                id: row.id,
              })),
              { type: 'ProductReviewAdmin' as const, id: 'LIST' },
            ]
          : [{ type: 'ProductReviewAdmin' as const, id: 'LIST' }],
    }),

    deleteProductReviewAdmin: builder.mutation<{ message?: string }, string>({
      query: (id) => ({
        url: `/product-reviews/admin/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ProductReviewAdmin', id },
        { type: 'ProductReviewAdmin', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetProductReviewsAdminQuery,
  useLazyGetProductReviewsAdminQuery,
  useDeleteProductReviewAdminMutation,
} = productReviewsAdminApi;
