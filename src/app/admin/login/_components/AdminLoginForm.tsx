'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useAdminForgotPasswordRequestMutation,
  useAdminForgotPasswordResetMutation,
  useAdminForgotPasswordVerifyMutation,
  useAdminLoginMutation,
  useAdminRefreshMutation,
} from '@/features/admin-auth/adminAuthApi';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { logout, setCredentials } from '@/features/admin-auth/adminAuthSlice';
import { saveAdminAuthStorage } from '@/features/admin-auth/adminAuthStorage';
import { isJwtExpired } from '@/features/admin-auth/jwt';

export default function AdminLoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { admin, accessToken, refreshToken, isHydrated } = useAppSelector((state) => state.adminAuth);
  const [adminLogin, { isLoading: isLoggingIn }] = useAdminLoginMutation();
  const [refreshAdmin] = useAdminRefreshMutation();
  const [forgotPasswordRequest, { isLoading: isRequestingOtp }] =
    useAdminForgotPasswordRequestMutation();
  const [forgotPasswordVerify, { isLoading: isVerifyingOtp }] =
    useAdminForgotPasswordVerifyMutation();
  const [forgotPasswordReset, { isLoading: isResettingPassword }] =
    useAdminForgotPasswordResetMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifySession = async () => {
      if (!isHydrated) return;

      if (accessToken && !isJwtExpired(accessToken)) {
        router.replace('/dashboard');
        return;
      }

      if (!refreshToken) return;

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
        router.replace('/dashboard');
      } catch {
        dispatch(logout());
      }
    };

    void verifySession();
  }, [isHydrated, accessToken, refreshToken, admin, dispatch, router, refreshAdmin]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    try {
      const data = await adminLogin({ email, password }).unwrap();
      const credentials = {
        admin: data.admin,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
      dispatch(setCredentials(credentials));
      saveAdminAuthStorage(credentials);
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'data' in err &&
        typeof err.data === 'object' &&
        err.data !== null &&
        'message' in err.data &&
        typeof err.data.message === 'string'
          ? err.data.message
          : 'Something went wrong while logging in. Please try again.';
      setError(message);
    }
  }

  async function handleForgotPasswordRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    try {
      await forgotPasswordRequest({ email }).unwrap();
      setForgotStep('verify');
    } catch (err) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'data' in err &&
        typeof err.data === 'object' &&
        err.data !== null &&
        'message' in err.data &&
        typeof err.data.message === 'string'
          ? err.data.message
          : 'Unable to send OTP. Please try again.';
      setError(message);
    }
  }

  async function handleForgotPasswordVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    try {
      const data = await forgotPasswordVerify({ email, otp }).unwrap();
      setResetToken(data.reset_token);
      setForgotStep('reset');
    } catch (err) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'data' in err &&
        typeof err.data === 'object' &&
        err.data !== null &&
        'message' in err.data &&
        typeof err.data.message === 'string'
          ? err.data.message
          : 'Invalid OTP. Please try again.';
      setError(message);
    }
  }

  async function handleForgotPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirmation must match.');
      return;
    }

    try {
      const data = await forgotPasswordReset({
        reset_token: resetToken,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      }).unwrap();

      const credentials = {
        admin: data.admin,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
      dispatch(setCredentials(credentials));
      saveAdminAuthStorage(credentials);
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'data' in err &&
        typeof err.data === 'object' &&
        err.data !== null &&
        'message' in err.data &&
        typeof err.data.message === 'string'
          ? err.data.message
          : 'Unable to reset password. Please try again.';
      setError(message);
    }
  }

  function switchToLoginMode() {
    setIsForgotPasswordMode(false);
    setForgotStep('request');
    setOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
  }

  function switchToForgotPasswordMode() {
    setIsForgotPasswordMode(true);
    setForgotStep('request');
    setPassword('');
    setOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
  }

  return (
    <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#d2d7ff] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-14 h-48 w-48 rounded-full bg-[#c9f1de] blur-2xl" />

      <div className="relative">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white text-[#111827]">
          <ShieldCheck size={22} />
        </div>

        <h1 className="text-center text-2xl font-semibold tracking-tight text-[#111827]">
          {isForgotPasswordMode ? 'Reset Admin Password' : 'Admin Login'}
        </h1>
        <p className="mt-2 text-center text-sm text-[#6b7280]">
          {isForgotPasswordMode
            ? 'Complete the 3-step flow to reset your admin password.'
            : 'Sign in to access your Viking Tin admin dashboard.'}
        </p>

        {!isForgotPasswordMode ? (
          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-[#374151]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vikingtin.com"
                className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-white/90 px-3 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none transition focus:border-[#111827]/40 focus:ring-2 focus:ring-[#111827]/10"
                required
                autoComplete="email"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-[#374151]">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-white/90 px-3 pr-11 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none transition focus:border-[#111827]/40 focus:ring-2 focus:ring-[#111827]/10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] transition hover:text-[#111827]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error ? (
              <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="h-11 w-full rounded-xl bg-[#111827] text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoggingIn ? 'Signing in...' : 'Login as Admin'}
            </button>

            <button
              type="button"
              onClick={switchToForgotPasswordMode}
              className="w-full text-center text-sm font-medium text-[#374151] underline-offset-2 hover:underline"
            >
              Forgot password?
            </button>
          </form>
        ) : (
          <form
            className="mt-7 space-y-4"
            onSubmit={
              forgotStep === 'request'
                ? handleForgotPasswordRequest
                : forgotStep === 'verify'
                  ? handleForgotPasswordVerify
                  : handleForgotPasswordReset
            }
          >
            <p className="text-center text-xs font-medium uppercase tracking-wide text-[#6b7280]">
              Step{' '}
              {forgotStep === 'request' ? '1' : forgotStep === 'verify' ? '2' : '3'} of 3
            </p>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-[#374151]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vikingtin.com"
                className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-white/90 px-3 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none transition focus:border-[#111827]/40 focus:ring-2 focus:ring-[#111827]/10"
                required
                autoComplete="email"
                disabled={forgotStep !== 'request'}
              />
            </label>

            {forgotStep === 'verify' ? (
              <label className="block space-y-1">
                <span className="text-sm font-medium text-[#374151]">OTP Code</span>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP code"
                  className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-white/90 px-3 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none transition focus:border-[#111827]/40 focus:ring-2 focus:ring-[#111827]/10"
                  required
                />
              </label>
            ) : null}

            {forgotStep === 'reset' ? (
              <>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-[#374151]">New Password</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-white/90 px-3 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none transition focus:border-[#111827]/40 focus:ring-2 focus:ring-[#111827]/10"
                    required
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-sm font-medium text-[#374151]">
                    Confirm New Password
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-white/90 px-3 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none transition focus:border-[#111827]/40 focus:ring-2 focus:ring-[#111827]/10"
                    required
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-xs font-medium text-[#6b7280] underline-offset-2 hover:underline"
                >
                  {showPassword ? 'Hide passwords' : 'Show passwords'}
                </button>
              </>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isRequestingOtp || isVerifyingOtp || isResettingPassword}
              className="h-11 w-full rounded-xl bg-[#111827] text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {forgotStep === 'request'
                ? isRequestingOtp
                  ? 'Sending OTP...'
                  : 'Send OTP'
                : forgotStep === 'verify'
                  ? isVerifyingOtp
                    ? 'Verifying OTP...'
                    : 'Verify OTP'
                  : isResettingPassword
                    ? 'Resetting Password...'
                    : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={switchToLoginMode}
              className="w-full text-center text-sm font-medium text-[#374151] underline-offset-2 hover:underline"
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
