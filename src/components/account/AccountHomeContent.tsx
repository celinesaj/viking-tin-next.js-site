'use client';

import Link from 'next/link';
import { useGetMeQuery } from '@/features/auth/authApi';

export default function AccountHomeContent() {
  const { data, isError } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  const user = data?.user;

  if (isError) {
    return (
      <div className="max-w-[860px]">
        <p className="text-[15px] text-[#8c8c8c]">
          Home <span className="mx-2">{'>'}</span>
          <span className="text-black">My Account</span>
        </p>

        <h1 className="mt-14 text-[42px] font-bold uppercase leading-none tracking-[-0.03em] text-black md:text-[64px]">
          My Account
        </h1>

        <p className="mt-6 max-w-[720px] text-[18px] leading-[1.5] text-red-500">
          Failed to load your account information.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[860px]">
      <p className="text-[15px] text-[#8c8c8c]">
        Home <span className="mx-2">{'>'}</span>
        <span className="text-black">My Account</span>
      </p>

      <h1 className="mt-14 text-[42px] font-bold uppercase leading-none tracking-[-0.03em] text-black md:text-[64px]">
        My Account
      </h1>

      <div className="mt-6 max-w-[720px] space-y-2">
        {user ? (
          <>
            <p className="text-[18px] leading-[1.5] text-[#8c8c8c]">
              Welcome back,{' '}
              <span className="font-semibold text-black">
                {user.first_name} {user.last_name}
              </span>
              .
            </p>

            <p className="text-[16px] leading-[1.5] text-[#8c8c8c]">
              Signed in as <span className="text-black">{user.email}</span>
            </p>
          </>
        ) : (
          <>
            <div className="h-5 w-[320px] animate-pulse rounded bg-black/10" />
            <div className="h-5 w-[220px] animate-pulse rounded bg-black/10" />
          </>
        )}
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        <Link
          href="/account/profile"
          className="group rounded-[26px] border border-black/10 bg-white px-6 py-6 transition-all duration-300 hover:bg-black hover:text-white"
        >
          <p className="text-[14px] uppercase text-black/45 transition-colors duration-300 group-hover:text-white/70">
            Profile
          </p>
          <h3 className="mt-3 text-[24px] font-bold uppercase text-black transition-colors duration-300 group-hover:text-white">
            Personal Info
          </h3>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#7f7f7f] transition-colors duration-300 group-hover:text-white/80">
            Update your display name and review your account information.
          </p>
        </Link>

        <Link
          href="/account/address-book"
          className="group rounded-[26px] border border-black/10 bg-white px-6 py-6 transition-all duration-300 hover:bg-black hover:text-white"
        >
          <p className="text-[14px] uppercase text-black/45 transition-colors duration-300 group-hover:text-white/70">
            Addresses
          </p>
          <h3 className="mt-3 text-[24px] font-bold uppercase text-black transition-colors duration-300 group-hover:text-white">
            Address Book
          </h3>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#7f7f7f] transition-colors duration-300 group-hover:text-white/80">
            Save and manage multiple delivery addresses.
          </p>
        </Link>

        <Link
          href="/account/order-history"
          className="group rounded-[26px] border border-black/10 bg-white px-6 py-6 transition-all duration-300 hover:bg-black hover:text-white"
        >
          <p className="text-[14px] uppercase text-black/45 transition-colors duration-300 group-hover:text-white/70">
            Orders
          </p>
          <h3 className="mt-3 text-[24px] font-bold uppercase text-black transition-colors duration-300 group-hover:text-white">
            Order History
          </h3>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#7f7f7f] transition-colors duration-300 group-hover:text-white/80">
            Track your recent purchases and review item details.
          </p>
        </Link>

        <Link
          href="/account/change-password"
          className="group rounded-[26px] border border-black/10 bg-white px-6 py-6 transition-all duration-300 hover:bg-black hover:text-white"
        >
          <p className="text-[14px] uppercase text-black/45 transition-colors duration-300 group-hover:text-white/70">
            Security
          </p>
          <h3 className="mt-3 text-[24px] font-bold uppercase text-black transition-colors duration-300 group-hover:text-white">
            Password
          </h3>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#7f7f7f] transition-colors duration-300 group-hover:text-white/80">
            Keep your account secure by changing your password.
          </p>
        </Link>
      </div>
    </div>
  );
}