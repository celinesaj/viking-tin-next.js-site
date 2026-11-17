import { apiSlice } from '@/app/dashboard/redux/api/ApiSlice';

export type AdminCoupon = {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed' | string;
  discountValue: string;
  startDate: string;
  endDate: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminCouponsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminCouponsResponse = {
  data: AdminCoupon[];
  pagination: AdminCouponsPagination;
};

export type AdminCouponsQueryArgs = {
  page?: number;
  limit?: number;
};

/** Body for POST /coupons/admin (snake_case per API) */
export type CreateAdminCouponRequest = {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  min_order_amount: number;
  max_discount_amount: number;
  usage_limit: number;
  is_active: boolean;
};

export type WhitelistUserForCouponRequest = {
  couponId: string;
  user_id: number;
};

export type UpdateAdminCouponRequest = {
  id: string;
  body: CreateAdminCouponRequest;
};

export type RemoveWhitelistUserRequest = {
  couponId: string;
  /** Path segment as returned by the API (numeric id as string is fine). */
  userId: string;
};

export type AdminCouponUsageRow = {
  id: string;
  couponId: string;
  /** From API: coupon_code (e.g. SAVE10) */
  couponCode: string;
  userId: string;
  /** From API: user_name */
  userName: string;
  orderId: string;
  usedAt: string;
  discountAmountApplied: string;
};

export type AdminCouponUsageResponse = {
  data: AdminCouponUsageRow[];
  pagination: AdminCouponsPagination;
};

export type AdminCouponUsageQueryArgs = {
  page?: number;
  limit?: number;
  /** Filter by coupon id (API: bigint as string) */
  coupon_id?: string;
};

/** Row from GET /coupons/admin/:id/storefront-users */
export type AdminCouponStorefrontUserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string | null;
  /** User redeemed this coupon at least once (coupon_usage). */
  hasCoupon: boolean;
  isWhitelisted: boolean;
  whitelistAddedAt: string | null;
  createdAt: string | null;
};

export type AdminCouponStorefrontUsersResponse = {
  couponId: string;
  couponCode: string;
  couponHasWhitelist: boolean;
  data: AdminCouponStorefrontUserRow[];
  pagination: AdminCouponsPagination;
};

export type AdminCouponStorefrontUsersQueryArgs = {
  couponId: string;
  page?: number;
  limit?: number;
  /** Substring match on email (case-insensitive, API ILIKE). */
  email?: string;
  /** Substring match on first/last/display name (case-insensitive, API ILIKE). */
  name?: string;
};

function mapAdminCouponUsageRowFromApi(raw: unknown): AdminCouponUsageRow {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: String(r.id ?? ''),
    couponId: String(r.couponId ?? r.coupon_id ?? ''),
    couponCode:
      typeof r.coupon_code === 'string'
        ? r.coupon_code
        : typeof r.couponCode === 'string'
          ? r.couponCode
          : '',
    userId: String(r.userId ?? r.user_id ?? ''),
    userName:
      typeof r.user_name === 'string'
        ? r.user_name
        : typeof r.userName === 'string'
          ? r.userName
          : '',
    orderId: String(r.orderId ?? r.order_id ?? ''),
    usedAt: String(r.usedAt ?? r.used_at ?? ''),
    discountAmountApplied: String(
      r.discountAmountApplied ?? r.discount_amount_applied ?? '0',
    ),
  };
}

function normalizeCouponUsageResponse(raw: unknown): AdminCouponUsageResponse {
  if (!raw || typeof raw !== 'object') {
    return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } };
  }
  const o = raw as Record<string, unknown>;
  const dataArr = Array.isArray(o.data) ? o.data : [];
  const pag = o.pagination;
  if (pag && typeof pag === 'object') {
    const p = pag as Record<string, unknown>;
    return {
      data: dataArr.map(mapAdminCouponUsageRowFromApi),
      pagination: {
        page: Number(p.page) || 1,
        limit: Number(p.limit) || 20,
        total: Number(p.total) || 0,
        totalPages: Math.max(1, Number(p.totalPages ?? p.total_pages) || 1),
      },
    };
  }
  return {
    data: dataArr.map(mapAdminCouponUsageRowFromApi),
    pagination: {
      page: 1,
      limit: 20,
      total: dataArr.length,
      totalPages: 1,
    },
  };
}

function mapAdminCouponStorefrontUserRowFromApi(raw: unknown): AdminCouponStorefrontUserRow {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const phoneRaw = r.phone;
  const phone =
    phoneRaw === null || phoneRaw === undefined
      ? null
      : typeof phoneRaw === 'string'
        ? phoneRaw
        : String(phoneRaw);
  const wl =
    r.whitelist_added_at != null
      ? String(r.whitelist_added_at)
      : r.whitelistAddedAt != null
        ? String(r.whitelistAddedAt)
        : null;
  const created =
    r.created_at != null ? String(r.created_at) : r.createdAt != null ? String(r.createdAt) : null;

  const firstName =
    typeof r.first_name === 'string'
      ? r.first_name
      : typeof r.firstName === 'string'
        ? r.firstName
        : '';
  const lastName =
    typeof r.last_name === 'string'
      ? r.last_name
      : typeof r.lastName === 'string'
        ? r.lastName
        : '';
  const email = typeof r.email === 'string' ? r.email : String(r.email ?? '');
  const nameFromParts = `${firstName} ${lastName}`.trim();
  const displayName =
    typeof r.name === 'string' && r.name.trim() ? r.name.trim() : nameFromParts || email;

  return {
    id: r.id != null ? String(r.id) : '',
    email,
    firstName,
    lastName,
    name: displayName,
    phone,
    hasCoupon: Boolean(r.has_coupon ?? r.hasCoupon),
    isWhitelisted: Boolean(r.is_whitelisted ?? r.isWhitelisted),
    whitelistAddedAt: wl && wl !== 'null' ? wl : null,
    createdAt: created && created !== 'null' ? created : null,
  };
}

