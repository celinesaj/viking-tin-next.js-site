'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { logout, setCredentials } from '@/features/admin-auth/adminAuthSlice';
import { useAdminRefreshMutation } from '@/features/admin-auth/adminAuthApi';
import { isJwtExpired } from '@/features/admin-auth/jwt';

type AdminDashboardGuardProps = {
  children: React.ReactNode;
};

export default function AdminDashboardGuard({ children }: AdminDashboardGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { admin, accessToken, refreshToken, isHydrated } = useAppSelector((state) => state.adminAuth);
  const [refreshAdmin, { isLoading: isRefreshing }] = useAdminRefreshMutation();
  const [isChecking, setIsChecking] = useState(true);
  /** Bumps on an interval so `isJwtExpired(accessToken)` re-evaluates as real time passes (accessToken string alone is unchanged at expiry). */
  const [expiryTick, setExpiryTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setExpiryTick((n) => n + 1);
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const needsRefresh = !accessToken || (expiryTick >= 0 && isJwtExpired(accessToken));

  useEffect(() => {
    if (!isHydrated) return;

    let isActive = true;

    const verifyAdminSession = async () => {
      if (accessToken && !needsRefresh) {
        if (isActive) setIsChecking(false);
        return;
      }

      if (!refreshToken) {
        dispatch(logout());
        router.replace('/admin/login');
        if (isActive) setIsChecking(false);
        return;
      }

      try {
        const data = await refreshAdmin({ refreshToken }).unwrap();
        const nextAdmin = data.admin ?? admin;
        if (!data.access_token || !nextAdmin) {
          throw new Error('Invalid refresh payload');
        }

        dispatch(
          setCredentials({
            admin: nextAdmin,
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? refreshToken,
          }),
        );
      } catch {
        dispatch(logout());
        router.replace('/admin/login');
      } finally {
        if (isActive) setIsChecking(false);
      }
    };

    void verifyAdminSession();

    return () => {
      isActive = false;
    };
  }, [isHydrated, accessToken, refreshToken, needsRefresh, admin, dispatch, router, refreshAdmin]);

  if (!isHydrated || isChecking || isRefreshing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f7]">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-8 py-6 shadow-sm">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-[#d1d5db] border-t-[#111827]"
            aria-hidden="true"
          />
          <p className="text-sm text-[#4b5563]">Checking admin session...</p>
        </div>
      </main>
    );
  }

  if (!accessToken) return null;

  return <>{children}</>;
}
