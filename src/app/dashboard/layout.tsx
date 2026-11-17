import { Suspense } from 'react';
import DashboardShell from '@/app/dashboard/_components/DashboardShell';
import AdminDashboardGuard from '@/app/dashboard/_components/AdminDashboardGuard';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminDashboardGuard>
      <DashboardShell>
        <Suspense fallback={null}>{children}</Suspense>
      </DashboardShell>
    </AdminDashboardGuard>
  );
}