function normalizeCouponStorefrontUsersResponse(raw: unknown): AdminCouponStorefrontUsersResponse {
  const emptyPag = { page: 1, limit: 20, total: 0, totalPages: 1 };
  if (!raw || typeof raw !== 'object') {
    return {
      couponId: '',
      couponCode: '',
      couponHasWhitelist: false,
      data: [],
      pagination: emptyPag,
    };
  }
  const o = raw as Record<string, unknown>;
  const dataArr = Array.isArray(o.data) ? o.data : [];
  const pag = o.pagination;
  let pagination = emptyPag;
  if (pag && typeof pag === 'object') {
    const p = pag as Record<string, unknown>;
    pagination = {
      page: Number(p.page) || 1,
      limit: Number(p.limit) || 20,
      total: Number(p.total) || 0,
      totalPages: Math.max(1, Number(p.totalPages ?? p.total_pages) || 1),
    };
  }
  return {
    couponId: String(o.coupon_id ?? o.couponId ?? ''),
    couponCode:
      typeof o.coupon_code === 'string'
        ? o.coupon_code
        : typeof o.couponCode === 'string'
          ? o.couponCode
          : '',
    couponHasWhitelist: Boolean(o.coupon_has_whitelist ?? o.couponHasWhitelist),
    data: dataArr.map(mapAdminCouponStorefrontUserRowFromApi),
    pagination,
  };
}

export const couponsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminCouponUsage: builder.query<AdminCouponUsageResponse, AdminCouponUsageQueryArgs>({
      query: ({ page = 1, limit = 20, coupon_id }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (coupon_id?.trim()) params.set('coupon_id', coupon_id.trim());
        return {
          url: `/coupons/admin/usage?${params.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: (raw: unknown) => normalizeCouponUsageResponse(raw),
      providesTags: [{ type: 'DashboardCouponUsage' as const, id: 'LIST' }],
    }),
    getAdminCoupons: builder.query<AdminCouponsResponse, AdminCouponsQueryArgs>({
      query: ({ page = 1, limit = 20 }) => ({
        url: `/coupons/admin?page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(String(limit))}`,
        method: 'GET',
      }),
      providesTags: [{ type: 'DashboardCoupons' as const, id: 'LIST' }],
    }),
    getAdminCouponStorefrontUsers: builder.query<
      AdminCouponStorefrontUsersResponse,
      AdminCouponStorefrontUsersQueryArgs
    >({
      query: ({ couponId, page = 1, limit = 20, email, name }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        const emailTrim = email?.trim();
        const nameTrim = name?.trim();
        if (emailTrim) params.set('email', emailTrim);
        if (nameTrim) params.set('name', nameTrim);
        return {
          url: `/coupons/admin/${encodeURIComponent(couponId)}/storefront-users?${params.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: (raw: unknown) => normalizeCouponStorefrontUsersResponse(raw),
      providesTags: (_result, _error, { couponId }) => [
        { type: 'DashboardCouponStorefrontUsers' as const, id: couponId },
      ],
    }),
    createAdminCoupon: builder.mutation<unknown, CreateAdminCouponRequest>({
      query: (body) => ({
        url: '/coupons/admin',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'DashboardCoupons' as const, id: 'LIST' }],
    }),
    whitelistUserForCoupon: builder.mutation<unknown, WhitelistUserForCouponRequest>({
      query: ({ couponId, user_id }) => ({
        url: `/coupons/admin/${encodeURIComponent(couponId)}/users`,
        method: 'POST',
        body: { user_id },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'DashboardCoupons' as const, id: 'LIST' },
        { type: 'DashboardCouponStorefrontUsers' as const, id: arg.couponId },
      ],
    }),
    updateAdminCoupon: builder.mutation<unknown, UpdateAdminCouponRequest>({
      query: ({ id, body }) => ({
        url: `/coupons/admin/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'DashboardCoupons' as const, id: 'LIST' }],
    }),
    deleteAdminCoupon: builder.mutation<unknown, string>({
      query: (id) => ({
        url: `/coupons/admin/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'DashboardCoupons' as const, id: 'LIST' }],
    }),
    removeUserFromCouponWhitelist: builder.mutation<unknown, RemoveWhitelistUserRequest>({
      query: ({ couponId, userId }) => ({
        url: `/coupons/admin/${encodeURIComponent(couponId)}/users/${encodeURIComponent(userId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'DashboardCoupons' as const, id: 'LIST' },
        { type: 'DashboardCouponStorefrontUsers' as const, id: arg.couponId },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAdminCouponUsageQuery,
  useGetAdminCouponsQuery,
  useGetAdminCouponStorefrontUsersQuery,
  useCreateAdminCouponMutation,
  useWhitelistUserForCouponMutation,
  useUpdateAdminCouponMutation,
  useDeleteAdminCouponMutation,
  useRemoveUserFromCouponWhitelistMutation,
} = couponsApiSlice;
