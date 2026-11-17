'use client';

import { usePathname } from 'next/navigation';
import AuthBootstrap from '@/store/AuthBootstrap';

function needsAdminAuthBootstrap(pathname: string | null) {
  return (
    pathname?.startsWith('/dashboard') === true ||
    pathname?.startsWith('/admin') === true
  );
}

export default function ConditionalAuthBootstrap() {
  const pathname = usePathname();
  if (!needsAdminAuthBootstrap(pathname)) return null;
  return <AuthBootstrap />;
}
