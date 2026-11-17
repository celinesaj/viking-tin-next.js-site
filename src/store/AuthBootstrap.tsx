'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { hydrateAuth } from '@/features/admin-auth/adminAuthSlice';
import {
  clearAdminAuthStorage,
  loadAdminAuthStorage,
  saveAdminAuthStorage,
} from '@/features/admin-auth/adminAuthStorage';

export default function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const { admin, accessToken, refreshToken, isHydrated } = useAppSelector((state) => state.adminAuth);

  useEffect(() => {
    const stored = loadAdminAuthStorage();
    const hasStoredSession =
      !!stored.admin && !!stored.accessToken && !!stored.refreshToken;

    if (hasStoredSession) {
      dispatch(hydrateAuth(stored));
      return;
    }

    // Keep in-memory session when navigating login → dashboard before localStorage sync.
    const hasMemorySession =
      !!admin && !!accessToken && !!refreshToken;

    if (hasMemorySession) {
      dispatch(
        hydrateAuth({
          admin,
          accessToken,
          refreshToken,
        }),
      );
      return;
    }

    dispatch(
      hydrateAuth({
        admin: null,
        accessToken: null,
        refreshToken: null,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; memory session read at first paint only
  }, [dispatch]);

  useEffect(() => {
    if (!isHydrated) return;

    if (admin && accessToken && refreshToken) {
      saveAdminAuthStorage({
        admin,
        accessToken,
        refreshToken,
      });
      return;
    }

    clearAdminAuthStorage();
  }, [admin, accessToken, refreshToken, isHydrated]);

  return null;
}
