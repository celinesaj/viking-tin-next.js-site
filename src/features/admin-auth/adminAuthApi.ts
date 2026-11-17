import { api } from '@/store/api';
import type { AdminUser } from '@/features/admin-auth/adminAuthSlice';
import {
  ADMIN_ACCOUNTS_LIST_ENDPOINT,
  ADMIN_CHANGE_PASSWORD_REQUEST_ENDPOINT,
  ADMIN_CHANGE_PASSWORD_VERIFY_ENDPOINT,
  ADMIN_FORGOT_PASSWORD_REQUEST_ENDPOINT,
  ADMIN_FORGOT_PASSWORD_RESET_ENDPOINT,
  ADMIN_FORGOT_PASSWORD_VERIFY_ENDPOINT,
  ADMIN_LOGIN_ENDPOINT,
  ADMIN_REFRESH_ENDPOINT,
} from '@/features/admin-auth/constants';
import type {
  AdminAccountRow,
  AdminAccountsListResponse,
} from '@/types/admin-accounts';

function normalizeAdminAuthResponse(data: unknown): AdminAuthResponse {
  if (!data || typeof data !== 'object' || data === null) {
    throw new Error('Invalid admin auth response');
  }
  const o = data as Record<string, unknown>;
  const accessToken =
    typeof o.access_token === 'string'
      ? o.access_token
      : typeof o.accessToken === 'string'
        ? o.accessToken
        : '';
  const refreshToken =
    typeof o.refresh_token === 'string'
      ? o.refresh_token
      : typeof o.refreshToken === 'string'
        ? o.refreshToken
        : '';
  const admin = o.admin as AdminUser | undefined;
  if (!accessToken || !refreshToken || !admin) {
    throw new Error('Invalid admin auth response');
  }
  return {
    admin,
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

/**
 * Some deployments return camelCase; login uses snake_case. Unify for RTK + callers.
 */
function normalizeAdminRefreshResponse(
  data: unknown,
): Partial<AdminAuthResponse> & { access_token: string; refresh_token?: string } {
  if (!data || typeof data !== 'object' || data === null) {
    throw new Error('Invalid refresh response');
  }
  const o = data as Record<string, unknown>;
  const accessToken =
    typeof o.access_token === 'string'
      ? o.access_token
      : typeof o.accessToken === 'string'
        ? o.accessToken
        : '';
  if (!accessToken) {
    throw new Error('Invalid refresh response');
  }
  const nextRefresh =
    typeof o.refresh_token === 'string'
      ? o.refresh_token
      : typeof o.refreshToken === 'string'
        ? o.refreshToken
        : undefined;
  const nextAdmin = (o.admin as AdminUser) ?? undefined;
  return {
    access_token: accessToken,
    ...(nextRefresh ? { refresh_token: nextRefresh } : {}),
    ...(nextAdmin ? { admin: nextAdmin } : {}),
  };
}

export type AdminLoginRequest = {
  email: string;
  password: string;
};

export type AdminAuthResponse = {
  admin: AdminUser;
  access_token: string;
  refresh_token: string;
};

export type AdminForgotPasswordRequest = {
  email: string;
};

export type AdminForgotPasswordRequestResponse = {
  message: string;
  email: string;
};

export type AdminForgotPasswordVerifyRequest = {
  email: string;
  otp: string;
};

export type AdminForgotPasswordVerifyResponse = {
  message: string;
  reset_token: string;
};

export type AdminForgotPasswordResetRequest = {
  reset_token: string;
  new_password: string;
  confirm_new_password: string;
};

export type AdminChangePasswordRequest = {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
};

export type AdminChangePasswordRequestResponse = {
  message: string;
};

export type AdminChangePasswordVerifyRequest = {
  otp: string;
};

export type AdminChangePasswordVerifyResponse = {
  message: string;
};

export type GetAdminAccountsParams = {
  page?: number;
  limit?: number;
};

function mapAdminAccountFromApi(raw: unknown): AdminAccountRow {
  const r =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const first =
    typeof r.first_name === 'string'
      ? r.first_name
      : typeof r.firstName === 'string'
        ? r.firstName
        : '';
  const last =
    typeof r.last_name === 'string'
      ? r.last_name
      : typeof r.lastName === 'string'
        ? r.lastName
        : '';
  const isActive =
    typeof r.is_active === 'boolean'
      ? r.is_active
      : typeof r.isActive === 'boolean'
        ? r.isActive
        : true;
  return {
    id: r.id != null ? String(r.id) : '',
    first_name: first,
    last_name: last,
    email: typeof r.email === 'string' ? r.email : String(r.email ?? ''),
    phone: typeof r.phone === 'string' ? r.phone : String(r.phone ?? ''),
    role: typeof r.role === 'string' ? r.role : String(r.role ?? ''),
    is_active: isActive,
    created_at:
      r.created_at != null
        ? String(r.created_at)
        : r.createdAt != null
          ? String(r.createdAt)
          : null,
    last_login_at:
      r.last_login_at != null
        ? String(r.last_login_at)
        : r.lastLoginAt != null
          ? String(r.lastLoginAt)
          : null,
  };
}

function normalizeAdminAccountsResponse(raw: unknown): AdminAccountsListResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
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
      data: dataArr.map(mapAdminAccountFromApi),
      pagination: {
        page: Number(p.page) || 1,
        limit: Number(p.limit) || 20,
        total: Number(p.total) || 0,
        totalPages,
      },
    };
  }
  return {
    data: dataArr.map(mapAdminAccountFromApi),
    pagination: {
      page: 1,
      limit: dataArr.length || 20,
      total: dataArr.length,
      totalPages: 1,
    },
  };
}

