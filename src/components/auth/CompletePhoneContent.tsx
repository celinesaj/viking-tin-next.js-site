'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import CountryCodeSelect from '@/components/auth/CountryCodeSelect';
import {
  useCompletePhoneRequestMutation,
  useCompletePhoneVerifyMutation,
  useLogoutMutation,
} from '@/features/auth/authApi';

export default function CompletePhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = useMemo(
    () => searchParams.get('redirect') || '/account/profile',
    [searchParams]
  );

  const [countryCode, setCountryCode] = useState('+971');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [verified, setVerified] = useState(false);

  const [sendOtp, { isLoading: sending }] =
    useCompletePhoneRequestMutation();

  const [verifyOtp, { isLoading: verifying }] =
    useCompletePhoneVerifyMutation();

  const [logout] = useLogoutMutation();

  const fullPhone = `${countryCode}${phone.trim()}`;

  const phoneError =
    submitAttempted && phone.trim().length < 6
      ? 'Enter a valid phone number.'
      : '';

  const otpError =
    submitAttempted && otp.trim().length !== 6
      ? 'OTP must be 6 digits.'
      : '';

  // ✅ logout + redirect
  const handleSwitchAccount = async () => {
    try {
      await logout().unwrap();
    } catch {
      // ignore
    }

    router.replace('/login');
    router.refresh();
  };

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (phone.trim().length < 6) return;

    try {
      const response = await sendOtp({
        phone: fullPhone,
      }).unwrap();

      toast.success(response.message || 'OTP sent successfully.');
      setSubmitAttempted(false);
      setStep('otp');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (otp.trim().length !== 6) return;

    try {
      const response = await verifyOtp({
        phone: fullPhone,
        otp: otp.trim(),
      }).unwrap();

      toast.success(response.message || 'Phone verified successfully.');
      setVerified(true);

      setTimeout(() => {
        router.replace(redirectTo);
        router.refresh();
      }, 1800);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Invalid or expired OTP.');
    }
  };

  // ✅ success state
  if (verified) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-black text-white sm:h-[140px] sm:w-[140px]">
          <Check size={58} strokeWidth={3} />
        </div>

        <h2 className="mt-8 text-[24px] font-semibold text-black sm:text-[32px] md:text-[38px]">
          Your phone has been verified successfully
        </h2>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-16 sm:px-6 md:px-0 md:py-24">
      <div className="text-center">
        <h1 className="text-[34px] font-bold uppercase text-black md:text-[56px]">
          Complete Profile
        </h1>

        <p className="mx-auto mt-5 max-w-[620px] text-[16px] text-[#8c8c8c]">
          Add and verify your phone number to continue using your account.
        </p>

        {/* ✅ NEW BUTTON */}
        <button
          type="button"
          onClick={handleSwitchAccount}
          className="mt-4 text-[14px] font-medium text-black/60 underline underline-offset-4 hover:text-black"
        >
          Sign in with a different account
        </button>
      </div>

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="mx-auto mt-14 max-w-[780px]">
          <div>
            <label className="mb-3 block text-[18px] font-medium text-black">
              Phone Number
            </label>

            <div className="flex gap-3">
              <CountryCodeSelect
                value={countryCode}
                onChange={setCountryCode}
              />

              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))
                }
                placeholder="Enter Your Phone Number........"
                className={`h-[58px] w-full rounded-[18px] border px-4 text-[16px] outline-none md:h-[64px] ${
                  phoneError ? 'border-red-500' : 'border-black/60'
                }`}
              />
            </div>

            {phoneError && (
              <p className="mt-2 text-sm text-red-600">{phoneError}</p>
            )}
          </div>

          <div className="mt-14 flex justify-center">
            <button
              type="submit"
              disabled={sending}
              className="h-[64px] min-w-[220px] rounded-full bg-black px-10 text-[18px] font-semibold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="mx-auto mt-14 max-w-[780px]">
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

            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setSubmitAttempted(false);
              }}
              className="mt-4 text-[14px] font-medium text-black/60 underline underline-offset-4 hover:text-black"
            >
              Change phone number
            </button>
          </div>

          <div className="mt-14 flex justify-center">
            <button
              type="submit"
              disabled={verifying}
              className="h-[64px] min-w-[220px] rounded-full bg-black px-10 text-[18px] font-semibold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}