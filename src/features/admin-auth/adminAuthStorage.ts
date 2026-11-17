import type { AdminUser } from '@/features/admin-auth/adminAuthSlice';

const ADMIN_AUTH_STORAGE_KEY = 'viking_tin_admin_auth';

type StoredAdminAuth = {
  admin: AdminUser;
  accessToken: string;
  refreshToken: string;
};

function isBrowser() {
  return typeof window !== 'undefined';
}

export function loadAdminAuthStorage(): {
  admin: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
} {
  if (!isBrowser()) {
    return { admin: null, accessToken: null, refreshToken: null };
  }

  try {
    const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    if (!raw) {
      return { admin: null, accessToken: null, refreshToken: null };
    }

    const parsed = JSON.parse(raw) as Partial<StoredAdminAuth>;
    if (!parsed?.admin || !parsed?.accessToken || !parsed?.refreshToken) {
      return { admin: null, accessToken: null, refreshToken: null };
    }

    return {
      admin: parsed.admin,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
    };
  } catch {
    return { admin: null, accessToken: null, refreshToken: null };
  }
}

export function saveAdminAuthStorage(payload: StoredAdminAuth) {
  if (!isBrowser()) return;
  localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function clearAdminAuthStorage() {
  if (!isBrowser()) return;
  localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
}
