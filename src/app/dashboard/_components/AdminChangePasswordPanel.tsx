'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useAdminChangePasswordRequestMutation,
  useAdminChangePasswordVerifyMutation,
} from '@/features/admin-auth/adminAuthApi';

export default function AdminChangePasswordPanel() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [requestChange, { isLoading: isRequesting }] =
    useAdminChangePasswordRequestMutation();
  const [verifyChange, { isLoading: isVerifying }] =
    useAdminChangePasswordVerifyMutation();

  const isRequestValid =
    currentPassword.trim().length > 0 &&
    newPassword.trim().length >= 6 &&
    confirmNewPassword.trim().length > 0 &&
    newPassword === confirmNewPassword;
  const isOtpValid = otp.trim().length >= 4;

  const resetAll = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setOtp('');
    setStep('request');
  };

  const handleRequest = async () => {
    if (!isRequestValid) return;

    try {
      const response = await requestChange({
        current_password: currentPassword.trim(),
        new_password: newPassword.trim(),
        confirm_new_password: confirmNewPassword.trim(),
      }).unwrap();
      toast.success(response.message || 'OTP sent to your admin email.');
      setStep('verify');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'data' in err &&
        typeof err.data === 'object' &&
        err.data !== null &&
        'message' in err.data &&
        typeof err.data.message === 'string'
          ? err.data.message
          : 'Failed to start password change.';
      toast.error(message);
    }
  };

  const handleVerify = async () => {
    if (!isOtpValid) return;

    try {
      const response = await verifyChange({ otp: otp.trim() }).unwrap();
      toast.success(response.message || 'Password changed successfully.');
      resetAll();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'data' in err &&
        typeof err.data === 'object' &&
        err.data !== null &&
        'message' in err.data &&
        typeof err.data.message === 'string'
          ? err.data.message
          : 'Failed to verify OTP.';
      toast.error(message);
    }
  };

  return (
    <section className="rounded-xl border border-[#e5e5e5] bg-[#F7F7F7] p-5">
      <div className="mb-5">
        <h2 className="text-base font-semibold">Change Password</h2>
        <p className="mt-1 text-xs text-[#9ca3af]">
          {step === 'request'
            ? 'Step 1: Request OTP with current and new password.'
            : 'Step 2: Verify OTP to apply the new password.'}
        </p>
      </div>

      {step === 'request' ? (
        <div className="space-y-4">
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            visible={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            visible={showNew}
            onToggle={() => setShowNew((v) => !v)}
          />
          <PasswordField
            label="Confirm New Password"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            visible={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />
          {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword ? (
            <p className="text-xs text-red-600">Passwords do not match.</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleRequest()}
              disabled={!isRequestValid || isRequesting}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#111827] px-4 text-sm font-medium text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isRequesting ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#d1d5db] bg-white px-4 text-sm font-medium text-[#374151] transition hover:bg-[#f8fafc]"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#111827]">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-3 text-sm text-[#111827] outline-none transition focus:border-[#111827]/40 focus:ring-2 focus:ring-[#111827]/10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={!isOtpValid || isVerifying}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#111827] px-4 text-sm font-medium text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isVerifying ? 'Verifying...' : 'Verify & Apply'}
            </button>
            <button
              type="button"
              onClick={() => setStep('request')}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#d1d5db] bg-white px-4 text-sm font-medium text-[#374151] transition hover:bg-[#f8fafc]"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#111827]">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white px-3 pr-10 text-sm text-[#111827] outline-none transition focus:border-[#111827]/40 focus:ring-2 focus:ring-[#111827]/10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
