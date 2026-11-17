import { api } from '@/store/api';
import type {
  StorefrontUserAdmin,
  StorefrontUsersAdminResponse,
} from '@/types/storefront-users-admin';

export type GetStorefrontUsersAdminParams = {
  page?: number;
  limit?: number;
};

export function mapStorefrontUserAdminFromApi(raw: unknown): StorefrontUserAdmin {
  const r =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: r.id != null ? String(r.id) : '',
    firstName:
      typeof r.first_name === 'string'
        ? r.first_name
        : typeof r.firstName === 'string'
          ? r.firstName
          : '',
    lastName:
      typeof r.last_name === 'string'
        ? r.last_name
        : typeof r.lastName === 'string'
          ? r.lastName
          : '',
    name:
      typeof r.name === 'string' && r.name.trim()
        ? r.name.trim()
        : [r.first_name, r.last_name].filter(Boolean).join(' ').trim() ||
          String(r.email ?? ''),
    email: typeof r.email === 'string' ? r.email : String(r.email ?? ''),
    phone: typeof r.phone === 'string' ? r.phone : String(r.phone ?? ''),
    phoneVerifiedAt:
      r.phone_verified_at != null
        ? String(r.phone_verified_at)
        : r.phoneVerifiedAt != null
          ? String(r.phoneVerifiedAt)
          : null,
    ageVerifiedAt:
      r.age_verified_at != null
        ? String(r.age_verified_at)
        : r.ageVerifiedAt != null
          ? String(r.ageVerifiedAt)
          : null,
    address: typeof r.address === 'string' ? r.address : String(r.address ?? ''),
    avatarUrl:
      typeof r.avatar_url === 'string'
        ? r.avatar_url
        : typeof r.avatarUrl === 'string'
          ? r.avatarUrl
          : null,
    authProvider:
      typeof r.auth_provider === 'string'
        ? r.auth_provider
        : typeof r.authProvider === 'string'
          ? r.authProvider
          : 'local',
    googleSub:
      typeof r.google_sub === 'string'
        ? r.google_sub
        : typeof r.googleSub === 'string'
          ? r.googleSub
          : null,
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

function normalizeListResponse(raw: unknown): StorefrontUsersAdminResponse {
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
      data: dataArr.map(mapStorefrontUserAdminFromApi),
      pagination: {
        page: Number(p.page) || 1,
        limit: Number(p.limit) || 10,
        total: Number(p.total) || 0,
        totalPages,
      },
    };
  }
  return {
    data: dataArr.map(mapStorefrontUserAdminFromApi),
    pagination: {
      page: 1,
      limit: dataArr.length || 10,
      total: dataArr.length,
      totalPages: 1,
    },
  };
}

export const storefrontUsersAdminApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getStorefrontUsersAdmin: builder.query<
      StorefrontUsersAdminResponse,
      GetStorefrontUsersAdminParams | void
    >({
      query: (params) => {
        const p = params ?? {};
        return {
          url: '/users/admin',
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
                type: 'StorefrontUser' as const,
                id: row.id,
              })),
              { type: 'StorefrontUser' as const, id: 'LIST' },
            ]
          : [{ type: 'StorefrontUser' as const, id: 'LIST' }],
    }),
  }),
});

export const {
  useGetStorefrontUsersAdminQuery,
  useLazyGetStorefrontUsersAdminQuery,
} = storefrontUsersAdminApi;
