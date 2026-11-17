'use client';

import type { ReactNode } from 'react';
import AccountSidebar from './AccountSidebar';
import { useGetMeQuery } from '@/features/auth/authApi';

type Props = {
  children: ReactNode;
};

export default function AccountShell({ children }: Props) {
  const { isError } = useGetMeQuery();

  if (isError) {
    return (
      <main className="pb-24 pt-10 md:pt-14">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 xl:px-12 2xl:px-16">
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-6 py-5 text-red-600">
            Failed to load account information.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-24 pt-10 md:pt-14">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8 xl:px-12 2xl:px-16">
        <div className="grid gap-6 lg:grid-cols-[430px_minmax(0,1fr)] xl:grid-cols-[470px_minmax(0,1fr)] xl:gap-0">
          <AccountSidebar />

          <section className="min-w-0 border-t border-black/10 px-0 pt-8 lg:border-l lg:border-t-0 lg:px-12 lg:pt-16 xl:px-16">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}