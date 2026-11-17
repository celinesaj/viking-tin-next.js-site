'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import CountryCodeSelect from '../CountryCodeSelect';
import { useForgotPasswordMutation } from '@/features/auth/authApi';

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [countryCode, setCountryCode] = useState('+971');
  const [phone, setPhone] = useState('');

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  // ✅ clean ONLY phone
  const cleanedPhone = phone.replace(/\D/g, '');

  // ✅ keep + in country code
  const fullPhone = `${countryCode}${cleanedPhone}`;

  const isPhoneValid = cleanedPhone.length >= 7;
  const isFormValid = isPhoneValid;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      const response = await forgotPassword({
        phone: fullPhone,
      }).unwrap();

      toast.success(response.message || 'Verification code sent.');

      router.push(
        `/forgot-password/verify?phone=${encodeURIComponent(fullPhone)}`
      );
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send reset code.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-12 max-w-[760px] rounded-[28px] border border-black/10 bg-white px-6 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] md:px-8 md:py-10"
    >
      <div>
        <label className="mb-3 block text-[18px] font-medium text-black">
          Phone Number
        </label>

        <div className="flex gap-3">
          <CountryCodeSelect value={countryCode} onChange={setCountryCode} />

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter phone number"
            className="h-[58px] flex-1 rounded-[18px] border border-black bg-white px-5 text-[16px] outline-none placeholder:text-black/25 md:h-[64px]"
          />
        </div>

        {!isPhoneValid && phone.length > 3 && (
          <p className="mt-3 text-sm text-red-500">
            Please enter a valid phone number.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className={`mt-8 inline-flex h-[56px] w-full items-center justify-center rounded-full px-8 text-[16px] font-semibold uppercase border border-black transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isFormValid && !isLoading
            ? 'bg-black text-white hover:bg-white hover:text-black hover:scale-[1.03] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.98]'
            : 'cursor-not-allowed bg-black/30 text-white'
        }`}
      >
        {isLoading ? 'Sending...' : 'Send Code'}
      </button>

      <div className="mt-5 flex justify-center">
        <Link
          href="/login"
          className="text-[15px] font-medium text-black/60 transition hover:text-black"
        >
          Back to Login
        </Link>
      </div>
    </form>
  );
}