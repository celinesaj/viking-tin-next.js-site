'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import AuthTextField from '../AuthTextField';
import { useLoginMutation } from '@/features/auth/authApi';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import CountryCodeSelect from '../CountryCodeSelect';



type LoginFormValues = {
  countryCode: string;
  phone: string;
  password: string;
};

const INITIAL_VALUES: LoginFormValues = {
  countryCode: '+971',
  phone: '',
  password: '',
};

export default function LoginForm() {
  const [form, setForm] = useState<LoginFormValues>(INITIAL_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [login, { isLoading }] = useLoginMutation();

  // ---------- VALIDATION ----------
  const errors = useMemo(() => {
    const e: Partial<Record<keyof LoginFormValues, string>> = {};

    const phone = form.phone.trim();

    if (!phone) {
      e.phone = 'Phone number is required';
    } else if (!/^\d+$/.test(phone)) {
      e.phone = 'Phone must contain digits only';
    } else if (phone.length < 7 || phone.length > 12) {
      e.phone = 'Invalid phone length';
    }

    if (!form.password) {
      e.password = 'Password is required';
    }

    return e;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;
  const visibleErrors = submitAttempted ? errors : {};

  const updateField = <K extends keyof LoginFormValues>(
    key: K,
    value: LoginFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ---------- SUBMIT ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (hasErrors) return;

    const fullPhone = `${form.countryCode}${form.phone.trim()}`;

    try {
      const response = await login({
        phone: fullPhone, // 🔥 send as ONE value
        password: form.password,
      }).unwrap();

      toast.success(response.message || 'Logged in successfully');
      window.location.href = '/account';
    } catch (err: any) {
      toast.error(
        err?.data?.message || 'Login failed'
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-[760px] px-4 sm:px-5 md:px-0"
    >
      <div className="space-y-6 md:space-y-8">

        {/* PHONE FIELD */}
        {/* PHONE FIELD */}
        <div>
          <label className="mb-3 block text-[24px] uppercase leading-none font-bold md:text-[28px]">
            Phone Number
          </label>

          <div className="flex gap-3">
            <CountryCodeSelect
              value={form.countryCode}
              onChange={(val) => updateField('countryCode', val)}
            />

            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                updateField('phone', e.target.value.replace(/\D/g, ''))
              }
              placeholder="Enter phone number"
              className={`h-[58px] w-full rounded-[18px] border px-4 text-[16px] outline-none md:h-[64px] ${visibleErrors.phone
                  ? 'border-red-500'
                  : 'border-black/60'
                }`}
            />
          </div>

          {visibleErrors.phone && (
            <p className="mt-2 text-sm text-red-600">
              {visibleErrors.phone}
            </p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <AuthTextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            placeholder="Enter Your Password"
            error={visibleErrors.password}
            onChange={(value: string) => updateField('password', value)}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-black/60 hover:text-black"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="mt-3 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[13px] text-black/60 hover:text-black"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>

      {/* SUBMIT */}
      <div className="mt-10 flex flex-col items-center md:mt-12">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full max-w-[320px] items-center justify-center rounded-full border border-black bg-black px-6 py-4 text-[16px] font-semibold uppercase text-white transition-all duration-300 hover:bg-white hover:text-black hover:scale-[1.02] disabled:opacity-60"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>

        <p className="mt-5 text-center text-[14px] text-[#9c97b2]">
          Don’t Have an Account?{' '}
          <Link href="/create-account" className="font-semibold text-black">
            Create an Account
          </Link>
        </p>
      </div>
    </form>
  );
}