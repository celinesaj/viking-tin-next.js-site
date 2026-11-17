export const ADMIN_ACCOUNTS_LIST_ENDPOINT = '/auth/admin';

export const ADMIN_LOGIN_ENDPOINT = '/auth/admin/login';
export const ADMIN_REFRESH_ENDPOINT =
  process.env.NEXT_PUBLIC_ADMIN_REFRESH_PATH || '/auth/admin/refresh';
export const ADMIN_FORGOT_PASSWORD_REQUEST_ENDPOINT =
  '/auth/admin/forgot-password/request';
export const ADMIN_FORGOT_PASSWORD_VERIFY_ENDPOINT =
  '/auth/admin/forgot-password/verify';
export const ADMIN_FORGOT_PASSWORD_RESET_ENDPOINT =
  '/auth/admin/forgot-password/reset';
export const ADMIN_CHANGE_PASSWORD_REQUEST_ENDPOINT =
  '/auth/admin/change-password/request';
export const ADMIN_CHANGE_PASSWORD_VERIFY_ENDPOINT =
  '/auth/admin/change-password/verify';
