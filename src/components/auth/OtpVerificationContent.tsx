'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { useVerifySignupMutation } from '@/features/auth/authApi';

export default function OtpVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = useMemo(() => searchParams.get('email') ?? '', [searchParams]);

  const [otp, setOtp] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [verified, setVerified] = useState(false);

  const [verifySignup, { isLoading }] = useVerifySignupMutation();

  const otpError =
    submitAttempted && otp.trim().length !== 6
      ? 'OTP must be 6 digits.'
      : '';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!email) {
      toast.error('Missing signup email.');
      return;
    }

    if (otp.trim().length !== 6) return;

    try {
      const response = await verifySignup({
        email,
        otp: otp.trim(),
      }).unwrap();

      // ✅ SUCCESS STATE
      setVerified(true);

      // optional redirect after 2.5s
      setTimeout(() => {
        router.replace('/login');
        router.refresh();
      }, 2500);

    } catch (err: any) {
      toast.error(err?.data?.message || 'Invalid or expired OTP.');
    }
  };

  // ✅ SUCCESS SCREEN
  if (verified) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-[140px] w-[140px] items-center justify-center rounded-full bg-black text-white">
          <Check size={64} strokeWidth={3} />
        </div>

        <h2 className="mt-10 text-[26px] font-semibold text-black sm:text-[32px] md:text-[38px]">
          Your email has been verified successfully
        </h2>
      </div>
    );
  }

  // 🔁 NORMAL OTP FORM
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-16 sm:px-6 md:px-0 md:py-24">
      <div className="text-center">
        <h1 className="text-[34px] font-bold uppercase text-black md:text-[56px]">
          OTP Input
        </h1>

        <p className="mx-auto mt-5 max-w-[620px] text-[16px] text-[#8c8c8c]">
          Enter the verification code sent to your phone number.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto mt-14 max-w-[780px]">
        <div>
          <label className="mb-3 block text-[18px] font-medium text-black">
            OTP Number
          </label>

          <div className="flex h-[64px] items-center rounded-full border border-black/60 px-4">
            <div className="mr-3 flex h-[42px] min-w-[58px] items-center justify-center rounded-full border border-black/70 px-3 text-[22px] font-semibold">
              ***
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="Enter Your OTP Number........"
              className="h-full w-full bg-transparent text-[16px] outline-none"
            />
          </div>

          {otpError && (
            <p className="mt-2 text-sm text-red-600">{otpError}</p>
          )}
        </div>

        <div className="mt-14 flex justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className="h-[64px] min-w-[220px] rounded-full bg-black px-10 text-[18px] font-semibold uppercase text-white"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>
    </div>
  );
}