export const adminAuthApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    adminLogin: builder.mutation<AdminAuthResponse, AdminLoginRequest>({
      query: (body) => ({
        url: ADMIN_LOGIN_ENDPOINT,
        method: 'POST',
        body,
      }),
      transformResponse: normalizeAdminAuthResponse,
    }),
    adminForgotPasswordRequest: builder.mutation<
      AdminForgotPasswordRequestResponse,
      AdminForgotPasswordRequest
    >({
      query: (body) => ({
        url: ADMIN_FORGOT_PASSWORD_REQUEST_ENDPOINT,
        method: 'POST',
        body,
      }),
    }),
    adminForgotPasswordVerify: builder.mutation<
      AdminForgotPasswordVerifyResponse,
      AdminForgotPasswordVerifyRequest
    >({
      query: (body) => ({
        url: ADMIN_FORGOT_PASSWORD_VERIFY_ENDPOINT,
        method: 'POST',
        body,
      }),
    }),
    adminForgotPasswordReset: builder.mutation<
      AdminAuthResponse,
      AdminForgotPasswordResetRequest
    >({
      query: (body) => ({
        url: ADMIN_FORGOT_PASSWORD_RESET_ENDPOINT,
        method: 'POST',
        body,
      }),
      transformResponse: normalizeAdminAuthResponse,
    }),
    adminChangePasswordRequest: builder.mutation<
      AdminChangePasswordRequestResponse,
      AdminChangePasswordRequest
    >({
      query: (body) => ({
        url: ADMIN_CHANGE_PASSWORD_REQUEST_ENDPOINT,
        method: 'POST',
        body,
      }),
    }),
    adminChangePasswordVerify: builder.mutation<
      AdminChangePasswordVerifyResponse,
      AdminChangePasswordVerifyRequest
    >({
      query: (body) => ({
        url: ADMIN_CHANGE_PASSWORD_VERIFY_ENDPOINT,
        method: 'POST',
        body,
      }),
    }),
    adminRefresh: builder.mutation<
      Partial<AdminAuthResponse> & { access_token: string; refresh_token?: string },
      { refreshToken: string }
    >({
      query: ({ refreshToken }) => ({
        url: ADMIN_REFRESH_ENDPOINT,
        method: 'POST',
        body: { refreshToken },
      }),
      transformResponse: normalizeAdminRefreshResponse,
    }),
    getAdminAccounts: builder.query<AdminAccountsListResponse, GetAdminAccountsParams | void>({
      query: (params) => {
        const p = params ?? {};
        return {
          url: ADMIN_ACCOUNTS_LIST_ENDPOINT,
          method: 'GET',
          params: {
            page: String(p.page ?? 1),
            limit: String(p.limit ?? 20),
          },
        };
      },
      transformResponse: (raw: unknown) => normalizeAdminAccountsResponse(raw),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((row) => ({
                type: 'AdminAccount' as const,
                id: row.id,
              })),
              { type: 'AdminAccount' as const, id: 'LIST' },
            ]
          : [{ type: 'AdminAccount' as const, id: 'LIST' }],
    }),
  }),
});

export const {
  useAdminLoginMutation,
  useAdminRefreshMutation,
  useAdminForgotPasswordRequestMutation,
  useAdminForgotPasswordVerifyMutation,
  useAdminForgotPasswordResetMutation,
  useAdminChangePasswordRequestMutation,
  useAdminChangePasswordVerifyMutation,
  useGetAdminAccountsQuery,
} = adminAuthApi;
export {
  ADMIN_ACCOUNTS_LIST_ENDPOINT,
  ADMIN_LOGIN_ENDPOINT,
  ADMIN_REFRESH_ENDPOINT,
  ADMIN_FORGOT_PASSWORD_REQUEST_ENDPOINT,
  ADMIN_FORGOT_PASSWORD_VERIFY_ENDPOINT,
  ADMIN_FORGOT_PASSWORD_RESET_ENDPOINT,
  ADMIN_CHANGE_PASSWORD_REQUEST_ENDPOINT,
  ADMIN_CHANGE_PASSWORD_VERIFY_ENDPOINT,
};
