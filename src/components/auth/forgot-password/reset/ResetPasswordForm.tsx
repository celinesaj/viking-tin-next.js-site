'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useVerifyForgotPasswordMutation } from '@/features/auth/authApi';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const phone = searchParams.get('phone') ?? '';
  const code = searchParams.get('code') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [verifyForgotPassword, { isLoading }] =
    useVerifyForgotPasswordMutation();

  const isNewValid = newPassword.trim().length >= 6;
  const isConfirmValid =
    confirmPassword.trim().length > 0 && confirmPassword === newPassword;
  const isFormValid = isNewValid && isConfirmValid && !!phone && !!code;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!isFormValid) return;

  try {
    const response = await verifyForgotPassword({
      phone,
      otp: code,
      password: newPassword.trim(),
    }).unwrap();

    toast.success(response?.message || 'Password reset successfully.');
    router.replace('/login');
  } catch (err: any) {
    toast.error(err?.data?.message || 'Failed to update password.');
  }
};

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-12 max-w-[760px] rounded-[28px] border border-black/10 bg-white px-6 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] md:px-8 md:py-10"
    >
      <PasswordField
        label="New Password"
        value={newPassword}
        onChange={setNewPassword}
        visible={showNew}
        toggle={() => setShowNew((prev) => !prev)}
      />

      {!isNewValid && newPassword.length > 0 && (
        <p className="mt-3 text-sm text-red-500">
          Password must be at least 6 characters.
        </p>
      )}

      <div className="mt-6">
        <PasswordField
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={showConfirm}
          toggle={() => setShowConfirm((prev) => !prev)}
        />
      </div>

      {!isConfirmValid && confirmPassword.length > 0 && (
        <p className="mt-3 text-sm text-red-500">
          Passwords do not match.
        </p>
      )}

      <button
        type="submit"
        disabled={!isFormValid || isLoading}
        className={`mt-8 inline-flex h-[56px] w-full items-center justify-center rounded-full border border-black px-8 text-[16px] font-semibold uppercase transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isFormValid && !isLoading
            ? 'bg-black text-white hover:bg-white hover:text-black hover:scale-[1.03] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.98]'
            : 'cursor-not-allowed bg-black/30 text-white'
        }`}
      >
        {isLoading ? 'Updating...' : 'Update Password'}
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

function PasswordField({
  label,
  value,
  onChange,
  visible,
  toggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  toggle: () => void;
}) {
  return (
    <div>
      <label className="mb-3 block text-[18px] font-medium text-black">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="h-[60px] w-full rounded-[22px] border border-black bg-white px-5 pr-14 text-[16px] outline-none placeholder:text-black/25"
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-black/60"
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}