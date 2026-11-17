import type { ReactNode } from 'react';
import TopMarquee from '@/components/layout/topMarquee';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AccountShell from '@/components/account/AccountShell';

export default function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <TopMarquee />
      <Header />
      <AccountShell>{children}</AccountShell>
      <Footer />
    </>
  );
}