'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useForgotPasswordMutation } from '@/features/auth/authApi';

const RESEND_SECONDS = 120;

export default function VerifyResetCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const phone = searchParams.get('phone') ?? '';

  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const [forgotPassword, { isLoading: isResending }] =
    useForgotPasswordMutation();

  const isFormValid = code.trim().length >= 4;
  const canResend = secondsLeft === 0;

  useEffect(() => {
    if (secondsLeft === 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;

    router.push(
      `/forgot-password/reset?phone=${encodeURIComponent(
        phone
      )}&code=${encodeURIComponent(code.trim())}`
    );
  };

  const handleResendCode = async () => {
    if (!canResend || isResending || !phone) return;

    try {
      const response = await forgotPassword({ phone }).unwrap();
      toast.success(response.message || 'Code resent successfully.');
      setSecondsLeft(RESEND_SECONDS);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to resend code.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-12 max-w-[760px] rounded-[28px] border border-black/10 bg-white px-6 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] md:px-8 md:py-10"
    >
      <div>
        <label className="mb-3 block text-[18px] font-medium text-black">
          Verification Code
        </label>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter verification code"
          className="h-[60px] w-full rounded-[22px] border border-black bg-white px-5 text-[16px] outline-none placeholder:text-black/25"
        />

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-black/55">
            {canResend ? (
              'You can resend the code now.'
            ) : (
              <>
                Resend available in{' '}
                <span className="font-semibold text-black">{formattedTime}</span>
              </>
            )}
          </p>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={!canResend || isResending}
            className={`inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-[13px] font-semibold uppercase transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              canResend && !isResending
                ? 'border-black bg-black text-white hover:scale-[1.03] hover:bg-white hover:text-black hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.98]'
                : 'cursor-not-allowed border-black/15 bg-black/10 text-black/35'
            }`}
          >
            {isResending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormValid}
        className={`mt-8 inline-flex h-[56px] w-full items-center justify-center rounded-full border border-black px-8 text-[16px] font-semibold uppercase transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isFormValid
            ? 'bg-black text-white hover:scale-[1.03] hover:bg-white hover:text-black hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.98]'
            : 'cursor-not-allowed bg-black/30 text-white'
        }`}
      >
        Verify Code
      </button>

      <div className="mt-5 flex justify-center">
        <Link
          href="/forgot-password"
          className="text-[15px] font-medium text-black/60 transition hover:text-black"
        >
          Back
        </Link>
      </div>
    </form>
  );
}