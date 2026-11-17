'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useChangePasswordRequestMutation,
  useChangePasswordVerifyMutation,
} from '@/features/auth/authApi';

export default function ChangePasswordContent() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetPhone, setTargetPhone] = useState('');

  const [requestChangePassword, { isLoading: isRequesting }] =
    useChangePasswordRequestMutation();

  const [verifyChangePassword, { isLoading: isVerifying }] =
    useChangePasswordVerifyMutation();

  const isOldValid = oldPassword.trim().length > 0;
  const isNewValid = newPassword.trim().length >= 6;
  const isConfirmValid =
    confirmPassword.trim().length > 0 && confirmPassword === newPassword;

  const isFormValid = isOldValid && isNewValid && isConfirmValid;
  const isOtpValid = otp.trim().length >= 4;

  const resetAll = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setStep('form');
    setTargetEmail('');
    setTargetPhone('');
  };

  const handleRequest = async () => {
    if (!isFormValid) return;

    try {
      const response = await requestChangePassword({
        old_password: oldPassword.trim(),
        password: newPassword.trim(),
        confirm_password: confirmPassword.trim(),
      }).unwrap();

      toast.success(response.message || 'Verification code sent.');
      setTargetEmail(response.email || '');
      setTargetPhone(response.phone || '');
      setStep('otp');
    } catch (err: any) {
      toast.error(
        err?.data?.message || 'Failed to start password change.'
      );
    }
  };

  const handleVerify = async () => {
    if (!isOtpValid) return;

    try {
      const response = await verifyChangePassword({
        otp: otp.trim(),
      }).unwrap();

      toast.success(response.message || 'Password changed successfully.');
      resetAll();
    } catch (err: any) {
      toast.error(
        err?.data?.message || 'Failed to verify code.'
      );
    }
  };

  return (
    <div className="max-w-[760px]">
      <p className="text-[15px] text-[#8c8c8c]">
        Home <span className="mx-2">{'>'}</span>
        <span className="text-black">Change Password</span>
      </p>

      <h1 className="mt-14 text-[42px] font-bold uppercase leading-none tracking-[-0.03em] text-black md:text-[64px]">
        Change Password
      </h1>

      <p className="mt-6 max-w-[720px] text-[18px] leading-[1.5] text-[#8c8c8c]">
        Update your password to keep your account secure.
      </p>

      {step === 'form' ? (
        <>
          <div className="mt-14 space-y-9">
            <PasswordField
              label="Old Password"
              value={oldPassword}
              onChange={setOldPassword}
              visible={showOld}
              toggle={() => setShowOld((p) => !p)}
            />

            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              visible={showNew}
              toggle={() => setShowNew((p) => !p)}
            />

            {!isNewValid && newPassword.length > 0 && (
              <p className="text-sm text-red-500">
                Password must be at least 6 characters
              </p>
            )}

            <PasswordField
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showConfirm}
              toggle={() => setShowConfirm((p) => !p)}
            />

            {!isConfirmValid && confirmPassword.length > 0 && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
          </div>

          <div className="mt-16 flex flex-wrap gap-4 justify-center">
            <button
              type="button"
              onClick={handleRequest}
              disabled={!isFormValid || isRequesting}
              className={`inline-flex h-[56px] min-w-[150px] items-center justify-center rounded-full border border-black px-8 text-[18px] font-semibold uppercase transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isFormValid && !isRequesting
                  ? 'bg-black text-white hover:scale-[1.03] hover:bg-white hover:text-black hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.98]'
                  : 'cursor-not-allowed bg-black/30 text-white'
              }`}
            >
              {isRequesting ? 'Sending...' : 'Change'}
            </button>

            <button
              type="button"
              onClick={resetAll}
              className="inline-flex h-[56px] min-w-[150px] items-center justify-center rounded-full border border-black bg-transparent px-8 text-[18px] font-semibold uppercase text-black transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.03] hover:bg-black hover:text-white hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-14">
            <label className="block text-[20px] font-medium text-black md:text-[22px]">
              Verification Code
            </label>

            <p className="mt-3 text-[15px] leading-[1.6] text-[#8c8c8c]">
              We sent a verification code to{' '}
              <span className="font-medium text-black">
                {targetEmail || targetPhone}
              </span>
              .
            </p>

            <div className="relative mt-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="h-[68px] w-full rounded-[26px] border border-black bg-transparent px-6 text-[20px] text-black outline-none placeholder:text-[#a0a0b8]"
              />
            </div>

            {!isOtpValid && otp.length > 0 && (
              <p className="mt-2 text-sm text-red-500">
                Please enter a valid verification code
              </p>
            )}
          </div>

          <div className="mt-16 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={handleVerify}
              disabled={!isOtpValid || isVerifying}
              className={`inline-flex h-[56px] min-w-[150px] items-center justify-center rounded-full border border-black px-8 text-[18px] font-semibold uppercase transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isOtpValid && !isVerifying
                  ? 'bg-black text-white hover:scale-[1.03] hover:bg-white hover:text-black hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.98]'
                  : 'cursor-not-allowed bg-black/30 text-white'
              }`}
            >
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="inline-flex h-[56px] min-w-[150px] items-center justify-center rounded-full border border-black bg-transparent px-8 text-[18px] font-semibold uppercase text-black transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.03] hover:bg-black hover:text-white hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-[0.98]"
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
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
  onChange: (v: string) => void;
  visible: boolean;
  toggle: () => void;
}) {
  return (
    <div>
      <label className="block text-[20px] font-medium text-black md:text-[22px]">
        {label}
      </label>

      <div className="relative mt-4">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[68px] w-full rounded-[26px] border border-black bg-transparent px-6 pr-14 text-[20px] text-black outline-none"
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-black/60"
        >
          {visible ? <EyeOff size={22} /> : <Eye size={22} />}
        </button>
      </div>
    </div>
  );
}