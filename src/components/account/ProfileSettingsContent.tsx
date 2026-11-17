'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  useGetMeQuery,
  useUpdateProfileMutation,
} from '@/features/auth/authApi';
import Skeleton from '@/components/common/Skeleton';

export default function ProfileSettingsContent() {
  const { data, isLoading, isError } = useGetMeQuery();
  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateProfileMutation();

  const user = data?.user;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const hasChanges = useMemo(() => {
    if (!user) return false;

    return (
      firstName.trim() !== (user.first_name || '').trim() ||
      lastName.trim() !== (user.last_name || '').trim() ||
      email.trim() !== (user.email || '').trim()
    );
  }, [firstName, lastName, email, user]);

  const isInvalid =
    !firstName.trim() || !lastName.trim() || !email.trim();

  const handleCancel = () => {
    if (!user) return;

    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setEmail(user.email || '');
  };

  const handleUpdate = async () => {
    if (!user) return;

    if (isInvalid) {
      toast.error('First name, last name, and email are required.');
      return;
    }

    if (!hasChanges) {
      toast.error('No changes to save.');
      return;
    }

    try {
      const res = await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
      }).unwrap();

      toast.success(res.message || 'Profile updated successfully.');
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.message ||
        'Failed to update profile.';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-10">
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-6 w-[260px]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-[70px] w-full" />
            <Skeleton className="h-[70px] w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-[70px] w-full" />
            <Skeleton className="h-[70px] w-full" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-[56px] w-[180px]" />
          <Skeleton className="h-[56px] w-[180px]" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return <div className="p-10 text-red-500">Failed to load profile.</div>;
  }

  return (
    <div className="max-w-[760px]">
      <p className="text-[15px] text-[#8c8c8c]">
        Home <span className="mx-2">{'>'}</span>
        <span className="text-black">Profile Setting</span>
      </p>

      <h1 className="mt-14 text-[42px] font-bold uppercase leading-none tracking-[-0.03em] text-black md:text-[64px]">
        Profile Setting
      </h1>

      <p className="mt-6 max-w-[720px] text-[18px] leading-[1.5] text-[#8c8c8c]">
        Update your account information.
      </p>

      <div className="mt-14 space-y-9">
        <div>
          <label className="block text-[20px] font-medium text-black md:text-[22px]">
            First Name
          </label>

          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isUpdating}
            className="mt-4 h-[68px] w-full rounded-[26px] border border-black bg-transparent px-6 text-[20px] text-black outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-[20px] font-medium text-black md:text-[22px]">
            Last Name
          </label>

          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isUpdating}
            className="mt-4 h-[68px] w-full rounded-[26px] border border-black bg-transparent px-6 text-[20px] text-black outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-[20px] font-medium text-black md:text-[22px]">
            E-mail
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isUpdating}
            className="mt-4 h-[68px] w-full rounded-[26px] border border-black bg-transparent px-6 text-[20px] text-black outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      <div className="mt-16 flex flex-wrap gap-4 justify-center ">
        <button
          type="button"
          onClick={handleUpdate}
          disabled={isUpdating || isInvalid || !hasChanges}
          className="inline-flex h-[56px] min-w-[150px] items-center justify-center rounded-full bg-black px-8 text-[18px] font-semibold uppercase text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isUpdating ? 'Saving...' : 'Change'}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isUpdating || !hasChanges}
          className="inline-flex h-[56px] min-w-[150px] items-center justify-center rounded-full border border-black bg-transparent px-8 text-[18px] font-semibold uppercase text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}