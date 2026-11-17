'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLogoutMutation, useGetMeQuery } from '@/features/auth/authApi';

const menuItems = [
  { label: 'Profile Settings', href: '/account/profile' },
  { label: 'Address Book', href: '/account/address-book' },
  { label: 'Order History', href: '/account/order-history' },
  { label: 'Change Password', href: '/account/change-password' },
];

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { data } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  const user = data?.user;
  const displayName =
    user?.name?.trim() ||
    `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() ||
    'My Account';
  const displayEmail = user?.email || '';

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (e) {
      // even if API fails, force logout UI-side
    } finally {
      setShowLogoutModal(false);
      setIsOpen(false);
      // router.replace('/login');
      // router.refresh();
      window.location.replace('/login');
    }
  };

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-[54px] w-full items-center justify-between rounded-[18px] border border-black/10 bg-white px-5 text-left"
        >
          <span className="text-[16px] font-semibold uppercase text-black">
            My Account
          </span>

          <span className="text-[22px] leading-none text-black">☰</span>
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 lg:hidden ${
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* MOBILE SIDE MENU */}
      <div
        className={`fixed left-0 top-0 z-[60] h-full w-[86%] max-w-[340px] overflow-y-auto bg-white transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-5">
          <h3 className="text-[18px] font-bold uppercase text-black">
            My Account
          </h3>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[28px] leading-none text-black"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="pb-8 pt-6">
          <div className="flex flex-col items-center px-4 text-center">
            <div className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-black text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-[62px] w-[62px]"
              >
                <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-3.866 0-7 2.239-7 5v1h14v-1c0-2.761-3.134-5-7-5Z" />
              </svg>
            </div>

            <h2 className="mt-5 text-[24px] font-bold uppercase leading-none tracking-[-0.03em] text-black">
              {displayName}
            </h2>

            <p className="mt-3 max-w-full break-all text-[14px] leading-none text-[#8d8d8d]">
              {displayEmail}
            </p>
          </div>

          <div className="mt-10 border-t border-black/10">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="relative flex min-h-[68px] items-center border-b border-black/10 px-5 text-[16px] font-semibold uppercase tracking-[-0.01em] transition-colors duration-300 hover:bg-black hover:text-white"
                >
                  <span
                    className={`transition-colors duration-300 ${
                      isActive ? 'text-black hover:text-white' : 'text-[#8a8a8a]'
                    }`}
                  >
                    {item.label}
                  </span>

                  {isActive ? (
                    <span className="absolute right-0 top-1/2 h-[40px] w-[8px] -translate-y-1/2 bg-black" />
                  ) : null}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="flex min-h-[68px] w-full items-center border-b border-black/10 px-5 text-left text-[16px] font-semibold uppercase tracking-[-0.01em] text-[#b42318] transition-colors duration-300 hover:bg-black hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden pb-8 pt-4 lg:block lg:pb-0 lg:pt-20">
        <div className="flex flex-col items-center px-4 text-center lg:px-10">
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-black text-white md:h-[140px] md:w-[140px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-[78px] w-[78px] md:h-[88px] md:w-[88px]"
            >
              <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-3.866 0-7 2.239-7 5v1h14v-1c0-2.761-3.134-5-7-5Z" />
            </svg>
          </div>

          <h2 className="mt-6 text-[24px] font-bold uppercase leading-none tracking-[-0.03em] text-black md:text-[30px]">
            {displayName}
          </h2>

          <p className="mt-3 max-w-full break-all text-[16px] leading-none text-[#8d8d8d] md:text-[18px]">
            {displayEmail}
          </p>
        </div>

        <div className="mt-14 border-t border-black/10">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex min-h-[74px] items-center border-b border-black/10 px-4 text-[18px] font-semibold uppercase tracking-[-0.01em] transition-colors duration-300 hover:bg-black hover:text-white md:px-8 lg:px-10"
              >
                <span
                  className={`transition-colors duration-300 ${
                    isActive ? 'text-black' : 'text-[#8a8a8a]'
                  }`}
                >
                  {item.label}
                </span>

                {isActive ? (
                  <span className="absolute right-0 top-1/2 h-[44px] w-[10px] -translate-y-1/2 bg-black" />
                ) : null}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex min-h-[74px] w-full items-center border-b border-black/10 px-4 text-left text-[18px] font-semibold uppercase tracking-[-0.01em] text-[#b42318] transition-colors duration-300 hover:bg-black hover:text-white md:px-8 lg:px-10"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* LOGOUT MODAL */}
      <div
        className={`fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 transition-opacity duration-300 ${
          showLogoutModal
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setShowLogoutModal(false)}
      >
        <div
          className={`w-full max-w-[420px] rounded-[24px] bg-white p-6 text-center shadow-2xl transition-all duration-300 ${
            showLogoutModal
              ? 'translate-y-0 scale-100 opacity-100'
              : 'translate-y-4 scale-[0.96] opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-[24px] font-bold uppercase text-black">
            Logout
          </h3>

          <p className="mt-3 text-[15px] leading-[1.6] text-[#7f7f7f]">
            Are you sure you want to log out of your account?
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="inline-flex h-[52px] flex-1 items-center justify-center rounded-full border border-black/15 bg-white px-6 text-[14px] font-semibold uppercase text-black transition-all duration-300 hover:bg-black hover:text-white"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex h-[52px] flex-1 items-center justify-center rounded-full bg-black px-6 text-[14px] font-semibold uppercase text-white transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? 'Logging out...' : 'Confirm Logout'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}